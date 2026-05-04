import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function RosinBadderSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="rb2-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="rb2-badder" cx="40%" cy="36%" r="62%">
          <Stop offset="0%" stopColor="#EDD898" stopOpacity="1" />
          <Stop offset="55%" stopColor="#C4A048" stopOpacity="1" />
          <Stop offset="100%" stopColor="#9C7820" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#rb2-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Whipped mound */}
      <Path
        d="M28 74 Q30 52 50 50 Q70 52 72 72 Q74 86 58 90 Q42 92 32 86 Q24 80 28 74Z"
        fill="url(#rb2-badder)"
        stroke="#8A6818"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Swirl lines through the body — whipped texture read */}
      <Path d="M34 64 Q42 56 54 62 Q64 68 60 78" stroke="#B08828" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M38 72 Q46 64 58 70" stroke="#B08828" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity={0.4} />
      <Path d="M44 80 Q52 74 62 78" stroke="#B08828" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity={0.35} />

      {/* Soft highlight */}
      <Ellipse cx="40" cy="60" rx="10" ry="4.5" fill={palette.white} opacity={0.28} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
