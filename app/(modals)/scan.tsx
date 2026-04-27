import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MMKV } from 'react-native-mmkv';
import {
  BleManager as RNBleManager,
  State as BleState,
} from 'react-native-ble-plx';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ChromeButton, GlassCard, QBackground } from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { bleManager } from '../../src/ble/BleManager';
import { SERVICE_UUID } from '../../src/ble/constants';
import { useBleStore } from '../../src/state/bleStore';

const EMPTY_TIMEOUT_MS = 10_000;
const storage = new MMKV({ id: 'quartzos' });

type Found = { id: string; name: string; rssi: number | null };

// Scan state machine for orb tinting
type ScanState = 'scanning' | 'devices-found' | 'connecting' | 'connected';

const BAR_ACTIVE_COLORS = [
  colors.boneGhost, // bar 0 — weakest
  colors.boneGhost, // bar 1
  colors.boneDim,   // bar 2
  colors.boneMid,   // bar 3 — strongest
] as const;
const BAR_INACTIVE = 'rgba(109,96,80,0.15)';

// Numeric indices for interpolateColor input range
const SCAN_STATE_INDEX: Record<ScanState, number> = {
  'scanning':      0,
  'devices-found': 1,
  'connecting':    2,
  'connected':     3,
};

export default function ScanModal() {
  const router = useRouter();
  const [devices, setDevices] = useState<Found[]>([]);
  const [empty, setEmpty] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const scannerRef = useRef<RNBleManager | null>(null);
  const emptyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive scan state
  const scanState: ScanState = connected
    ? 'connected'
    : connecting !== null
      ? 'connecting'
      : devices.length > 0
        ? 'devices-found'
        : 'scanning';

  const startScan = useCallback(() => {
    setDevices([]);
    setEmpty(false);

    scannerRef.current?.destroy();
    const mgr = new RNBleManager();
    scannerRef.current = mgr;

    const begin = () => {
      mgr.startDeviceScan([SERVICE_UUID], null, (err, device) => {
        if (err || !device) return;
        setDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) {
            return prev.map((d) =>
              d.id === device.id ? { ...d, rssi: device.rssi } : d,
            );
          }
          return [
            ...prev,
            {
              id: device.id,
              name: device.name ?? device.localName ?? 'Dab Rite',
              rssi: device.rssi,
            },
          ];
        });
      });
    };

    void mgr.state().then((state) => {
      if (state === BleState.PoweredOn) {
        begin();
      } else {
        const sub = mgr.onStateChange((s) => {
          if (s === BleState.PoweredOn) {
            sub.remove();
            begin();
          }
        }, true);
      }
    });

    if (emptyTimerRef.current) clearTimeout(emptyTimerRef.current);
    emptyTimerRef.current = setTimeout(() => {
      setDevices((prev) => {
        if (prev.length === 0) setEmpty(true);
        return prev;
      });
    }, EMPTY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    startScan();
    return () => {
      if (emptyTimerRef.current) clearTimeout(emptyTimerRef.current);
      if (connectedTimerRef.current) clearTimeout(connectedTimerRef.current);
      scannerRef.current?.stopDeviceScan();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [startScan]);

  const handleConnect = useCallback(
    async (deviceId: string) => {
      setConnecting(deviceId);
      // Stop scanning only — destroy() resets the shared native BLE singleton.
      scannerRef.current?.stopDeviceScan();
      scannerRef.current = null;

      // Swap device: disconnect current if any, then connect to the new one.
      try {
        await bleManager.disconnect();
      } catch {
        /* ignore */
      }

      try {
        await bleManager.connectToDevice(deviceId);
        const state = useBleStore.getState().connectionState;
        if (state === 'READY' || state === 'SUBSCRIBING' || state === 'DISCOVERING') {
          storage.set('lastDeviceId', deviceId);
          // Brief amber flash before routing
          setConnected(true);
          connectedTimerRef.current = setTimeout(() => {
            router.replace('/(connected)/home');
          }, 600);
          return;
        }
      } finally {
        setConnecting(null);
      }
    },
    [router],
  );

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(connected)/home');
    }
  }, [router]);

  return (
    <View style={styles.root}>
      <QBackground />
      <View style={styles.screen}>
        <GlassCard padding={24} style={styles.card}>
          <CrystalOrb scanState={scanState} />
          <ScanCaption scanState={scanState} />
          <Text style={styles.title}>Find a Dab Rite</Text>
          <Text style={styles.body}>
            Tap a device to swap your active connection.
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {devices.map((d) => (
              <DeviceRow
                key={d.id}
                device={d}
                onPress={() => handleConnect(d.id)}
                loading={connecting === d.id}
              />
            ))}
            {empty && devices.length === 0 ? (
              <Text style={styles.emptyHint}>
                No devices found. Make sure your Dab Rite is on and nearby.
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.buttonRow}>
            {empty ? (
              <ChromeButton
                label="Retry"
                onPress={startScan}
                variant="secondary"
                style={styles.rowBtn}
              />
            ) : null}
            <ChromeButton
              label="Close"
              onPress={handleClose}
              variant="ghost"
              style={styles.rowBtn}
            />
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

// ── CrystalOrb ──────────────────────────────────────────────────────────────

interface OrbProps {
  scanState: ScanState;
}

function CrystalOrb({ scanState }: OrbProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);
  const tintProgress = useSharedValue(SCAN_STATE_INDEX['scanning']);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.18, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tintProgress.value = withTiming(SCAN_STATE_INDEX[scanState], { duration: 500 });
  }, [scanState, tintProgress]);

  const inner = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      tintProgress.value,
      [0, 1, 2, 3],
      [
        colors.quartzDim,   // scanning
        colors.quartzMid,   // devices-found
        colors.coldSlate,   // connecting
        colors.firedAmber,  // connected — brief amber flash
      ],
    ),
  }));

  const ring = useAnimatedStyle(() => ({
    opacity: glow.value,
    borderColor: interpolateColor(
      tintProgress.value,
      [0, 1, 2, 3],
      [
        colors.quartzDim,
        colors.quartzMid,
        colors.coldSlate,
        colors.firedAmber,
      ],
    ),
  }));

  return (
    <View style={styles.orbWrap}>
      <Animated.View style={[styles.orbRing, ring]} />
      <Animated.View style={[styles.orb, inner]} />
    </View>
  );
}

