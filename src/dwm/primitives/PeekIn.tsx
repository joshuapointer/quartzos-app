import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  disabled?: boolean;
}

export function PeekIn({ children, delay = 0, disabled = false }: Props) {
  const reduced = useReducedMotion();
  const shouldAnimate = !reduced && !disabled;

  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const translateY = useSharedValue(shouldAnimate ? 18 : 0);
  const scale = useSharedValue(shouldAnimate ? 0.95 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    const timer = setTimeout(() => {
      const cfg = { duration: 540, easing: Easing.bezier(0.34, 1.56, 0.64, 1) };
      opacity.value = withTiming(1, cfg);
      translateY.value = withTiming(0, cfg);
      scale.value = withTiming(1, cfg);
    }, delay);
    return () => clearTimeout(timer);
  }, [shouldAnimate, delay, opacity, translateY, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      {children}
    </Animated.View>
  );
}
