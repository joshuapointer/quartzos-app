/**
 * src/flow/components/useStaggerEntrance.ts
 *
 * Shared opacity + translateY-12 entrance for stage children. Replaces
 * per-stage copies that drifted to 75ms / 55ms / 60ms / 60ms intervals.
 * One canonical 60ms gap, one canonical 600ms duration, one easing curve —
 * so every stage's body lands with the same rhythm.
 */

import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { reanimatedEasing } from '@/design/tokens';

const STAGGER_MS = 60;
const ENTER_DUR_MS = 600;
const EASE_OUT_EXPO = reanimatedEasing.easeOut;

export function useStaggerEntrance(idx: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = idx * STAGGER_MS;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: ENTER_DUR_MS, easing: EASE_OUT_EXPO }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: ENTER_DUR_MS, easing: EASE_OUT_EXPO }),
    );
  }, [idx, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}
