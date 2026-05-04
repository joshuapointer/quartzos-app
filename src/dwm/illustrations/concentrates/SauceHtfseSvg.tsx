import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function SauceHtfseSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="sa2-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="sa2-pool" cx="42%" cy="44%" r="60%">
          <Stop offset="0%" stopColor="#D4980C" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#8A5800" stopOpacity="0.9" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#sa2-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Deep amber syrup pool */}
      <Path
        d="M20 84 Q22 70 50 68 Q78 70 80 84 Q82 94 50 96 Q18 94 20 84Z"
        fill="url(#sa2-pool)"
        stroke="#7A4800"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Pool surface highlight */}
      <Ellipse cx="40" cy="76" rx="14" ry="4" fill={palette.white} opacity={0.25} />

      {/* Large diamond crystal 1 — submerged */}
      <Rect x="32" y="70" width="10" height="10" rx="1.5"
        fill={palette.white} opacity={0.7}
        stroke={palette.border} strokeWidth="0.8"
        transform="rotate(20 37 75)"
      />
      <Rect x="33" y="71" width="5" height="3" rx="0.8"
        fill={palette.white} opacity={0.5}
        transform="rotate(20 35 72)"
      />

      {/* Large diamond crystal 2 */}
      <Rect x="56" y="74" width="8" height="8" rx="1.2"
        fill={palette.white} opacity={0.65}
        stroke={palette.border} strokeWidth="0.7"
        transform="rotate(-15 60 78)"
      />
      <Rect x="57" y="75" width="4" height="2.5" rx="0.6"
        fill={palette.white} opacity={0.45}
        transform="rotate(-15 59 76)"
      />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
