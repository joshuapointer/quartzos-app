import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { moodPalette } from '../tokens';
import type { Mood } from './types';

interface Props {
  size: number;
  mood: Mood;
  paused: boolean;
}

const OUTSET = 28;

export function BubHalo({ size, mood, paused }: Props) {
  const opacity = useSharedValue(0.7);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (paused) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      return;
    }
    const dur = 4000;
    const easing = Easing.inOut(Easing.ease);
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: dur / 2, easing }),
        withTiming(0.7, { duration: dur / 2, easing }),
      ),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: dur / 2, easing }),
        withTiming(0.95, { duration: dur / 2, easing }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [paused]);

  const haloColor = moodPalette[mood].halo;
  const haloSize = size + OUTSET * 2;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        animStyle,
        {
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: haloColor,
          marginLeft: -OUTSET,
          marginTop: -OUTSET,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
});
