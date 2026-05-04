import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function CrumbleSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="cr2-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="cr2-chunk" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#E8C858" stopOpacity="1" />
          <Stop offset="60%" stopColor="#B89020" stopOpacity="1" />
          <Stop offset="100%" stopColor="#887000" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#cr2-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* 3 irregular dry chunks */}
      <Path
        d="M24 82 Q26 68 36 64 Q46 60 48 70 Q50 80 38 86 Q28 88 24 82Z"
        fill="url(#cr2-chunk)"
        stroke="#706000"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <Path
        d="M46 76 Q48 60 58 56 Q68 54 70 66 Q72 76 62 82 Q52 84 46 76Z"
        fill="url(#cr2-chunk)"
        stroke="#706000"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <Path
        d="M34 90 Q36 80 44 78 Q52 76 52 84 Q52 90 44 92 Q36 92 34 90Z"
        fill="url(#cr2-chunk)"
        stroke="#706000"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Stippled texture dots — dry, powdery read */}
      <Circle cx="30" cy="74" r="1" fill="#906800" opacity={0.4} />
      <Circle cx="42" cy="66" r="0.9" fill="#906800" opacity={0.35} />
      <Circle cx="56" cy="60" r="1.1" fill="#906800" opacity={0.38} />
      <Circle cx="66" cy="68" r="0.9" fill="#906800" opacity={0.35} />
      <Circle cx="60" cy="76" r="1" fill="#906800" opacity={0.35} />
      <Circle cx="38" cy="84" r="0.8" fill="#906800" opacity={0.3} />

      {/* Chunk highlights */}
      <Ellipse cx="30" cy="72" rx="4" ry="2" fill={palette.white} opacity={0.25} />
      <Ellipse cx="54" cy="62" rx="5" ry="2" fill={palette.white} opacity={0.22} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