// ── Scan caption ─────────────────────────────────────────────────────────────

interface CaptionProps {
  scanState: ScanState;
}

function ScanCaption({ scanState }: CaptionProps) {
  const [longEmpty, setLongEmpty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After 5s of scanning with no results, swap to nudge copy
  useEffect(() => {
    if (scanState === 'scanning') {
      timerRef.current = setTimeout(() => setLongEmpty(true), 5000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setLongEmpty(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scanState]);

  const captionOpacity = useSharedValue(1);

  useEffect(() => {
    // Fade out when devices are found; fade in otherwise
    captionOpacity.value = withTiming(
      scanState === 'devices-found' || scanState === 'connected' ? 0 : 1,
      { duration: 400 },
    );
  }, [scanState, captionOpacity]);

  const captionStyle = useAnimatedStyle(() => ({
    opacity: captionOpacity.value,
  }));

  const label = longEmpty
    ? 'MAKE SURE YOUR RIG IS POWERED ON'
    : scanState === 'connecting'
      ? 'CONNECTING…'
      : 'LISTENING FOR DAB RITE…';

  const labelColor = longEmpty ? colors.boneGhost : colors.boneMid;

  return (
    <Animated.Text style={[styles.scanCaption, { color: labelColor }, captionStyle]}>
      {label}
    </Animated.Text>
  );
}

// ── DeviceRow ────────────────────────────────────────────────────────────────

interface RowProps {
  device: Found;
  onPress: () => void;
  loading: boolean;
}

function DeviceRow({ device, onPress, loading }: RowProps) {
  const bars = rssiToBars(device.rssi);
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{device.name}</Text>
        <Text style={styles.rowId}>{device.id}</Text>
      </View>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 6 + i * 4,
                backgroundColor: i < bars ? BAR_ACTIVE_COLORS[i] : BAR_INACTIVE,
              },
            ]}
          />
        ))}
      </View>
      {loading ? <Text style={styles.rowStatus}>Connecting…</Text> : null}
    </Pressable>
  );
}

function rssiToBars(rssi: number | null): number {
  if (rssi == null) return 0;
  if (rssi >= -55) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
  },
  title: {
    ...fonts.h1,
    color: colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  body: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  orbWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  orbRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  scanCaption: {
    ...fonts.labelCaps,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  list: {
    alignSelf: 'stretch',
    maxHeight: 260,
    marginTop: spacing.sm,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    ...fonts.body,
    color: colors.onSurface,
    fontWeight: '600',
  },
  rowId: {
    ...fonts.caption,
    color: colors.outline,
    marginTop: 2,
  },
  rowStatus: {
    ...fonts.caption,
    color: colors.boneMid,
    marginLeft: spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginLeft: spacing.sm,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    // color set per-bar in render based on signal strength
    backgroundColor: BAR_INACTIVE,
  },
  emptyHint: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  rowBtn: {
    flex: 1,
  },
});
