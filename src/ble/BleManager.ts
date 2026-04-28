import { Buffer } from 'buffer';
import {
  BleManager as RNBleManager,
  ConnectionPriority,
  Device,
  type Characteristic,
  type Subscription,
} from 'react-native-ble-plx';

import * as sessionsDb from '../db/sessions';
import { alarmService } from '../notifications/AlarmService';
import { useBleStore } from '../state/bleStore';
import { useSessionStore } from '../state/sessionStore';
import { useSettingsStore } from '../state/settingsStore';
import { validateAlarms } from '../utils/temperature';
import { ConnectionStateMachine } from './ConnectionStateMachine';
import {
  ATT_MTU,
  CHAR_FF01_UUID,
  CHAR_FF02_UUID,
  FRAME_SETTINGS_LEN,
  FRAME_TEMP_LEN,
  MAX_RECONNECT_ATTEMPTS,
  QUERY_INTERVAL_MS,
  RECONNECT_DELAYS_MS,
  SERVICE_UUID,
  TYPE_QUERY_REPLY,
  TYPE_WRITE_ACK,
  WRITE_ACK_TIMEOUT_MS,
} from './constants';
import {
  decodeSettings,
  decodeTempStream,
  encodeQuerySettings,
  encodeWriteAll,
  encodeWriteColors,
  fragmentFrame,
} from './DabRiteProtocol';
import type { ConnectionState, DeviceSettings, RGB565 } from './types';

type QueuedCommand = {
  frame: Uint8Array;
  resolve: () => void;
  reject: (err: Error) => void;
  retriesLeft: number;
  label: string;
};

const IDLE_TEMP_GRACE_MS = 30_000;
const SESSION_START_TEMP_F = 150;

class CommandQueue {
  private queue: QueuedCommand[] = [];
  private inflight: QueuedCommand | null = null;
  private ackTimer: ReturnType<typeof setTimeout> | null = null;
  private ackReceived = false;

  constructor(
    private readonly send: (frame: Uint8Array) => Promise<void>,
  ) {}

  enqueue(frame: Uint8Array, label: string, retries = 1): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ frame, resolve, reject, retriesLeft: retries, label });
      void this.pump();
    });
  }

  /** Called by BleManager on WRITE_ACK arrival. Guards against duplicate ACKs
   *  when both FF01 and FF02 deliver the same WRITE_ACK notification. */
  resolveAck(): void {
    if (!this.inflight) return;
    if (this.ackReceived) return;  // duplicate ACK from FF02 echo — ignore
    this.ackReceived = true;
    this.clearAckTimer();
    const done = this.inflight;
    this.inflight = null;
    done.resolve();
    void this.pump();
  }

  /** Drop all pending commands (e.g. on disconnect). */
  flush(err: Error): void {
    this.clearAckTimer();
    if (this.inflight) {
      this.inflight.reject(err);
      this.inflight = null;
    }
    const pending = this.queue.splice(0);
    for (const cmd of pending) cmd.reject(err);
  }

  private clearAckTimer(): void {
    if (this.ackTimer) {
      clearTimeout(this.ackTimer);
      this.ackTimer = null;
    }
  }

  private async pump(): Promise<void> {
    if (this.inflight) return;
    const next = this.queue.shift();
    if (!next) return;
    this.inflight = next;
    this.ackReceived = false;  // reset for each new in-flight command

    try {
      await this.send(next.frame);
    } catch (err) {
      this.inflight = null;
      const error = err instanceof Error ? err : new Error(String(err));
      if (next.retriesLeft > 0) {
        next.retriesLeft -= 1;
        this.queue.unshift(next);
        void this.pump();
      } else {
        next.reject(error);
        void this.pump();
      }
      return;
    }

    if (this.inflight !== next) return; // was flushed while we were sending

    // Wait for ACK (or timeout -> retry/reject).
    this.ackTimer = setTimeout(() => {
      this.ackTimer = null;
      const timedOut = this.inflight;
      if (!timedOut) return;
      this.inflight = null;
      if (timedOut.retriesLeft > 0) {
        timedOut.retriesLeft -= 1;
        this.queue.unshift(timedOut);
        void this.pump();
      } else {
        timedOut.reject(
          new Error(`BLE write timed out (${timedOut.label}) after ${WRITE_ACK_TIMEOUT_MS}ms`),
        );
        void this.pump();
      }
    }, WRITE_ACK_TIMEOUT_MS);
  }
}

