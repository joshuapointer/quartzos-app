import React from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function FreshPressSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="fp-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.35" />
        </LinearGradient>
        <RadialGradient id="fp-blob" cx="36%" cy="32%" r="68%">
          <Stop offset="0%" stopColor="#FADD70" stopOpacity="1" />
          <Stop offset="50%" stopColor="#E09C10" stopOpacity="1" />
          <Stop offset="100%" stopColor="#B07000" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="100" rx="34" ry="7" fill={palette.shadow} opacity={0.5} />
      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="url(#fp-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="94" rx="26" ry="5" fill={palette.white} opacity={0.18} />

      {/* Lumpier, more uneven than live-rosin — irregular blob shape */}
      <Path
        d="M22 70 Q24 52 40 44 Q52 38 64 46 Q78 52 78 68 Q80 84 62 90 Q44 94 32 86 Q18 78 22 70Z"
        fill="url(#fp-blob)"
        stroke="#906000"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Lumpy surface bumps — the uneven fresh-press read */}
      <Path d="M36 52 Q40 46 46 50" stroke="#C07800" strokeWidth="1" fill="none" strokeLinecap="round" opacity={0.5} />
      <Path d="M56 46 Q62 44 66 50" stroke="#C07800" strokeWidth="1" fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M62 66 Q68 62 72 68" stroke="#C07800" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity={0.4} />

      {/* Bright specular */}
      <Ellipse cx="38" cy="52" rx="12" ry="5" fill={palette.white} opacity={0.55} />
      <Ellipse cx="60" cy="60" rx="5" ry="2" fill={palette.white} opacity={0.4} />

      <Ellipse cx="50" cy="96" rx="34" ry="8" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
