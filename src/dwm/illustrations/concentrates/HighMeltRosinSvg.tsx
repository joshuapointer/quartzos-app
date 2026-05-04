import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function HighMeltRosinSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="hm-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="hm-blob" cx="36%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#F8E060" stopOpacity="1" />
          <Stop offset="40%" stopColor="#C88000" stopOpacity="1" />
          <Stop offset="100%" stopColor="#7A4800" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="hm-spec" cx="32%" cy="28%" r="35%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={palette.white} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#hm-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Premium glassy blob — deep amber, very strong specular */}
      <Path
        d="M22 66 Q26 42 50 40 Q74 42 78 64 Q82 80 60 88 Q38 92 26 80 Q18 72 22 66Z"
        fill="url(#hm-blob)"
        stroke="#6A3800"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Strong specular highlight — very glassy read */}
      <Ellipse cx="38" cy="50" rx="16" ry="6" fill="url(#hm-spec)" />
      <Ellipse cx="64" cy="62" rx="7" ry="3" fill={palette.white} opacity={0.55} />
      <Ellipse cx="44" cy="44" rx="4" ry="1.8" fill={palette.white} opacity={0.8} />

      {/* Secondary reflection */}
      <Ellipse cx="62" cy="78" rx="5" ry="2" fill={palette.white} opacity={0.3} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
