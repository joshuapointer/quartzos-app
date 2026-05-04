import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function InsertSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ins-host" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.85" />
          <Stop offset="50%" stopColor={palette.white} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.8" />
        </LinearGradient>
        <LinearGradient id="ins-cup" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={palette.surface} stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="26" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="16" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Host banger — outer bucket */}
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />
      <Path
        d="M28 26 L28 88 Q28 98 38 98 L62 98 Q72 98 72 88 L72 26"
        fill="url(#ins-host)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Drop-in insert cup — floats slightly above host floor */}
      <Ellipse cx="50" cy="46" rx="16" ry="3" fill={palette.surface} stroke={palette.muted} strokeWidth="1.1" />
      <Path
        d="M34 46 L34 82 Q34 90 42 90 L58 90 Q66 90 66 82 L66 46"
        fill="url(#ins-cup)"
        stroke={palette.muted}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Separation gap line — the "drop-in" read */}
      <Path d="M34 46 Q34 42 50 42 Q66 42 66 46" stroke={palette.muted} strokeWidth="0.9" fill="none" strokeDasharray="2 2" opacity={0.55} />

      {/* Insert inner highlight */}
      <Ellipse cx="50" cy="46" rx="10" ry="2" fill={palette.white} opacity={0.6} />
      <Path d="M37 52 Q35 68 37 80" stroke={palette.white} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={0.5} />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.4} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
