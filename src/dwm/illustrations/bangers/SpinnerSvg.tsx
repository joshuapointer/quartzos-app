import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function SpinnerSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="sp-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
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
        fill="url(#sp-quartz)"
        stroke={palette.fg}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 3 angled airflow holes drilled mid-height — diagonal to suggest spin direction */}
      {/* Left wall holes */}
      <Ellipse cx="30" cy="58" rx="2.8" ry="1.8" fill={palette.fg} opacity={0.25} stroke={palette.fg} strokeWidth="0.8" transform="rotate(-20 30 58)" />
      <Ellipse cx="30" cy="68" rx="2.8" ry="1.8" fill={palette.fg} opacity={0.22} stroke={palette.fg} strokeWidth="0.8" transform="rotate(-20 30 68)" />
      <Ellipse cx="30" cy="78" rx="2.8" ry="1.8" fill={palette.fg} opacity={0.2} stroke={palette.fg} strokeWidth="0.8" transform="rotate(-20 30 78)" />
      {/* Highlight rim of each hole */}
      <Ellipse cx="30" cy="57" rx="2" ry="1.2" fill={palette.white} opacity={0.35} transform="rotate(-20 30 57)" />
      <Ellipse cx="30" cy="67" rx="2" ry="1.2" fill={palette.white} opacity={0.3} transform="rotate(-20 30 67)" />
      <Ellipse cx="30" cy="77" rx="2" ry="1.2" fill={palette.white} opacity={0.28} transform="rotate(-20 30 77)" />

      <Ellipse cx="50" cy="26" rx="14" ry="2.4" fill={palette.white} opacity={0.5} />
      <Path d="M36 34 Q34 60 36 84" stroke={palette.white} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity={0.45} />
      <Ellipse cx="50" cy="26" rx="22" ry="4" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
