import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette, fontStack } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

interface Props {
  label: string;
}

export function HintLabel({ label }: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.label, animStyle]}>
      {label.toUpperCase()}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fontStack.mono,
    fontSize: 11,
    color: palette.accentDeep,
    letterSpacing: 0.18 * 11,
    textTransform: 'uppercase',
  },
});
