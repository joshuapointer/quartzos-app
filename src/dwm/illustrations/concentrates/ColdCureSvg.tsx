import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function ColdCureSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="cc-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="cc-badder" cx="42%" cy="38%" r="60%">
          <Stop offset="0%" stopColor="#F0E2B0" stopOpacity="1" />
          <Stop offset="60%" stopColor="#D4BC72" stopOpacity="1" />
          <Stop offset="100%" stopColor="#B89840" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#cc-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Creamy badder mound — soft, lower sheen than live rosin */}
      <Path
        d="M26 72 Q30 50 50 48 Q70 50 74 72 Q76 86 58 90 Q40 92 30 86 Q22 80 26 72Z"
        fill="url(#cc-badder)"
        stroke="#9A7E30"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Subtle granular texture — slightly matte */}
      <Ellipse cx="40" cy="60" rx="8" ry="4" fill={palette.white} opacity={0.22} />
      <Ellipse cx="58" cy="56" rx="5" ry="2.5" fill={palette.white} opacity={0.18} />
      <Ellipse cx="52" cy="76" rx="6" ry="3" fill={palette.white} opacity={0.15} />

      {/* Small granule dots */}
      <Ellipse cx="34" cy="70" rx="1.5" ry="1" fill="#C4A840" opacity={0.4} />
      <Ellipse cx="64" cy="68" rx="1.2" ry="0.8" fill="#C4A840" opacity={0.35} />
      <Ellipse cx="48" cy="84" rx="1.4" ry="0.9" fill="#C4A840" opacity={0.35} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
