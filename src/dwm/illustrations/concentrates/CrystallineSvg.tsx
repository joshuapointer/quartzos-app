import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path, Circle } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function CrystallineSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="cy-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.5" />
        </LinearGradient>
        <RadialGradient id="cy-powder" cx="42%" cy="36%" r="62%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="1" />
          <Stop offset="60%" stopColor="#F0EEF4" stopOpacity="1" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.9" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.38} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#cy-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.25} />

      {/* Fine white powder mound — rounded heap */}
      <Path
        d="M28 80 Q30 58 50 56 Q70 58 72 78 Q74 88 58 91 Q42 93 32 87 Q24 84 28 80Z"
        fill="url(#cy-powder)"
        stroke={palette.border}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Powder texture — subtle surface variation */}
      <Ellipse cx="40" cy="66" rx="10" ry="3.5" fill={palette.white} opacity={0.5} />
      <Ellipse cx="60" cy="70" rx="6" ry="2.5" fill={palette.white} opacity={0.45} />
      <Ellipse cx="48" cy="78" rx="8" ry="3" fill={palette.white} opacity={0.4} />

      {/* Fine particle dots */}
      <Circle cx="36" cy="72" r="1" fill={palette.border} opacity={0.3} />
      <Circle cx="50" cy="64" r="0.8" fill={palette.border} opacity={0.28} />
      <Circle cx="62" cy="74" r="0.9" fill={palette.border} opacity={0.28} />
      <Circle cx="44" cy="82" r="0.8" fill={palette.border} opacity={0.25} />
      <Circle cx="56" cy="80" r="0.9" fill={palette.border} opacity={0.25} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
