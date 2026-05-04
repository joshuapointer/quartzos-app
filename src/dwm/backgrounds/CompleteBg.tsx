import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

interface StarSpec {
  xFrac: number;
  yFrac: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const STARS: StarSpec[] = [
  { xFrac: 0.12, yFrac: 0.18, size: 18, delay: 0,    duration: 3400, color: palette.accent },
  { xFrac: 0.78, yFrac: 0.30, size: 14, delay: 600,  duration: 3800, color: palette.accent },
  { xFrac: 0.22, yFrac: 0.55, size: 12, delay: 1200, duration: 3200, color: palette.accent },
  { xFrac: 0.70, yFrac: 0.70, size: 20, delay: 1800, duration: 4200, color: palette.lilac },
  { xFrac: 0.40, yFrac: 0.85, size: 14, delay: 2400, duration: 3600, color: palette.accent },
  { xFrac: 0.55, yFrac: 0.42, size: 16, delay: 300,  duration: 3000, color: palette.lilac },
  { xFrac: 0.50, yFrac: 0.12, size: 11, delay: 1500, duration: 4000, color: palette.accent },
  { xFrac: 0.88, yFrac: 0.60, size: 13, delay: 2700, duration: 3400, color: palette.accent },
  { xFrac: 0.08, yFrac: 0.38, size: 15, delay: 900,  duration: 3600, color: palette.lilac },
  { xFrac: 0.33, yFrac: 0.22, size: 10, delay: 2100, duration: 3800, color: palette.accent },
  { xFrac: 0.62, yFrac: 0.78, size: 17, delay: 450,  duration: 3200, color: palette.lilac },
  { xFrac: 0.90, yFrac: 0.15, size: 12, delay: 1650, duration: 4000, color: palette.accent },
  { xFrac: 0.18, yFrac: 0.68, size: 14, delay: 750,  duration: 3500, color: palette.accent },
  { xFrac: 0.46, yFrac: 0.50, size: 11, delay: 2850, duration: 3100, color: palette.lilac },
  { xFrac: 0.72, yFrac: 0.92, size: 16, delay: 1350, duration: 3700, color: palette.accent },
  { xFrac: 0.25, yFrac: 0.08, size: 13, delay: 2250, duration: 3900, color: palette.accent },
  { xFrac: 0.84, yFrac: 0.48, size: 15, delay: 600,  duration: 3300, color: palette.lilac },
  { xFrac: 0.38, yFrac: 0.72, size: 12, delay: 1950, duration: 4100, color: palette.accent },
  { xFrac: 0.58, yFrac: 0.25, size: 10, delay: 300,  duration: 3600, color: palette.accent },
  { xFrac: 0.05, yFrac: 0.82, size: 14, delay: 2550, duration: 3200, color: palette.lilac },
];

function Star({ spec, reduced }: { spec: StarSpec; reduced: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: spec.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: spec.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = reduced ? -6 : p * -12;
    const scale = reduced ? 1.2 : 0.6 + p * 0.6;
    const rotate = reduced ? '180deg' : `${p * 180}deg`;
    const opacity = reduced ? 1 : p;
    return {
      opacity,
      transform: [{ translateY }, { scale }, { rotate }],
    };
  });

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: spec.xFrac * SCREEN_W - spec.size / 2,
          top: spec.yFrac * SCREEN_H - spec.size / 2,
          fontSize: spec.size,
          color: spec.color,
          // using a unicode four-pointed star — no emoji
          lineHeight: spec.size,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      {'✦'}
    </Animated.Text>
  );
}

export function CompleteBg() {
  const reduced = useReducedMotion();

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
      pointerEvents="none"
    >
      {/* Soft purple radial shimmer */}
      <View
        style={{
          position: 'absolute',
          top: SCREEN_H * 0.1,
          left: SCREEN_W * 0.15,
          width: SCREEN_W * 0.7,
          height: SCREEN_H * 0.5,
          borderRadius: SCREEN_W * 0.35,
          backgroundColor: `${palette.lilac}30`,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: 'absolute',
          top: SCREEN_H * 0.5,
          left: SCREEN_W * 0.2,
          width: SCREEN_W * 0.6,
          height: SCREEN_H * 0.35,
          borderRadius: SCREEN_W * 0.3,
          backgroundColor: `${palette.accent}1C`,
        }}
        pointerEvents="none"
      />
      {STARS.map((spec, i) => (
        <Star key={i} spec={spec} reduced={reduced} />
      ))}
    </View>
  );
}
