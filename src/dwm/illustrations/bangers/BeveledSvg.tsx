import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function BeveledSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="bv-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <RadialGradient id="bv-bevel" cx="50%" cy="100%" r="60%">
          <Stop offset="0%" stopColor={palette.muted} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={palette.muted} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Body */}
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#bv-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Bevel cut — inward V-groove at the inner rim edge */}
      <Path
        d="M36 26 Q37 30 40 31 L60 31 Q63 30 64 26"
        fill="url(#bv-bevel)"
        stroke={palette.muted}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Inner bevel shadow line */}
      <Path
        d="M38 27 Q39 30 42 31 L58 31 Q61 30 62 27"
        fill="none"
        stroke={palette.fg}
        strokeWidth="0.7"
        strokeOpacity={0.3}
      />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 62 33 86" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.5} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
