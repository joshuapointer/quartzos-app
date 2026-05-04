import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
  const opacity = useSharedValue(reduced ? 1 : 0.6);
  const translateY = useSharedValue(reduced ? 0 : 0);

  useEffect(() => {
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [reduced, opacity, translateY]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.pill, containerAnimStyle]}>
      <Animated.Text style={styles.label}>
        {label.toUpperCase()}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(245, 178, 145, 0.7)',
    backgroundColor: 'rgba(252, 234, 222, 0.8)',
  },
  label: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    color: palette.accentDeep,
    letterSpacing: 0.18 * 10,
    textTransform: 'uppercase',
  },
});