export class BleManager {
  private static instance: BleManager | null = null;

  private readonly rnBle = new RNBleManager();
  private readonly sm = new ConnectionStateMachine();
  private readonly commandQueue: CommandQueue;

  private device: Device | null = null;
  private ff01Sub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;
  private negotiatedMtu: number = ATT_MTU + 3; // BLE chunk size = mtu - 3 ATT bytes

  private queryInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private querySettingsReceived = false;
  private lastDeviceId: string | null = null;
  private intentionalDisconnect = false;

  private idleTempSince: number | null = null;
  private currentSessionId: string | null = null;

  private constructor() {
    this.commandQueue = new CommandQueue((frame) => this.sendFrame(frame));
    this.sm.onTransition((_, next) => {
      useBleStore.getState().setConnectionState(next);
    });
  }

  static getInstance(): BleManager {
    if (!BleManager.instance) BleManager.instance = new BleManager();
    return BleManager.instance;
  }

  // --- public API ------------------------------------------------------------

  startScan(): void {
    if (this.sm.current !== 'IDLE') return;
    this.setState('SCANNING');
    this.rnBle.startDeviceScan([SERVICE_UUID], null, (error, scanned) => {
      if (error) {
        this.rnBle.stopDeviceScan();
        this.setState('ERROR');
        return;
      }
      if (!scanned) return;
      // First match wins.
      this.rnBle.stopDeviceScan();
      void this.connectToDevice(scanned.id);
    });
  }

  stopScan(): void {
    this.rnBle.stopDeviceScan();
    if (this.sm.current === 'SCANNING') this.setState('IDLE');
  }

