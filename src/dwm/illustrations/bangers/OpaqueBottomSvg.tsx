import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function OpaqueBottomSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ob-clear" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="45%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.8" />
        </LinearGradient>
        <LinearGradient id="ob-opaque" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F0EDE8" stopOpacity="1" />
          <Stop offset="100%" stopColor="#E2DDD8" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Clear upper body */}
      <Path
        d="M28 26 L28 68 L72 68 L72 26"
        fill="url(#ob-clear)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Frosted / sandblasted lower 30% */}
      <Path
        d="M28 68 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 68 Z"
        fill="url(#ob-opaque)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Frosted ring transition line */}
      <Path d="M28 68 L72 68" stroke={palette.muted} strokeWidth="1" strokeDasharray="2 2" opacity={0.6} />

      {/* Clear section highlight */}
      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M33 32 Q31 50 33 66" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.45} />

      {/* Frosted texture dots — suggests sandblast */}
      <Ellipse cx="38" cy="78" rx="2.5" ry="1.5" fill={palette.white} opacity={0.4} />
      <Ellipse cx="54" cy="82" rx="3" ry="1.5" fill={palette.white} opacity={0.3} />
      <Ellipse cx="45" cy="88" rx="2" ry="1" fill={palette.white} opacity={0.35} />

      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
