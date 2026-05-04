import React, { useEffect } from 'react';
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

// 6 columns: xFrac, swayDir, duration (ms), delay (ms)
const COLUMNS = [
  { xFrac: 0.18, sway: -1, dur: 7000, delay: 0 },
  { xFrac: 0.35, sway:  1, dur: 8000, delay: 1500 },
  { xFrac: 0.50, sway: -1, dur: 9000, delay: 3000 },
  { xFrac: 0.65, sway:  1, dur: 7500, delay: 4500 },
  { xFrac: 0.78, sway: -1, dur: 8500, delay: 2200 },
  { xFrac: 0.90, sway:  1, dur: 7200, delay: 1000 },
];

function VaporColumn({ col, reduced }: { col: typeof COLUMNS[number]; reduced: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      col.delay,
      withRepeat(
        withTiming(1, { duration: col.dur, easing: Easing.inOut(Easing.sin) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // translateY: 0 → -100% → -200% (off top), represented in pixels
    const ty = interpolate(p, [0, 1], [0, -SCREEN_H * 2]);
    // horizontal sway ±12px
    const tx = col.sway * 12 * Math.sin(p * Math.PI);
    // opacity: 0 → 0.5 → 0
    const opacity = interpolate(p, [0, 0.15, 0.7, 1], [0, 0.5, 0.45, 0]);
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
      opacity,
    };
  });

  const BLOB_W = 80;
  const BLOB_H = 80;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: -20,
          left: col.xFrac * SCREEN_W - BLOB_W / 2,
          width: BLOB_W,
          height: BLOB_H,
          borderRadius: BLOB_W / 2,
          backgroundColor: `${palette.lilac}66`,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function VaporBg() {
  const reduced = useReducedMotion();

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}
      pointerEvents="none"
    >
      {/* Cool wash overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `${palette.lilac}1A`,
          },
        ]}
        pointerEvents="none"
      />
      {COLUMNS.map((col, i) => (
        <VaporColumn key={i} col={col} reduced={reduced} />
      ))}
    </View>
  );
}
