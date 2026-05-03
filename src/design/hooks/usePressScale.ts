import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from './useReducedMotion';
import { animation, reanimatedEasing, motion } from '../tokens';

interface UsePressScaleOptions {
  /** Target scale on press. Default 0.97 (Emil-canonical subtle press). */
  scale?: number;
  /** Override reduced-motion handling. */
  reducedMotion?: boolean;
}

export function usePressScale(options: UsePressScaleOptions = {}) {
  const { scale: pressedScale = 0.97 } = options;
  const systemReducedMotion = useReducedMotion();
  const isReduced = options.reducedMotion ?? systemReducedMotion;

  const scaleSV = useSharedValue(1);
  const opacitySV = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSV.value }],
    opacity: opacitySV.value,
  }));

  const onPressIn = useCallback(() => {
    if (isReduced) {
      opacitySV.value = withTiming(0.85, { duration: motion.duration.tap, easing: reanimatedEasing.easeOut });
    } else {
      scaleSV.value = withSpring(pressedScale, animation.pressSpring);
    }
  }, [isReduced, pressedScale, scaleSV, opacitySV]);

  const onPressOut = useCallback(() => {
    if (isReduced) {
      opacitySV.value = withTiming(1, { duration: motion.exit.tap, easing: reanimatedEasing.easeOut });
    } else {
      scaleSV.value = withSpring(1, animation.pressSpring);
    }
  }, [isReduced, scaleSV, opacitySV]);

  return { animatedStyle, onPressIn, onPressOut };
}
