import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function ControlTowerSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ct-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="ct-pillar" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.border} stopOpacity="0.5" />
          <Stop offset="50%" stopColor={palette.white} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="22" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="14" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Tall slim cup — narrower than flat-top */}
      <Ellipse cx="50" cy="24" rx="18" ry="3.5" fill={palette.surface} stroke={palette.muted} strokeWidth="1.3" />
      <Path
        d="M32 24 L32 92 Q32 100 42 100 L58 100 Q68 100 68 92 L68 24"
        fill="url(#ct-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* SE Pillar — textured surface enhancement via hatched lines */}
      <Path
        d="M44 100 L44 34 Q44 30 50 30 Q56 30 56 34 L56 100"
        fill="url(#ct-pillar)"
        stroke={palette.muted}
        strokeWidth="0.8"
        strokeOpacity={0.6}
      />
      {/* Hatch texture suggesting micro-surface enhancement */}
      <Path d="M44 42 L56 46" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 50 L56 54" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 58 L56 62" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 66 L56 70" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 74 L56 78" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 82 L56 86" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      <Path d="M44 90 L56 94" stroke={palette.muted} strokeWidth="0.6" opacity={0.4} />
      {/* Pillar top cap */}
      <Ellipse cx="50" cy="34" rx="6" ry="2" fill={palette.white} opacity={0.65} stroke={palette.muted} strokeWidth="0.6" />

      <Ellipse cx="50" cy="24" rx="11" ry="2.2" fill={palette.white} opacity={0.5} />
      <Path d="M35 30 Q33 60 35 88" stroke={palette.white} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.45} />
      <Ellipse cx="50" cy="24" rx="18" ry="3.5" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
