import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function RosinJamSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="rj-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="rj-sauce" cx="40%" cy="38%" r="65%">
          <Stop offset="0%" stopColor="#F0C850" stopOpacity="1" />
          <Stop offset="60%" stopColor="#C89010" stopOpacity="1" />
          <Stop offset="100%" stopColor="#9A6800" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#rj-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Amber sauce blob */}
      <Path
        d="M26 72 Q28 50 50 48 Q72 50 74 70 Q76 84 58 90 Q40 92 30 84 Q22 78 26 72Z"
        fill="url(#rj-sauce)"
        stroke="#8A6000"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Diamond crystals embedded in the sauce */}
      <Rect x="36" y="58" width="7" height="7" rx="1" fill={palette.white} opacity={0.75} stroke={palette.border} strokeWidth="0.7" transform="rotate(20 39 61)" />
      <Rect x="52" y="54" width="6" height="6" rx="1" fill={palette.white} opacity={0.7} stroke={palette.border} strokeWidth="0.7" transform="rotate(-15 55 57)" />
      <Rect x="58" y="70" width="5" height="5" rx="0.8" fill={palette.white} opacity={0.65} stroke={palette.border} strokeWidth="0.6" transform="rotate(10 60 72)" />
      <Rect x="42" y="74" width="5" height="5" rx="0.8" fill={palette.white} opacity={0.6} stroke={palette.border} strokeWidth="0.6" transform="rotate(-25 44 76)" />

      {/* Sauce highlight */}
      <Ellipse cx="40" cy="58" rx="10" ry="4" fill={palette.white} opacity={0.35} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
