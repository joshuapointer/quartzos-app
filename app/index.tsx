/**
 * app/index.tsx
 *
 * Phase 8 — single entrypoint for the new linear flow. Renders QFlowShell
 * directly; the shell handles every stage (connect → choose → build → session
 * → complete) with no router pushes.
 *
 * Legacy routes under app/(connected), app/onboarding, app/(modals) remain
 * registered with the file-based router but are no longer navigated to from
 * here.
 */

import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import QFlowShell from '../src/flow/QFlowShell';
import { useFlowFonts } from '../src/flow/useFlowFonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function Index() {
  const { ready } = useFlowFonts();

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [ready]);

  if (!ready) return null;

  return <QFlowShell />;
}
