import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function LiveResinSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="lre-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="lre-sauce" cx="42%" cy="38%" r="62%">
          <Stop offset="0%" stopColor="#F0D060" stopOpacity="1" />
          <Stop offset="55%" stopColor="#C89420" stopOpacity="1" />
          <Stop offset="100%" stopColor="#9A6C00" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#lre-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Pooled sauce around base — loose viscosity */}
      <Path
        d="M20 82 Q22 72 50 70 Q78 72 80 82 Q82 92 50 94 Q18 92 20 82Z"
        fill="#C89420"
        opacity={0.5}
        stroke="none"
      />

      {/* Low dome center mound */}
      <Path
        d="M28 76 Q30 58 50 56 Q70 58 72 74 Q74 84 58 88 Q42 90 32 84 Q24 80 28 76Z"
        fill="url(#lre-sauce)"
        stroke="#8A6000"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Sauce pool highlight */}
      <Ellipse cx="50" cy="82" rx="20" ry="4" fill={palette.white} opacity={0.15} />

      {/* Dome highlight */}
      <Ellipse cx="40" cy="64" rx="10" ry="4" fill={palette.white} opacity={0.4} />
      <Ellipse cx="60" cy="68" rx="5" ry="2" fill={palette.white} opacity={0.3} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
