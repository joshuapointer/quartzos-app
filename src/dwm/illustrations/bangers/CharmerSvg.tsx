import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function CharmerSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ch-outer" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="ch-cone" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="28" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Outer bucket */}
      <Path
        d="M28 26 L28 90 Q28 100 40 100 L60 100 Q72 100 72 90 L72 26"
        fill="url(#ch-outer)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Bottom skirt vortex holes — 3 visible */}
      <Ellipse cx="38" cy="90" rx="3" ry="2" fill={palette.fg} opacity={0.2} stroke={palette.fg} strokeWidth="0.7" transform="rotate(-15 38 90)" />
      <Ellipse cx="50" cy="93" rx="3" ry="2" fill={palette.fg} opacity={0.2} stroke={palette.fg} strokeWidth="0.7" />
      <Ellipse cx="62" cy="90" rx="3" ry="2" fill={palette.fg} opacity={0.2} stroke={palette.fg} strokeWidth="0.7" transform="rotate(15 62 90)" />

      {/* Inner cone visible through the top opening */}
      <Path
        d="M44 26 L50 70 L56 26"
        fill="url(#ch-cone)"
        stroke={palette.muted}
        strokeWidth="0.9"
        strokeOpacity={0.7}
        strokeLinejoin="round"
      />

      {/* 3 small pearls inside */}
      <Circle cx="44" cy="78" r="3.5" fill={palette.lilac} stroke={palette.muted} strokeWidth="0.7" opacity={0.85} />
      <Circle cx="50" cy="82" r="3.5" fill={palette.lilac} stroke={palette.muted} strokeWidth="0.7" opacity={0.85} />
      <Circle cx="56" cy="78" r="3.5" fill={palette.lilac} stroke={palette.muted} strokeWidth="0.7" opacity={0.85} />
      <Circle cx="43" cy="77" r="1.2" fill={palette.white} opacity={0.6} />
      <Circle cx="49" cy="81" r="1.2" fill={palette.white} opacity={0.6} />
      <Circle cx="55" cy="77" r="1.2" fill={palette.white} opacity={0.6} />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 34 Q31 62 33 86" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.45} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
