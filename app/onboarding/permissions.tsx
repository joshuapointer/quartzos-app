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
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { ChromeButton, GlassCard, QBackground } from '../../src/design';
import { colors, fonts, spacing } from '../../src/design/tokens';
import { requestNotificationPermissions } from '../../src/notifications/channels';

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
      <View style={styles.screen}>
        <GlassCard padding={28} style={styles.card}>
          <View style={styles.iconWrap}>
            <CrystalBleIcon />
          </View>
          <Text style={styles.title}>Connect your Dab Rite</Text>
          <Text style={styles.body}>
            Quartzie reads your Dab Rite over Bluetooth and fires notifications the
            instant you hit dab or dunk temp.
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
              Loud alarms even when the app is in the background.
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

function CrystalBleIcon() {
  return (
    <Svg width={96} height={96} viewBox="0 0 96 96">
      <Defs>
        <SvgGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f4ede4" stopOpacity={0.85} />
          <Stop offset="0.6" stopColor="#c7b8a4" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#8A4E16" stopOpacity={0.8} />
        </SvgGradient>
        <SvgGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(244,237,228,0.6)" stopOpacity={1} />
          <Stop offset="1" stopColor="rgba(244,237,228,0)" stopOpacity={1} />
        </SvgGradient>
      </Defs>
      <Circle cx={48} cy={48} r={44} fill="url(#crystal)" stroke="rgba(244,237,228,0.4)" strokeWidth={1.5} />
      <Circle cx={48} cy={36} r={28} fill="url(#gloss)" />
      {/* Bluetooth glyph */}
      <Path
        d="M40 28 L56 44 L40 60 V36 L56 52 L40 68"
        stroke="#050403"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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
  iconWrap: {
    marginBottom: spacing.md,
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
