import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function ShatterSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="sh-tile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={palette.butter} stopOpacity="0.45" />
          <Stop offset="100%" stopColor={palette.warm} stopOpacity="0.3" />
        </LinearGradient>
        <LinearGradient id="sh-glass" x1="10%" y1="10%" x2="90%" y2="90%">
          <Stop offset="0%" stopColor="#F0D060" stopOpacity="0.85" />
          <Stop offset="50%" stopColor="#C89020" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="#8A5800" stopOpacity="0.8" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="102" rx="34" ry="6" fill={palette.shadow} opacity={0.4} />
      <Ellipse cx="50" cy="98" rx="34" ry="7" fill="url(#sh-tile)" stroke={palette.border} strokeWidth="1.2" />
      <Ellipse cx="50" cy="96" rx="26" ry="4.5" fill={palette.white} opacity={0.15} />

      {/* Angled shard — glassy translucent amber sheet */}
      <Path
        d="M24 82 L30 44 L68 38 L76 72 L58 90 Z"
        fill="url(#sh-glass)"
        stroke="#9A6800"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Snapped corner — the break read */}
      <Path
        d="M68 38 L80 30 L76 46 Z"
        fill="#C89020"
        opacity={0.5}
        stroke="#9A6800"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Glass internal refraction lines */}
      <Path d="M32 70 L62 46" stroke={palette.white} strokeWidth="1" fill="none" opacity={0.4} strokeLinecap="round" />
      <Path d="M38 80 L70 58" stroke={palette.white} strokeWidth="0.7" fill="none" opacity={0.3} strokeLinecap="round" />

      {/* Edge highlight — glassy sheen */}
      <Path d="M30 44 L32 70" stroke={palette.white} strokeWidth="2" fill="none" opacity={0.5} strokeLinecap="round" />

      <Ellipse cx="50" cy="98" rx="34" ry="7" fill="none" stroke={accent as string} strokeWidth="0.6" opacity={0.35} />
    </Svg>
  );
}
