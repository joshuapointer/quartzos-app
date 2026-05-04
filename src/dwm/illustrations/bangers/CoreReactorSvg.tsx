import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function CoreReactorSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="cr-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="cr-pillar" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.border} stopOpacity="0.6" />
          <Stop offset="50%" stopColor={palette.white} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Bucket body */}
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#cr-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Central pillar — translucent column rising from floor */}
      <Path
        d="M46 98 L46 40 Q46 36 50 36 Q54 36 54 40 L54 98"
        fill="url(#cr-pillar)"
        stroke={palette.muted}
        strokeWidth="0.9"
        strokeOpacity={0.7}
      />
      {/* Pillar top cap ellipse */}
      <Ellipse cx="50" cy="40" rx="4" ry="1.5" fill={palette.white} opacity={0.7} stroke={palette.muted} strokeWidth="0.7" />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 62 33 86" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.5} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
