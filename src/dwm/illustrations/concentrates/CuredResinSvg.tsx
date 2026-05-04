import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function CuredResinSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="cre-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.45" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.3" />
        </LinearGradient>
        <RadialGradient id="cre-blob" cx="45%" cy="42%" r="58%">
          <Stop offset="0%" stopColor="#C09040" stopOpacity="1" />
          <Stop offset="55%" stopColor="#8A6018" stopOpacity="1" />
          <Stop offset="100%" stopColor="#5A3A00" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.45} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#cre-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.15} />

      {/* Matte amber-brown, lower / flatter mound — drier look */}
      <Path
        d="M30 80 Q32 62 50 60 Q68 62 70 78 Q72 88 58 90 Q42 92 34 86 Q26 84 30 80Z"
        fill="url(#cre-blob)"
        stroke="#4A2C00"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Matte surface — very subdued highlight */}
      <Ellipse cx="42" cy="68" rx="8" ry="3" fill={palette.white} opacity={0.14} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
