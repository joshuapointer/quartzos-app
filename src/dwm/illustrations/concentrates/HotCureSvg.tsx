import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function HotCureSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="hc-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="hc-blob" cx="44%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#D4A040" stopOpacity="1" />
          <Stop offset="55%" stopColor="#B07820" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7A4E00" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#hc-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Warmer amber-brown, slightly sunken / flatter than fresh-press */}
      <Path
        d="M28 76 Q30 56 50 54 Q70 56 72 74 Q74 86 58 90 Q42 92 32 86 Q24 82 28 76Z"
        fill="url(#hc-blob)"
        stroke="#6A3E00"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Smooth surface — minimal highlights, slightly matte */}
      <Ellipse cx="40" cy="64" rx="9" ry="3.5" fill={palette.white} opacity={0.2} />
      <Ellipse cx="60" cy="70" rx="4" ry="2" fill={palette.white} opacity={0.15} />

      {/* Subtle sunken center shadow */}
      <Ellipse cx="50" cy="76" rx="14" ry="6" fill="#7A4E00" opacity={0.12} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
