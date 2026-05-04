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

interface BlobConfig {
  cx: number; // 0..1 fraction of screen
  cy: number;
  color1: string;
  color2: string;
  initX: number;
  initY: number;
  rangeX: number;
  rangeY: number;
  duration: number;
}

function getBlobConfigs(intensity: 'cool' | 'warm' | 'mixed'): BlobConfig[] {
  if (intensity === 'warm') {
    return [
      { cx: 0.3, cy: 0.12, color1: `${palette.accent}70`, color2: 'transparent', initX: 0, initY: 0, rangeX: 28, rangeY: 22, duration: 58000 },
      { cx: 0.78, cy: 0.82, color1: `${palette.warm}65`, color2: 'transparent', initX: 0, initY: 0, rangeX: -24, rangeY: -18, duration: 62000 },
      { cx: 0.5, cy: 0.5, color1: `${palette.butter}50`, color2: 'transparent', initX: 0, initY: 0, rangeX: 18, rangeY: -24, duration: 55000 },
    ];
  }
  if (intensity === 'cool') {
    return [
      { cx: 0.25, cy: 0.18, color1: `${palette.lilac}72`, color2: 'transparent', initX: 0, initY: 0, rangeX: 26, rangeY: 20, duration: 60000 },
      { cx: 0.8, cy: 0.75, color1: `${palette.mint}60`, color2: 'transparent', initX: 0, initY: 0, rangeX: -20, rangeY: -16, duration: 64000 },
      { cx: 0.55, cy: 0.42, color1: `${palette.lilac}50`, color2: 'transparent', initX: 0, initY: 0, rangeX: 14, rangeY: -22, duration: 57000 },
    ];
  }
  return [
    { cx: 0.3, cy: 0.1, color1: `${palette.accent}60`, color2: 'transparent', initX: 0, initY: 0, rangeX: 28, rangeY: 20, duration: 58000 },
    { cx: 0.82, cy: 0.88, color1: `${palette.mint}58`, color2: 'transparent', initX: 0, initY: 0, rangeX: -22, rangeY: -18, duration: 62000 },
    { cx: 0.5, cy: 0.5, color1: `${palette.lilac}52`, color2: 'transparent', initX: 0, initY: 0, rangeX: 16, rangeY: -20, duration: 60000 },
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
  const gradId = `blob${index}`;

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: blobW, height: blobH }, animStyle]} pointerEvents="none">
      <Svg width={blobW} height={blobH}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={config.color1} />
            <Stop offset="100%" stopColor={config.color2 === 'transparent' ? '#00000000' : config.color2} />
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
