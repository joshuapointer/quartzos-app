import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
  Circle,
  ClipPath,
  Rect,
} from 'react-native-svg';
import type { Mood } from './types';
import { palette } from '../tokens';

interface Props {
  size: number;
  // `mood` is preserved on the API for back-compat but no longer drives
  // colour. The shatterbox orb renders one amber-glass register.
  mood: Mood;
  coreOverride?: string;
  edgeOverride?: string;
}

const CORE = '#f5a44a';      // amber-orange — body core
const EDGE = '#3a261a';      // deep amber — body edge / inset shadow
const STREAK = '#ffeec8';    // warm-white refraction streak

export function BubBody({ size, coreOverride, edgeOverride }: Props) {
  const core = coreOverride ?? CORE;
  const edge = edgeOverride ?? EDGE;

  const half = size / 2;
  // cheek dimensions: 14% wide, 9% tall of body size (preserved)
  const cheekW = size * 0.14;
  const cheekH = size * 0.09;
  const cheekY = size * 0.56;

  // Refraction streak: thin diagonal lozenge at ~45° upper-left
  const streakW = size * 0.55;
  const streakH = size * 0.10;
  const streakCx = size * 0.34;
  const streakCy = size * 0.30;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: half }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Core body gradient — amber core to deep-amber edge with inset bottom */}
          <RadialGradient id="body" cx="48%" cy="42%" r="65%" fx="48%" fy="42%">
            <Stop offset="0%"   stopColor={core} stopOpacity="1" />
            <Stop offset="70%"  stopColor={core} stopOpacity="1" />
            <Stop offset="100%" stopColor={edge} stopOpacity="1" />
          </RadialGradient>
          {/* Refraction streak — warm-white lozenge clipped to body */}
          <ClipPath id="bodyClip">
            <Circle cx={half} cy={half} r={half} />
          </ClipPath>
          <LinearGradient id="streak" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={STREAK} stopOpacity="0" />
            <Stop offset="50%"  stopColor={STREAK} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={STREAK} stopOpacity="0" />
          </LinearGradient>
          {/* Cheek blush — warm amber, blurred via gradient falloff */}
          <RadialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={CORE} stopOpacity="0.30" />
            <Stop offset="100%" stopColor={CORE} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Body */}
        <Circle cx={half} cy={half} r={half} fill="url(#body)" />

        {/* Refraction streak clipped to body */}
        <Rect
          x={streakCx - streakW / 2}
          y={streakCy - streakH / 2}
          width={streakW}
          height={streakH}
          fill="url(#streak)"
          rx={streakH / 2}
          ry={streakH / 2}
          transform={`rotate(-30 ${streakCx} ${streakCy})`}
          clipPath="url(#bodyClip)"
        />

        {/* Cheeks */}
        <Ellipse
          cx={size * 0.14 + cheekW / 2}
          cy={cheekY + cheekH / 2}
          rx={cheekW / 2}
          ry={cheekH / 2}
          fill="url(#cheek)"
        />
        <Ellipse
          cx={size - size * 0.14 - cheekW / 2}
          cy={cheekY + cheekH / 2}
          rx={cheekW / 2}
          ry={cheekH / 2}
          fill="url(#cheek)"
        />

        {/* 1px amber rim at 50% opacity — tells the eye the orb sits on the
            dark surface rather than floating */}
        <Circle
          cx={half}
          cy={half}
          r={half - 0.5}
          fill="none"
          stroke={palette.accent}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    // Neutral cast shadow per spec (downward, hard, neutral black)
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 36,
    elevation: 16,
  },
});
