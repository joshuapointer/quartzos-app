import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Circle } from 'react-native-svg';
import { moodPalette } from '../tokens';
import type { Mood } from './types';

interface Props {
  size: number;
  mood: Mood;
  coreOverride?: string;
  edgeOverride?: string;
}

export function BubBody({ size, mood, coreOverride, edgeOverride }: Props) {
  const colors = moodPalette[mood];
  const core = coreOverride ?? colors.core;
  const edge = edgeOverride ?? colors.edge;

  const half = size / 2;
  // cheek dimensions: 14% wide, 9% tall of body size
  const cheekW = size * 0.14;
  const cheekH = size * 0.09;
  const cheekY = size * 0.56;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: half }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Highlight spot top-left */}
          <RadialGradient id="highlight" cx="32%" cy="28%" r="36%" fx="32%" fy="28%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          {/* Core body gradient — center-right bottom so highlight sits on top */}
          <RadialGradient id="body" cx="65%" cy="72%" r="70%" fx="65%" fy="72%">
            <Stop offset="0%" stopColor={core} stopOpacity="1" />
            <Stop offset="70%" stopColor={edge} stopOpacity="1" />
            <Stop offset="100%" stopColor={edge} stopOpacity="1" />
          </RadialGradient>
          {/* Left cheek */}
          <RadialGradient id="cheekL" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F28B6B" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#F28B6B" stopOpacity="0" />
          </RadialGradient>
          {/* Right cheek */}
          <RadialGradient id="cheekR" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F28B6B" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#F28B6B" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Body */}
        <Circle cx={half} cy={half} r={half} fill="url(#body)" />
        {/* Highlight */}
        <Circle cx={half} cy={half} r={half} fill="url(#highlight)" />

        {/* Cheeks */}
        <Ellipse
          cx={size * 0.14 + cheekW / 2}
          cy={cheekY + cheekH / 2}
          rx={cheekW / 2}
          ry={cheekH / 2}
          fill="url(#cheekL)"
        />
        <Ellipse
          cx={size - size * 0.14 - cheekW / 2}
          cy={cheekY + cheekH / 2}
          rx={cheekW / 2}
          ry={cheekH / 2}
          fill="url(#cheekR)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: 'rgba(82, 51, 95, 1)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 32,
    elevation: 16,
  },
});
