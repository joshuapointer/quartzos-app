import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Path, Polygon } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function ThcaDiamondsSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="td-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.6" />
        </LinearGradient>
        <RadialGradient id="td-gem" cx="30%" cy="28%" r="55%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.95" />
          <Stop offset="60%" stopColor={palette.surface} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.7" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.4} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#td-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.2} />

      {/* 4 angular gemstones — pyramid + cube shapes, no terpene matrix */}
      {/* Gem 1 — pyramid shape */}
      <Polygon
        points="36,56 44,76 28,76"
        fill="url(#td-gem)"
        stroke={palette.muted}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <Path d="M36 56 L44 76" stroke={palette.white} strokeWidth="0.6" opacity={0.5} />

      {/* Gem 2 — cube shape */}
      <Path
        d="M48 60 L56 54 L64 60 L64 72 L56 78 L48 72 Z"
        fill="url(#td-gem)"
        stroke={palette.muted}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <Path d="M48 60 L56 66 L64 60" stroke={palette.white} strokeWidth="0.6" opacity={0.45} fill="none" />
      <Path d="M56 66 L56 78" stroke={palette.white} strokeWidth="0.6" opacity={0.4} />

      {/* Gem 3 — smaller pyramid */}
      <Polygon
        points="68,68 74,84 62,84"
        fill="url(#td-gem)"
        stroke={palette.muted}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Gem 4 — small cube */}
      <Path
        d="M28 80 L34 76 L40 80 L40 88 L34 92 L28 88 Z"
        fill="url(#td-gem)"
        stroke={palette.muted}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Sparkle accents */}
      <Path d="M44 52 L46 48 L48 52 L44 52" fill={palette.lilac} opacity={0.7} />
      <Path d="M66 58 L68 54 L70 58 L66 58" fill={palette.lilac} opacity={0.6} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
