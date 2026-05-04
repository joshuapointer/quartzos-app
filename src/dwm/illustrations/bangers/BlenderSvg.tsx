import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function BlenderSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="bl-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="bl-disc" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Bucket body */}
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#bl-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Hurricane disc at bottom — circle with radial slots */}
      <Ellipse cx="50" cy="86" rx="16" ry="4" fill="url(#bl-disc)" stroke={palette.fg} strokeWidth="1.1" />
      {/* Radial slot lines */}
      <Path d="M50 82 L50 90" stroke={palette.muted} strokeWidth="0.9" opacity={0.7} />
      <Path d="M42 84 L58 88" stroke={palette.muted} strokeWidth="0.9" opacity={0.7} />
      <Path d="M42 88 L58 84" stroke={palette.muted} strokeWidth="0.9" opacity={0.7} />
      <Path d="M34 86 L66 86" stroke={palette.muted} strokeWidth="0.9" opacity={0.7} />
      {/* Centre hub */}
      <Circle cx="50" cy="86" r="2.5" fill={palette.surface} stroke={palette.muted} strokeWidth="0.8" />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 60 33 80" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.5} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
