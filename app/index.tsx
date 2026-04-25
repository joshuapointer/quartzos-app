import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { MMKV } from 'react-native-mmkv';

import { QuartzBackground } from '../src/design';
import { colors, fonts, spacing } from '../src/design/tokens';
import { bleManager } from '../src/ble/BleManager';
import { useBleStore } from '../src/state/bleStore';

const AUTO_CONNECT_TIMEOUT_MS = 3000;

const storage = new MMKV({ id: 'quartzos' });

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!navigationState?.key) return; // navigator not yet mounted

    let connectTimeout: ReturnType<typeof setTimeout> | undefined;
    let unsub: (() => void) | undefined;

    // Defer one tick so the navigation container is fully ready for dispatch
    const init = setTimeout(() => {
      const lastDeviceId = storage.getString('lastDeviceId');

      if (!lastDeviceId) {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          router.replace('/onboarding/permissions');
        }
        return;
      }

      void bleManager.connectToDevice(lastDeviceId).catch(() => {});

      connectTimeout = setTimeout(() => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        const state = useBleStore.getState().connectionState;
        router.replace(state === 'READY' ? '/(connected)/home' : '/(modals)/scan');
      }, AUTO_CONNECT_TIMEOUT_MS);

      unsub = useBleStore.subscribe((s) => {
        if (s.connectionState === 'READY' && !navigatedRef.current) {
          navigatedRef.current = true;
          clearTimeout(connectTimeout);
          router.replace('/(connected)/home');
        }
      });
    }, 0);

    return () => {
      clearTimeout(init);
      clearTimeout(connectTimeout);
      unsub?.();
    };
  }, [router, navigationState?.key]);

  return (
    <QuartzBackground>
      <View style={styles.center}>
        <Text style={styles.wordmark}>QUARTZIE</Text>
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
