import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

// Soft pink breath-cloud: 4.4 s scale pulse (0.7 → 1.15) + opacity (0.55 → 1.0)
function BreathCloud({ reduced }: { reduced: boolean }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    if (reduced) return;
    const dur = 4400;
    const easing = Easing.inOut(Easing.ease);
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: dur / 2, easing }),
        withTiming(0.7,  { duration: dur / 2, easing }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0,  { duration: dur / 2, easing }),
        withTiming(0.55, { duration: dur / 2, easing }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const cloudSize = SCREEN_W * 0.72;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: cloudSize,
          height: cloudSize,
          borderRadius: cloudSize / 2,
          backgroundColor: `${palette.accent}28`,
          left: SCREEN_W / 2 - cloudSize / 2,
          top:  SCREEN_H / 2 - cloudSize / 2,
        },
        animStyle,
      ]}
    />
  );
}

// Puff cloud: rises, expands (scale 0.4 → 2.4), fades out. Matches proto puff-out.
const PUFF_CONFIGS: { duration: number; delay: number; startX: number }[] = [
  { duration: 5000, delay:    0, startX: SCREEN_W * 0.50 },
  { duration: 5600, delay: 1600, startX: SCREEN_W * 0.62 },
  { duration: 5200, delay: 3200, startX: SCREEN_W * 0.38 },
  { duration: 6000, delay: 2400, startX: SCREEN_W * 0.55 },
];

function PuffCloud({ duration, delay, startX, reduced }: { duration: number; delay: number; startX: number; reduced: boolean }) {
  const ty = useSharedValue(0);
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;

    function loop() {
      ty.value = 0;
      scale.value = 0.4;
      opacity.value = 0;
      const easeOut = Easing.out(Easing.ease);
      ty.value = withTiming(-160, { duration, easing: easeOut });
      scale.value = withTiming(2.4,  { duration, easing: easeOut });
      opacity.value = withSequence(
        withTiming(0.8,  { duration: duration * 0.20 }),
        withTiming(0.8,  { duration: duration * 0.60 }),
        withTiming(0.0,  { duration: duration * 0.20 }),
      );
    }

    let repeatId: ReturnType<typeof setInterval> | null = null;
    const startTimerId = setTimeout(() => {
      loop();
      repeatId = setInterval(loop, duration);
    }, delay);

    return () => {
      clearTimeout(startTimerId);
      if (repeatId !== null) clearInterval(repeatId);
      cancelAnimation(ty);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  const puffSize = 40;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: puffSize,
          height: puffSize,
          borderRadius: puffSize / 2,
          backgroundColor: `${palette.accent}30`,
          left: startX - puffSize / 2,
          top:  SCREEN_H * 0.55,
        },
        animStyle,
      ]}
    />
  );
}

export function DabBg() {
  const reduced = useReducedMotion();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} pointerEvents="none">
      <BreathCloud reduced={reduced} />
      {PUFF_CONFIGS.map((cfg, i) => (
        <PuffCloud key={i} {...cfg} reduced={reduced} />
      ))}
    </View>
  );
}