  async connectToDevice(deviceId: string): Promise<void> {
    this.lastDeviceId = deviceId;
    this.intentionalDisconnect = false;
    if (this.sm.current === 'SCANNING') {
      this.rnBle.stopDeviceScan();
    }
    if (this.sm.current === 'RECONNECTING') {
      this.setState('CONNECTING');
    } else if (this.sm.current !== 'CONNECTING') {
      // from SCANNING or IDLE
      if (this.sm.canTransition('CONNECTING')) {
        this.setState('CONNECTING');
      } else {
        return;
      }
    }

    try {
      const device = await this.rnBle.connectToDevice(deviceId, { timeout: 15000 });
      this.device = device;
      useBleStore.getState().setConnectedDevice(device.id);

      this.disconnectSub = this.rnBle.onDeviceDisconnected(device.id, () => {
        this.handleDisconnected();
      });

      this.setState('DISCOVERING');
      await this.rnBle.discoverAllServicesAndCharacteristicsForDevice(device.id);

      this.setState('SUBSCRIBING');
      this.subscribeCharacteristics(device.id);

      try {
        await device.requestConnectionPriority(ConnectionPriority.High);
      } catch (e) {
        // Non-fatal — log and continue
        console.warn('[BLE] requestConnectionPriority failed:', e);
      }

      // iOS auto-negotiates MTU at connect time; requestMTU is a no-op there but harmless.
      // On Android, default is 23 — we must explicitly request a larger MTU so the 22-byte
      // WRITE_ALL frame fits in a single write (preventing fragmented writes that crash firmware).
      this.negotiatedMtu = device.mtu && device.mtu >= ATT_MTU + 3 ? device.mtu : ATT_MTU + 3;
      try {
        const negotiated = await device.requestMTU(185);
        if (negotiated.mtu && negotiated.mtu > 0) {
          this.negotiatedMtu = negotiated.mtu;
        }
        console.log('[BLE] MTU is', this.negotiatedMtu);
      } catch (e) {
        console.warn('[BLE] requestMTU failed; using', this.negotiatedMtu, e);
      }

      this.setState('READY');
      this.reconnectAttempts = 0;
      this.querySettingsReceived = false;

      // Kick off QUERY_SETTINGS and start polling.
      await this.enqueueQuerySettings();
      this.startQueryPoll();

      // Try to read RSSI (best effort).
      void this.rnBle.readRSSIForDevice(device.id).then((dev) => {
        if (dev.rssi != null) useBleStore.getState().setRssi(dev.rssi);
      }).catch(() => {
        /* ignore */
      });
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.clearReconnect();
    this.stopQueryPoll();
    this.commandQueue.flush(new Error('disconnected'));
    this.teardownSubscriptions();
    const device = this.device;
    this.device = null;
    useBleStore.getState().setConnectedDevice(null);

    if (device) {
      this.intentionalDisconnect = true;
      try {
        await this.rnBle.cancelDeviceConnection(device.id);
      } catch {
        /* ignore */
      }
    }
    if (this.sm.canTransition('IDLE')) this.setState('IDLE');
  }

  async writeSettings(settings: DeviceSettings): Promise<void> {
    if (!this.device) throw new Error('BLE not connected');
    // Defense-in-depth: enforce the dunk = dab - 10 cross-field constraint
    // before encoding. encodeWriteAll already clamps each field to 100..900,
    // but it doesn't enforce the cross-field rule.
    const { dab, dunk } = validateAlarms(settings.dabAlarmF, settings.dunkAlarmF);
    const validated: DeviceSettings = {
      ...settings,
      dabAlarmF: dab,
      dunkAlarmF: dunk,
    };
    const frame = encodeWriteAll(validated);
    await this.commandQueue.enqueue(frame, 'WRITE_ALL');
  }

  /**
   * Persist the in-memory session to SQLite and zero out the in-memory
   * session state. Safe to call when no session is active (no-op).
   *
   * Exposed as a public static method so the AppState handler in
   * `app/_layout.tsx` can flush on backgrounding without poking the
   * BleManager's internals. Reuses `currentSessionId`, the same path
   * the BLE-driven idle teardown uses.
   */
  static async flushActiveSession(): Promise<void> {
    const inst = BleManager.instance;
    if (!inst) return;
    if (!useSessionStore.getState().active) return;
    await inst.endSession();
  }

  async writeColors(
    colors: [RGB565, RGB565, RGB565, RGB565],
  ): Promise<void> {
    if (!this.device) return;
    const frame = encodeWriteColors(colors);
    await this.commandQueue.enqueue(frame, 'WRITE_COLORS');
  }

  destroy(): void {
    this.clearReconnect();
    this.stopQueryPoll();
    this.commandQueue.flush(new Error('destroyed'));
    this.teardownSubscriptions();
    this.device = null;
    try {
      this.rnBle.destroy();
    } catch {
      /* ignore */
    }
    BleManager.instance = null;
  }

  // --- internals -------------------------------------------------------------

  private setState(next: ConnectionState): void {
    if (this.sm.current === next) return;
    if (!this.sm.canTransition(next)) return;
    this.sm.transition(next);
  }

  private subscribeCharacteristics(deviceId: string): void {
    this.teardownCharacteristicSubs();

    this.ff01Sub = this.rnBle.monitorCharacteristicForDevice(
      deviceId,
      SERVICE_UUID,
      CHAR_FF01_UUID,
      (error, ch) => {
        if (error || !ch) return;
        this.handleFf01(ch);
      },
    );
  }

  private handleFf01(ch: Characteristic): void {
    const bytes = decodeBase64(ch.value);
    if (!bytes) return;

    if (bytes.length === FRAME_TEMP_LEN) {
      const tempF = decodeTempStream(bytes);
      if (tempF == null) return;
      this.onTempSample(tempF);
      return;
    }

    if (bytes.length === FRAME_SETTINGS_LEN) {
      const type = bytes[2];
      if (type === TYPE_WRITE_ACK) {
        this.commandQueue.resolveAck();
        return;
      }
      if (type === TYPE_QUERY_REPLY) {
        const settings = decodeSettings(bytes);
        if (settings) {
          useSettingsStore.getState().setSettings(settings);
          this.querySettingsReceived = true;
          this.stopQueryPoll();
        }
      }
    }
  }

  private onTempSample(tempF: number): void {
    useBleStore.getState().setLiveTempF(tempF);
    useSessionStore.getState().addSample(tempF);

    const { settings } = useSettingsStore.getState();
    alarmService.onTemp(tempF, settings.dabAlarmF, settings.dunkAlarmF);

    const sessionStore = useSessionStore.getState();
    if (tempF >= SESSION_START_TEMP_F && !sessionStore.active) {
      this.startSession();
      this.idleTempSince = null;
    } else if (tempF === 0 && sessionStore.active) {
      if (this.idleTempSince == null) this.idleTempSince = Date.now();
      if (Date.now() - this.idleTempSince >= IDLE_TEMP_GRACE_MS) {
        void this.endSession();
        this.idleTempSince = null;
      }
    } else if (tempF > 0) {
      this.idleTempSince = null;
    }
  }

  private startSession(): void {
    const { settings } = useSettingsStore.getState();
    useSessionStore.getState().startSession();
    this.currentSessionId = null;
    void sessionsDb
      .create({
        startedAt: Date.now(),
        peakTempF: 0,
        dabAlarmF: settings.dabAlarmF,
        dunkAlarmF: settings.dunkAlarmF,
        samples: [],
        alerts: [],
      })
      .then((rec) => {
        this.currentSessionId = rec.id;
      })
      .catch(() => {
        /* ignore DB errors; in-memory session still active */
      });
  }

  private async endSession(): Promise<void> {
    const state = useSessionStore.getState();
    const { peakF, samples } = state;
    state.endSession();
    alarmService.resetSession();
    const id = this.currentSessionId;
    this.currentSessionId = null;
    if (!id) return;
    try {
      await sessionsDb.end(id, Date.now(), peakF, samples, []);
    } catch {
      /* ignore */
    }
  }

  private async enqueueQuerySettings(): Promise<void> {
    try {
      await this.commandQueue.enqueue(encodeQuerySettings(), 'QUERY_SETTINGS');
    } catch {
      /* swallow — poll will retry */
    }
  }

  private startQueryPoll(): void {
    this.stopQueryPoll();
    this.queryInterval = setInterval(() => {
      if (this.querySettingsReceived) {
        this.stopQueryPoll();
        return;
      }
      void this.enqueueQuerySettings();
    }, QUERY_INTERVAL_MS);
  }

  private stopQueryPoll(): void {
    if (this.queryInterval) {
      clearInterval(this.queryInterval);
      this.queryInterval = null;
    }
  }

  /** Writes a frame to FF02 in ATT-sized fragments. */
  private async sendFrame(frame: Uint8Array): Promise<void> {
    const device = this.device;
    if (!device) throw new Error('BLE not connected');
    const chunkSize = Math.max(this.negotiatedMtu - 3, ATT_MTU);
    const chunks = fragmentFrame(frame, chunkSize);
    for (const chunk of chunks) {
      const b64 = Buffer.from(chunk).toString('base64');
      await this.rnBle.writeCharacteristicWithResponseForDevice(
        device.id,
        SERVICE_UUID,
        CHAR_FF02_UUID,
        b64,
      );
    }
  }

  private handleDisconnected(): void {
    if (this.sm.current === 'IDLE') return;
    this.commandQueue.flush(new Error('disconnected'));
    this.stopQueryPoll();
    this.teardownCharacteristicSubs();
    this.device = null;
    useBleStore.getState().setConnectedDevice(null);
    if (this.intentionalDisconnect) {
      this.intentionalDisconnect = false;
      this.disconnectSub?.remove();
      this.disconnectSub = null;
      return;
    }
    this.disconnectSub?.remove();
    this.disconnectSub = null;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.lastDeviceId) {
      if (this.sm.canTransition('IDLE')) this.setState('IDLE');
      return;
    }
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (this.sm.canTransition('ERROR')) this.setState('ERROR');
      return;
    }

    if (this.sm.canTransition('RECONNECTING')) {
      this.setState('RECONNECTING');
    }

    const idx = Math.min(this.reconnectAttempts, RECONNECT_DELAYS_MS.length - 1);
    const delay = RECONNECT_DELAYS_MS[idx];
    this.reconnectAttempts += 1;

    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.lastDeviceId) return;
      void this.connectToDevice(this.lastDeviceId);
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private teardownCharacteristicSubs(): void {
    this.ff01Sub?.remove();
    this.ff01Sub = null;
  }

  private teardownSubscriptions(): void {
    this.teardownCharacteristicSubs();
    this.disconnectSub?.remove();
    this.disconnectSub = null;
  }
}

function decodeBase64(value: string | null | undefined): Uint8Array | null {
  if (!value) return null;
  try {
    return new Uint8Array(Buffer.from(value, 'base64'));
  } catch {
    return null;
  }
}

export const bleManager = BleManager.getInstance();
