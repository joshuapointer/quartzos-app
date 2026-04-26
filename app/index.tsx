import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { MMKV } from 'react-native-mmkv';

import { spacing } from '../src/design/tokens';
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
    <View style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.wordmark}>quartzie</Text>
        <Text style={styles.tagline}>Connecting…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050403',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 42,
    fontWeight: '400',
    color: '#e8dfd2',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: '#9e907e',
    marginTop: 12,
    fontFamily: 'Menlo',
  },
});
