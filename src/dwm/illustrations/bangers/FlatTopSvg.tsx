import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';

export interface IllustrationProps {
  size?: number;
  accent?: ColorValue;
}

export default function FlatTopSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ft-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <RadialGradient id="ft-floor" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.1" />
        </RadialGradient>
      </Defs>

      {/* Drop shadow */}
      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />

      {/* Neck / joint stub */}
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Rim ellipse — top of bucket */}
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Bucket body */}
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#ft-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Inner rim highlight — suggests depth at the flat top */}
      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />

      {/* Floor reflection */}
      <Ellipse cx="50" cy="94" rx="16" ry="2.5" fill="url(#ft-floor)" />

      {/* Left wall highlight — curved quartz read */}
      <Path d="M33 34 Q31 62 33 86" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.5} />

      {/* Accent rim cap */}
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
