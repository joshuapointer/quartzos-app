import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BleManager as RNBleManager } from 'react-native-ble-plx';

import { ChromeButton, GlassCard, QBackground } from '../../src/design';
import { colors, fonts, spacing } from '../../src/design/tokens';
import { requestNotificationPermissions } from '../../src/notifications/channels';
import { StaticDialSilhouette } from '../../src/design/components/StaticDialSilhouette';

type PermState = 'unknown' | 'granted' | 'denied' | 'blocked';

async function requestBlePermission(): Promise<PermState> {
  // react-native-ble-plx handles permission prompts via its native layer the
  // first time we interact with the manager. Creating a manager and listening
  // for state transitions is the portable way to trigger the prompt.
  try {
    const mgr = new RNBleManager();
    const state = await mgr.state();
    // On iOS, state === 'Unauthorized' means blocked; 'PoweredOn'/'PoweredOff' implies granted.
    // On Android, permission prompts surface during scan; we treat 'PoweredOn' as green light.
    mgr.destroy();
    if (state === 'Unauthorized') return 'blocked';
    if (state === 'Unsupported') return 'denied';
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
        const mgr = new RNBleManager();
        const state = await mgr.state();
        mgr.destroy();
        if (cancelled) return;
        if (state === 'Unauthorized') setBleState('blocked');
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

      router.replace('/onboarding/pair');
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
      {/* Dial silhouette — dim background layer matching home screen positioning */}
      <View style={styles.dialLayer} pointerEvents="none">
        <StaticDialSilhouette state="idle" size={280} />
      </View>
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
  dialLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    // Slight upward bias so dial center sits ~45% down, matching home layout
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
