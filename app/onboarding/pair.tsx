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
  type Device,
  State as BleState,
} from 'react-native-ble-plx';

import { ChromeButton, GlassCard, QBackground } from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { bleManager } from '../../src/ble/BleManager';
import { SERVICE_UUID } from '../../src/ble/constants';
import { useBleStore } from '../../src/state/bleStore';
import { StaticDialSilhouette, type DialSilhouetteState } from '../../src/design/components/StaticDialSilhouette';

const EMPTY_TIMEOUT_MS = 10_000;
const storage = new MMKV({ id: 'quartzos' });

type Found = { id: string; name: string; rssi: number | null };

export default function PairScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<Found[]>([]);
  const [empty, setEmpty] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [dialState, setDialState] = useState<DialSilhouetteState>('connecting');
  const [connectError, setConnectError] = useState<string | null>(null);
  const scannerRef = useRef<RNBleManager | null>(null);
  const emptyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Ensure BLE powered before scanning; retry on state change if not yet on.
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
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
      scannerRef.current?.stopDeviceScan();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [startScan]);

  const handleConnect = useCallback(
    async (deviceId: string) => {
      setConnecting(deviceId);
      setConnectError(null);
      // Stop scanning — do NOT call destroy() here; it resets the shared native
      // BLE singleton and leaves the global bleManager unable to connect.
      scannerRef.current?.stopDeviceScan();
      scannerRef.current = null;

      try {
        await bleManager.connectToDevice(deviceId);
        const state = useBleStore.getState().connectionState;
        if (state === 'READY' || state === 'SUBSCRIBING' || state === 'DISCOVERING') {
          storage.set('lastDeviceId', deviceId);
          // Flash connected state on dial for 600ms — ceremonial handoff moment
          setDialState('connected');
          if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
          handoffTimerRef.current = setTimeout(() => {
            handoffTimerRef.current = null;
            router.replace('/(connected)/home');
          }, 600);
        } else {
          setConnectError("Couldn't reach device. Try again.");
        }
      } catch {
        setConnectError("Couldn't reach device. Try again.");
      } finally {
        setConnecting(null);
      }
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <QBackground />
      {/* Dial silhouette — brightens through connecting → connected states */}
      <View style={styles.dialLayer} pointerEvents="none">
        <StaticDialSilhouette state={dialState} size={280} />
      </View>
      <View style={styles.screen}>
        <GlassCard padding={24} style={styles.card}>
          <Text style={styles.title}>Listening for your rig</Text>
          <Text style={styles.body}>
            Power the Dab Rite on and keep it close.
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
                Nothing in range. Wake the rig and try again.
              </Text>
            ) : null}
            {connectError ? (
              <Text style={styles.errorHint}>{connectError}</Text>
            ) : null}
          </ScrollView>

          {empty ? (
            <ChromeButton
              label="Retry"
              onPress={startScan}
              variant="secondary"
              style={styles.retry}
            />
          ) : null}
        </GlassCard>
      </View>
    </View>
  );
}

interface RowProps {
  device: Found;
  onPress: () => void;
  loading: boolean;
}

const BAR_ACTIVE_COLORS = [
  colors.boneGhost, // bar 0 — weakest
  colors.boneGhost, // bar 1
  colors.boneDim,   // bar 2
  colors.boneMid,   // bar 3 — strongest
] as const;
const BAR_INACTIVE = 'rgba(109,96,80,0.15)';

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
      {loading ? <Text style={styles.rowStatus}>Waking…</Text> : null}
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
  dialLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '5%',
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
  },
  body: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
    backgroundColor: colors.glassFill,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rowPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
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
  errorHint: {
    ...fonts.caption,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  retry: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
