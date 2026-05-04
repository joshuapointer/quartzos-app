import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
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

// Parse rgba(r, g, b, a) → { hex: '#RRGGBB', alpha: number }
// react-native-svg stopColor does not support rgba() or 8-char hex;
// alpha must come from stopOpacity.
function parseHaloColor(rgba: string): { hex: string; alpha: number } {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return { hex: '#F3C4A8', alpha: 0.35 };
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  const a = m[4] != null ? parseFloat(m[4]) : 1;
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  return { hex, alpha: a };
}

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

  const { hex: haloHex, alpha: haloAlpha } = parseHaloColor(moodPalette[mood].halo);
  const haloSize = size + OUTSET * 2;
  const cx = haloSize / 2;
  const cy = haloSize / 2;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: haloSize,
          height: haloSize,
          marginLeft: -OUTSET,
          marginTop: -OUTSET,
        },
        animStyle,
      ]}
    >
      <View pointerEvents="none" style={{ width: haloSize, height: haloSize }}>
        <Svg width={haloSize} height={haloSize}>
          <Defs>
            <RadialGradient id="bubHaloGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor={haloHex} stopOpacity={haloAlpha} />
              <Stop offset="100%" stopColor={haloHex} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill="url(#bubHaloGrad)" />
        </Svg>
      </View>
    </Animated.View>
  );
}
