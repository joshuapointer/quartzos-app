import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Polygon, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function DiamondsSauceSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ds-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="ds-pool" cx="42%" cy="44%" r="60%">
          <Stop offset="0%" stopColor="#D4980C" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#8A5800" stopOpacity="0.9" />
        </RadialGradient>
        <RadialGradient id="ds-gem" cx="30%" cy="28%" r="55%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={palette.surface} stopOpacity="0.8" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#ds-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Sauce pool */}
      <Path
        d="M20 84 Q22 70 50 68 Q78 70 80 84 Q82 94 50 96 Q18 94 20 84Z"
        fill="url(#ds-pool)"
        stroke="#7A4800"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <Ellipse cx="40" cy="76" rx="14" ry="4" fill={palette.white} opacity={0.22} />

      {/* Crystal gems sitting in the sauce */}
      <Polygon
        points="34,62 42,78 26,78"
        fill="url(#ds-gem)"
        stroke={palette.border}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <Path d="M34 62 L42 78" stroke={palette.white} strokeWidth="0.6" opacity={0.5} />

      <Path
        d="M52 58 L60 52 L68 58 L68 70 L60 76 L52 70 Z"
        fill="url(#ds-gem)"
        stroke={palette.border}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <Path d="M52 58 L60 64 L68 58" stroke={palette.white} strokeWidth="0.6" opacity={0.45} fill="none" />
      <Path d="M60 64 L60 76" stroke={palette.white} strokeWidth="0.6" opacity={0.4} />

      <Rect x="26" y="78" width="7" height="7" rx="1"
        fill="url(#ds-gem)" opacity={0.8}
        stroke={palette.border} strokeWidth="0.7"
        transform="rotate(12 29 81)"
      />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
