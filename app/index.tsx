import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { createMMKV } from 'react-native-mmkv';

import { QuartzBackground } from '../src/design';
import { colors, fonts, spacing } from '../src/design/tokens';
import { bleManager } from '../src/ble/BleManager';
import { useBleStore } from '../src/state/bleStore';

const AUTO_CONNECT_TIMEOUT_MS = 3000;

const storage = createMMKV({ id: 'quartzos' });

export default function Index() {
  const router = useRouter();
  const navigatedRef = useRef(false);

  useEffect(() => {
    const lastDeviceId = storage.getString('lastDeviceId');

    // No saved device: go to onboarding.
    if (!lastDeviceId) {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.replace('/onboarding/permissions');
      }
      return;
    }

    // Try to auto-connect to last known device.
    void bleManager.connectToDevice(lastDeviceId).catch(() => {
      /* swallow — we'll fall through to the scan modal on timeout */
    });

    const timeout = setTimeout(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const state = useBleStore.getState().connectionState;
      if (state === 'READY') {
        router.replace('/(connected)/home');
      } else {
        router.replace('/(modals)/scan');
      }
    }, AUTO_CONNECT_TIMEOUT_MS);

    // If we hit READY before timeout, jump immediately.
    const unsub = useBleStore.subscribe((s) => {
      if (s.connectionState === 'READY' && !navigatedRef.current) {
        navigatedRef.current = true;
        clearTimeout(timeout);
        router.replace('/(connected)/home');
      }
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [router]);

  return (
    <QuartzBackground>
      <View style={styles.center}>
        <Text style={styles.wordmark}>QuartzOS</Text>
        <Text style={styles.tagline}>Connecting…</Text>
      </View>
    </QuartzBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  wordmark: {
    ...fonts.display,
    fontSize: 52,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    ...fonts.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
});
