import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Rect, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from './FlatTopSvg';

export default function TerpSlurperSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ts-quartz" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.white} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="ts-dish" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="113" rx="30" ry="4" fill={palette.shadow} />
      <Rect x="43" y="8" width="14" height="14" rx="2" fill={palette.surface} stroke={palette.muted} strokeWidth="1.4" />

      {/* Small top bucket */}
      <Ellipse cx="50" cy="24" rx="18" ry="3.5" fill={palette.surface} stroke={palette.muted} strokeWidth="1.3" />
      <Path
        d="M32 24 L32 50 Q32 58 40 58 L60 58 Q68 58 68 50 L68 24"
        fill="url(#ts-quartz)"
        stroke={palette.fg}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <Ellipse cx="50" cy="24" rx="11" ry="2" fill={palette.white} opacity={0.5} />

      {/* Slotted column with visible slits */}
      <Path
        d="M44 58 L44 88 L56 88 L56 58"
        fill="url(#ts-quartz)"
        stroke={palette.fg}
        strokeWidth="1.3"
      />
      {/* Column slits */}
      <Path d="M44 66 L56 66" stroke={palette.muted} strokeWidth="0.9" opacity={0.6} />
      <Path d="M44 72 L56 72" stroke={palette.muted} strokeWidth="0.9" opacity={0.6} />
      <Path d="M44 78 L56 78" stroke={palette.muted} strokeWidth="0.9" opacity={0.6} />
      {/* Column highlight */}
      <Path d="M46 60 L46 86" stroke={palette.white} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.45} />

      {/* Bottom dish */}
      <Ellipse cx="50" cy="90" rx="22" ry="5" fill="url(#ts-dish)" stroke={palette.fg} strokeWidth="1.3" />
      <Path
        d="M28 90 Q28 104 50 104 Q72 104 72 90"
        fill="url(#ts-dish)"
        stroke={palette.fg}
        strokeWidth="1.3"
      />
      <Ellipse cx="50" cy="90" rx="14" ry="3" fill={palette.white} opacity={0.35} />

      <Ellipse cx="50" cy="24" rx="18" ry="3.5" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}
