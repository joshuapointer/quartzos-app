/**
 * src/flow/useFlowFonts.ts
 * Loads Geist and Geist Mono font weights needed by the new linear flow.
 * Returns { ready } — block render until true.
 */
import { useFonts } from 'expo-font';
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';

export function useFlowFonts(): { ready: boolean } {
  const [loaded] = useFonts({
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  return { ready: loaded ?? false };
}
