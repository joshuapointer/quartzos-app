import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
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

interface SudSpec {
  xFrac: number;
  yFrac: number;
  size: number;
  delay: number;
}

const SUDS: SudSpec[] = [
  { xFrac: 0.12, yFrac: 0.25, size: 18, delay: 0 },
  { xFrac: 0.30, yFrac: 0.60, size: 22, delay: 200 },
  { xFrac: 0.50, yFrac: 0.40, size: 14, delay: 400 },
  { xFrac: 0.68, yFrac: 0.72, size: 20, delay: 600 },
  { xFrac: 0.85, yFrac: 0.30, size: 16, delay: 800 },
  { xFrac: 0.22, yFrac: 0.80, size: 12, delay: 1000 },
  { xFrac: 0.44, yFrac: 0.18, size: 24, delay: 1200 },
  { xFrac: 0.60, yFrac: 0.55, size: 10, delay: 1400 },
  { xFrac: 0.76, yFrac: 0.45, size: 18, delay: 300 },
  { xFrac: 0.92, yFrac: 0.65, size: 14, delay: 700 },
  { xFrac: 0.08, yFrac: 0.50, size: 20, delay: 900 },
  { xFrac: 0.38, yFrac: 0.35, size: 16, delay: 1100 },
];

const CYCLE = 1600;

function Suds({ spec, reduced }: { spec: SudSpec; reduced: boolean }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: CYCLE * 0.5, easing: Easing.out(Easing.back(1.4)) }),
          withTiming(0, { duration: CYCLE * 0.5, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(scale);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: spec.xFrac * SCREEN_W - spec.size / 2,
          top: spec.yFrac * SCREEN_H - spec.size / 2,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: `${palette.mint}CC`,
          borderWidth: 1.5,
          borderColor: `${palette.white}88`,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function SudsBg() {
  const reduced = useReducedMotion();

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
      pointerEvents="none"
    >
      {/* Mint wash from top */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: SCREEN_H * 0.5,
          opacity: 0.22,
          backgroundColor: `${palette.mint}55`,
        }}
        pointerEvents="none"
      />
      {SUDS.map((spec, i) => (
        <Suds key={i} spec={spec} reduced={reduced} />
      ))}
    </View>
  );
}
