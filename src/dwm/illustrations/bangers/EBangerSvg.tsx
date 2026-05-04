import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function EBangerSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="eb-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Bucket body */}
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#eb-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Heating coil — 4 spiral wraps around the outside of the bucket */}
      {/* Each wrap is an arc approximated as a path — reads as coil */}
      <Path d="M25 38 Q18 42 25 48" stroke={palette.warm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M25 48 Q18 52 25 58" stroke={palette.warm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M25 58 Q18 62 25 68" stroke={palette.warm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M25 68 Q18 72 25 78" stroke={palette.warm} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Coil highlight */}
      <Path d="M25 38 Q19 42 25 48" stroke={palette.white} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M25 48 Q19 52 25 58" stroke={palette.white} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M25 58 Q19 62 25 68" stroke={palette.white} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M25 68 Q19 72 25 78" stroke={palette.white} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.45} />

      {/* Wire running off-frame to the right */}
      <Path d="M72 58 Q82 56 90 54" stroke={palette.fg} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M72 68 Q82 70 90 72" stroke={palette.fg} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.5} />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 58 33 82" stroke={palette.white} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.4} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
