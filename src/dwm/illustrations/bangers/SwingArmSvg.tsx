import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Rect, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function SwingArmSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="sa-arm" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.8" />
        </LinearGradient>
        <RadialGradient id="sa-dome" cx="38%" cy="35%" r="60%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.5" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />

      {/* Joint stub — vertical */}
      <Rect x="43" y="8" width="14" height="20" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Horizontal swing arm extending left */}
      <Path
        d="M50 28 Q50 36 38 38 L24 38"
        stroke={palette.fg}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M50 28 Q50 36 38 38 L24 38"
        stroke={palette.white}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Hinge dot at pivot */}
      <Circle cx="50" cy="28" r="3.5" fill={palette.surface} stroke={palette.muted} strokeWidth="1.2" />
      <Circle cx="50" cy="28" r="1.5" fill={palette.muted} opacity={0.6} />

      {/* Dome bucket at swing-out position */}
      <Path
        d="M14 38 Q14 72 24 72 Q34 72 34 38"
        fill="url(#sa-dome)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Ellipse cx="24" cy="38" rx="10" ry="3" fill={palette.surface} stroke={palette.muted} strokeWidth="1.2" />
      <Ellipse cx="24" cy="38" rx="6" ry="1.8" fill={palette.white} opacity={0.5} />

      {/* Dome highlight */}
      <Path d="M17 44 Q15 58 17 68" stroke={palette.white} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.5} />

      <Ellipse cx="24" cy="38" rx="10" ry="3" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
