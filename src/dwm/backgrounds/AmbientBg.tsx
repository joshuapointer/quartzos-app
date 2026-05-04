import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { palette } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

interface Props {
  intensity?: 'cool' | 'warm' | 'mixed';
}

// react-native-svg stopColor does NOT support 8-char hex (#RRGGBBAA) or rgba().
// Alpha must be expressed via stopOpacity (0..1).
interface BlobConfig {
  cx: number;
  cy: number;
  color: string;    // 6-char hex, no alpha
  opacity: number;  // center stopOpacity (outer stop is always 0)
  rangeX: number;
  rangeY: number;
  duration: number;
}

function getBlobConfigs(intensity: 'cool' | 'warm' | 'mixed'): BlobConfig[] {
  if (intensity === 'warm') {
    return [
      { cx: 0.3,  cy: 0.12, color: palette.accent, opacity: 0.44, rangeX:  28, rangeY:  22, duration: 58000 },
      { cx: 0.78, cy: 0.82, color: palette.warm,   opacity: 0.40, rangeX: -24, rangeY: -18, duration: 62000 },
      { cx: 0.5,  cy: 0.5,  color: palette.butter, opacity: 0.31, rangeX:  18, rangeY: -24, duration: 55000 },
    ];
  }
  if (intensity === 'cool') {
    return [
      { cx: 0.25, cy: 0.18, color: palette.lilac, opacity: 0.45, rangeX:  26, rangeY:  20, duration: 60000 },
      { cx: 0.8,  cy: 0.75, color: palette.mint,  opacity: 0.38, rangeX: -20, rangeY: -16, duration: 64000 },
      { cx: 0.55, cy: 0.42, color: palette.lilac, opacity: 0.31, rangeX:  14, rangeY: -22, duration: 57000 },
    ];
  }
  // mixed (default)
  return [
    { cx: 0.3,  cy: 0.1,  color: palette.accent, opacity: 0.38, rangeX:  28, rangeY:  20, duration: 58000 },
    { cx: 0.82, cy: 0.88, color: palette.mint,   opacity: 0.35, rangeX: -22, rangeY: -18, duration: 62000 },
    { cx: 0.5,  cy: 0.5,  color: palette.lilac,  opacity: 0.32, rangeX:  16, rangeY: -20, duration: 60000 },
  ];
}

function Blob({ config, index, reduced }: { config: BlobConfig; index: number; reduced: boolean }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    tx.value = withRepeat(
      withTiming(config.rangeX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    ty.value = withRepeat(
      withTiming(config.rangeY, { duration: config.duration * 0.85, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(tx);
      cancelAnimation(ty);
    };
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const blobW = SCREEN_W * 0.7;
  const blobH = SCREEN_H * 0.45;
  const left = config.cx * SCREEN_W - blobW / 2;
  const top = config.cy * SCREEN_H - blobH / 2;
  // Use intensity-prefixed IDs to avoid global RN-SVG namespace conflicts
  const gradId = `ambBlob${index}`;

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: blobW, height: blobH }, animStyle]} pointerEvents="none">
      <Svg width={blobW} height={blobH}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={config.color} stopOpacity={config.opacity} />
            <Stop offset="100%" stopColor={config.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={blobW} height={blobH} fill={`url(#${gradId})`} rx={blobW / 2} ry={blobH / 2} />
      </Svg>
    </Animated.View>
  );
}

export function AmbientBg({ intensity = 'mixed' }: Props) {
  const reduced = useReducedMotion();
  const blobs = getBlobConfigs(intensity);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} pointerEvents="none">
      {blobs.map((cfg, i) => (
        <Blob key={i} config={cfg} index={i} reduced={reduced} />
      ))}
    </View>
  );
}
