import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function SugarSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="su-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="su-body" cx="40%" cy="36%" r="64%">
          <Stop offset="0%" stopColor="#F0D860" stopOpacity="1" />
          <Stop offset="55%" stopColor="#C8A018" stopOpacity="1" />
          <Stop offset="100%" stopColor="#907000" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#su-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Small crystal cluster mound on terpene base */}
      <Path
        d="M28 80 Q30 62 50 60 Q70 62 72 78 Q74 88 58 90 Q42 92 32 86 Q24 84 28 80Z"
        fill="url(#su-body)"
        stroke="#806000"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Crystal surface sparkle dots */}
      <Circle cx="36" cy="70" r="1.8" fill={palette.white} opacity={0.8} />
      <Circle cx="44" cy="64" r="1.5" fill={palette.white} opacity={0.75} />
      <Circle cx="54" cy="66" r="2" fill={palette.white} opacity={0.8} />
      <Circle cx="62" cy="72" r="1.6" fill={palette.white} opacity={0.7} />
      <Circle cx="50" cy="76" r="1.4" fill={palette.white} opacity={0.75} />
      <Circle cx="40" cy="78" r="1.2" fill={palette.white} opacity={0.65} />
      <Circle cx="60" cy="80" r="1.3" fill={palette.white} opacity={0.65} />

      {/* Sparkle halos */}
      <Circle cx="44" cy="64" r="3" fill="none" stroke={palette.white} strokeWidth="0.5" opacity={0.4} />
      <Circle cx="54" cy="66" r="3.5" fill="none" stroke={palette.white} strokeWidth="0.5" opacity={0.35} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
