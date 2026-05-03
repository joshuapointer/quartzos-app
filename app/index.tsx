/**
 * app/index.tsx
 *
 * Single entrypoint for the molten flow. Probes BLE state once and redirects
 * to either the connected home or onboarding/permissions, then steps out of
 * the way — MoltenSurface owns the rest of the experience.
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { State as BleState } from 'react-native-ble-plx';

import { bleManager } from '../src/ble/BleManager';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

type Target = '/(connected)/home' | '/onboarding/permissions';

export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Quick non-blocking probe: try to construct the BLE manager. If state
      // is `Unauthorized` (iOS denied) or `Unsupported`, route to permissions;
      // otherwise go to home and let the prompt fire on first scan.
      let next: Target = '/(connected)/home';
      try {
        const state = await bleManager.probeState();
        if (state === BleState.Unauthorized || state === BleState.Unsupported) {
          next = '/onboarding/permissions';
        }
      } catch {
        // Probe failed — assume we can still surface the home and recover
        // when the user taps to scan.
      }
      if (cancelled) return;
      setTarget(next);
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (target === null) return null;
  return <Redirect href={target} />;
}
