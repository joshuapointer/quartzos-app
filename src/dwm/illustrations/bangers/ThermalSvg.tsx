import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function ThermalSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="th-outer" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.8" />
        </LinearGradient>
        <LinearGradient id="th-inner" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.surface} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="28" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Outer wall rim ellipse */}
      <Ellipse cx="50" cy="26" rx="24" ry="4.5" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Outer wall */}
      <Path
        d="M26 26 L26 90 Q26 100 38 100 L62 100 Q74 100 74 90 L74 26"
        fill="url(#th-outer)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Air-gap dots suggesting insulation */}
      <Circle cx="36" cy="48" r="1.2" fill={palette.muted} opacity={0.25} />
      <Circle cx="40" cy="58" r="0.9" fill={palette.muted} opacity={0.2} />
      <Circle cx="36" cy="68" r="1.1" fill={palette.muted} opacity={0.22} />
      <Circle cx="64" cy="50" r="1.0" fill={palette.muted} opacity={0.22} />
      <Circle cx="60" cy="62" r="1.2" fill={palette.muted} opacity={0.2} />
      <Circle cx="64" cy="74" r="0.9" fill={palette.muted} opacity={0.2} />

      {/* Inner wall — visible concentric shape */}
      <Path
        d="M34 30 L34 86 Q34 94 42 94 L58 94 Q66 94 66 86 L66 30"
        fill="url(#th-inner)"
        stroke={palette.muted}
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeDasharray="0"
      />

      {/* Connecting ring at top where inner meets outer */}
      <Ellipse cx="50" cy="30" rx="16" ry="3" fill={palette.surface} stroke={palette.muted} strokeWidth="0.9" />

      {/* Inner wall highlight */}
      <Path d="M38 36 Q36 62 38 84" stroke={palette.white} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={0.5} />

      <Ellipse cx="50" cy="26" rx="24" ry="4.5" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
