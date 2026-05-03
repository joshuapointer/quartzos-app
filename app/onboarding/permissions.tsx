import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { State as BleState } from 'react-native-ble-plx';

import { bleManager } from '../../src/ble/BleManager';

import { ChromeButton, GlassCard, QBackground } from '../../src/design';
import { colors, fonts, spacing } from '../../src/design/tokens';
import { requestNotificationPermissions } from '../../src/notifications/channels';

type PermState = 'unknown' | 'granted' | 'denied' | 'blocked';

async function requestBlePermission(): Promise<PermState> {
  // react-native-ble-plx handles permission prompts via its native layer the
  // first time we interact with the manager. Using the singleton's probeState()
  // avoids constructing + destroying a throwaway manager, which would reset the
  // shared native CBCentralManager singleton and leave it in `Resetting`.
  try {
    const state = await bleManager.probeState();
    // On iOS, state === Unauthorized means blocked; PoweredOn/PoweredOff implies granted.
    // On Android, permission prompts surface during scan; we treat PoweredOn as green light.
    if (state === BleState.Unauthorized) return 'blocked';
    if (state === BleState.Unsupported) return 'denied';
    return 'granted';
  } catch {
    return 'denied';
  }
}

export default function PermissionsScreen() {
  const router = useRouter();
  const [bleState, setBleState] = useState<PermState>('unknown');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Soft-check current state on mount; don't prompt yet.
    let cancelled = false;
    (async () => {
      try {
        const state = await bleManager.probeState();
        if (cancelled) return;
        if (state === BleState.Unauthorized) setBleState('blocked');
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const ble = await requestBlePermission();
      setBleState(ble);
      if (ble === 'blocked') return;

      await requestNotificationPermissions().catch(() => false);

      router.replace('/(connected)/home');
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings().catch(() => {
      /* ignore */
    });
  };

  const blocked = bleState === 'blocked';

  return (
    <View style={styles.root}>
      <QBackground />
      <View style={styles.screen}>
        <GlassCard padding={28} style={styles.card}>
          <Text style={styles.title}>Wake the Dab Rite</Text>
          <Text style={styles.body}>
            Quartzie reads your rig over Bluetooth and surfaces the moment your
            quartz hits dab or dunk.
          </Text>

          <View style={styles.permRow}>
            <Text style={styles.permTitle}>Bluetooth</Text>
            <Text style={styles.permCopy}>
              Live temperature, preset sync, and device settings.
            </Text>
          </View>
          <View style={styles.permRow}>
            <Text style={styles.permTitle}>Notifications</Text>
            <Text style={styles.permCopy}>
              Loud alarms when the app is asleep in the background.
            </Text>
          </View>

          {blocked ? (
            <ChromeButton
              label="Open Settings"
              onPress={handleOpenSettings}
              style={styles.cta}
            />
          ) : (
            <ChromeButton
              label="Allow Permissions"
              onPress={handleAllow}
              loading={requesting}
              variant="secondary"
              style={styles.cta}
            />
          )}

          {blocked ? (
            <Text style={styles.hint}>
              Bluetooth was denied. Enable it in Settings to continue.
            </Text>
          ) : Platform.OS === 'android' ? (
            <Text style={styles.hint}>
              Android may also ask for location — it&apos;s required for BLE scanning.
            </Text>
          ) : null}
        </GlassCard>
      </View>
    </View>
  );
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
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  permRow: {
    width: '100%',
    marginBottom: spacing.md,
  },
  permTitle: {
    ...fonts.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  permCopy: {
    ...fonts.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  hint: {
    ...fonts.caption,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
