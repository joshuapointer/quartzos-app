import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function LiveRosinSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="lr-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="lr-blob" cx="38%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#F5D080" stopOpacity="1" />
          <Stop offset="55%" stopColor="#D4920A" stopOpacity="1" />
          <Stop offset="100%" stopColor="#A86C00" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="lr-spec" cx="35%" cy="30%" r="40%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={palette.white} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Tile / dish */}
      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#lr-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Glossy amber blob */}
      <Path
        d="M24 68 Q28 44 50 42 Q74 42 76 66 Q80 82 60 88 Q38 92 28 82 Q20 74 24 68Z"
        fill="url(#lr-blob)"
        stroke="#8B5C00"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Specular highlight — the gloss read */}
      <Ellipse cx="40" cy="54" rx="14" ry="5" fill="url(#lr-spec)" />
      <Ellipse cx="62" cy="68" rx="6" ry="2.5" fill={palette.white} opacity={0.5} />

      {/* Pull string from above */}
      <Path d="M50 42 Q52 28 54 18" stroke="#C48A00" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.6} />
      <Ellipse cx="54" cy="18" rx="2" ry="1" fill="#C48A00" opacity={0.5} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
