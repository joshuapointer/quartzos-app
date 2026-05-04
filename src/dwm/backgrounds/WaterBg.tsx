import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { palette } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

interface BubbleSpec {
  xFrac: number;
  size: number;
  duration: number;
  delay: number;
  swayDir: number;
}

function makeBubbles(): BubbleSpec[] {
  const specs: [number, number, number, number][] = [
    [0.12, 14, 4800, 0],
    [0.28, 22, 5600, 800],
    [0.45, 10, 4200, 1600],
    [0.62, 18, 5200, 2400],
    [0.78, 12, 4600, 3200],
    [0.88, 16, 5000, 400],
    [0.22,  8, 3800, 2000],
    [0.56, 24, 6000, 3600],
  ];
  return specs.map(([xFrac, size, duration, delay], i) => ({
    xFrac,
    size,
    duration,
    delay,
    swayDir: i % 2 === 0 ? 1 : -1,
  }));
}

function Bubble({ spec, reduced }: { spec: BubbleSpec; reduced: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const tx = spec.swayDir * interpolate(p, [0, 0.5, 1], [0, 8, -12]);
    const ty = interpolate(p, [0, 0.5, 1], [0, -380, -780]);
    const opacity = interpolate(p, [0, 0.15, 0.5, 1], [0, 1, 0.95, 0]);
    const scale = interpolate(p, [0, 0.2, 1], [0.6, 1, 1.15]);
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: -30,
          left: spec.xFrac * SCREEN_W - spec.size / 2,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: `${palette.lilac}88`,
          borderWidth: 1,
          borderColor: `${palette.lilac}AA`,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const BUBBLES = makeBubbles();

export function WaterBg() {
  const reduced = useReducedMotion();

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
      pointerEvents="none"
    >
      {/* Water tint — blue-lilac gradient from bottom */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_H * 0.65,
          opacity: 0.35,
          backgroundColor: `${palette.lilac}55`,
        }}
        pointerEvents="none"
      />
      {/* Rising bubbles */}
      {BUBBLES.map((spec, i) => (
        <Bubble key={i} spec={spec} reduced={reduced} />
      ))}
    </View>
  );
}
