import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function WaxBudderSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="wb-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="wb-wax" cx="40%" cy="38%" r="62%">
          <Stop offset="0%" stopColor="#EDD070" stopOpacity="1" />
          <Stop offset="55%" stopColor="#C09828" stopOpacity="1" />
          <Stop offset="100%" stopColor="#907010" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#wb-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Opaque cream-amber soft mound */}
      <Path
        d="M28 76 Q30 54 50 52 Q70 54 72 74 Q74 86 58 90 Q42 92 32 86 Q24 82 28 76Z"
        fill="url(#wb-wax)"
        stroke="#7A5808"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Soft mound highlight — opaque, not glassy */}
      <Ellipse cx="40" cy="62" rx="11" ry="4.5" fill={palette.white} opacity={0.3} />
      <Ellipse cx="58" cy="66" rx="5" ry="2.5" fill={palette.white} opacity={0.22} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
