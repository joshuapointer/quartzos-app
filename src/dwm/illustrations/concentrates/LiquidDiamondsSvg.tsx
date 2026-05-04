import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Path, Rect } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { palette } from '../../tokens';
import type { IllustrationProps } from '../bangers/FlatTopSvg';

export default function LiquidDiamondsSvg({ size = 180, accent = palette.accent }: IllustrationProps) {
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Defs>
        <LinearGradient id="ld-cart" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.surface} stopOpacity="0.9" />
          <Stop offset="50%" stopColor={palette.white} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.border} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="ld-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F0C830" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#C88800" stopOpacity="0.9" />
        </LinearGradient>
        <RadialGradient id="ld-window" cx="35%" cy="35%" r="55%">
          <Stop offset="0%" stopColor={palette.white} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={palette.white} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Ellipse cx="50" cy="110" rx="18" ry="4" fill={palette.shadow} opacity={0.4} />

      {/* Cart body — rectangle silhouette */}
      <Rect x="30" y="42" width="40" height="62" rx="6"
        fill="url(#ld-cart)"
        stroke={palette.fg}
        strokeWidth="1.4"
      />

      {/* Amber liquid fill — bottom portion */}
      <Path
        d="M31 72 L31 98 Q31 103 36 103 L64 103 Q69 103 69 98 L69 72 Z"
        fill="url(#ld-fill)"
        stroke="none"
      />
      {/* Fill level line */}
      <Path d="M31 72 L69 72" stroke="#A07000" strokeWidth="0.8" opacity={0.5} />

      {/* Cart window highlight */}
      <Rect x="31" y="42" width="38" height="60" rx="5" fill="url(#ld-window)" />

      {/* Mouthpiece tip */}
      <Rect x="42" y="26" width="16" height="18" rx="4"
        fill={palette.surface}
        stroke={palette.muted}
        strokeWidth="1.2"
      />
      <Ellipse cx="50" cy="26" rx="5" ry="2" fill={palette.border} opacity={0.5} />

      {/* 510-thread bottom connector */}
      <Rect x="36" y="103" width="28" height="8" rx="3"
        fill={palette.border}
        stroke={palette.muted}
        strokeWidth="1"
      />

      {/* Side edge highlight */}
      <Path d="M33 46 L33 96" stroke={palette.white} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity={0.45} />

      <Rect x="30" y="42" width="40" height="62" rx="6" fill="none" stroke={accent as string} strokeWidth="0.7" opacity={0.35} />
    </Svg>
  );
}
