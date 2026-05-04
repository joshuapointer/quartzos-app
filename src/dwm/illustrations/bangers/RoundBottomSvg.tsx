import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function RoundBottomSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="rb-side" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <RadialGradient id="rb-dome" cx="42%" cy="35%" r="65%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.3" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Cylindrical straight walls */}
      <Path
        d="M28 26 L28 78"
        stroke={palette.fg}
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M72 26 L72 78"
        stroke={palette.fg}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Side fill */}
      <Path
        d="M28 26 L28 78 Q28 100 50 100 Q72 100 72 78 L72 26"
        fill="url(#rb-side)"
        stroke="none"
      />

      {/* Hemispherical bottom — the key read */}
      <Path
        d="M28 78 Q28 100 50 100 Q72 100 72 78"
        fill="url(#rb-dome)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Outer stroke over body */}
      <Path
        d="M28 26 L28 78 Q28 100 50 100 Q72 100 72 78 L72 26"
        fill="none"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 60 35 82" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.5} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
