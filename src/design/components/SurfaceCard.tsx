import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, radius, colors } from '../tokens';

export type SurfaceCardVariant = 'active' | 'inactive' | 'neutral';
export type SurfaceCardGlow = 'hot' | 'cool' | 'none';

interface Props {
  children: React.ReactNode;
  variant?: SurfaceCardVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Elevation shadow — defaults true */
  elevated?: boolean;
  /** Optional neon outer glow. Overrides variant border + adds shadow. */
  glow?: SurfaceCardGlow;
}

const GRADIENT_MAP: Record<SurfaceCardVariant, readonly [string, string]> = {
  active:   gradients.cardActive,
  inactive: gradients.cardInactive,
  neutral:  gradients.cardNeutral,
};

const VARIANT_BORDER: Record<SurfaceCardVariant, string> = {
  active:   'rgba(255,255,255,0.20)',
  inactive: 'rgba(255,255,255,0.06)',
  neutral:  'rgba(255,255,255,0.08)',
};

const GLOW_BORDER: Record<Exclude<SurfaceCardGlow, 'none'>, string> = {
  hot:  'rgba(255,255,255,0.55)',
  cool: '#00a8ff',
};

const GLOW_SHADOW: Record<Exclude<SurfaceCardGlow, 'none'>, string> = {
  hot:  '#ffffff',
  cool: '#00a8ff',
};

export function SurfaceCard({
  children,
  variant = 'neutral',
  borderRadius = radius.lg,
  style,
  contentStyle,
  elevated = true,
  glow = 'none',
}: Props) {
  const borderColor = glow !== 'none' ? GLOW_BORDER[glow] : VARIANT_BORDER[variant];
  const glowShadow = glow !== 'none'
    ? {
        shadowColor: GLOW_SHADOW[glow],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
      }
    : null;

  return (
    <View style={[elevated && styles.shadow, glowShadow, style]}>
      <LinearGradient
        colors={GRADIENT_MAP[variant]}
        style={[styles.card, { borderRadius }]}
      >
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.border,
            { borderRadius, borderColor },
          ]}
          pointerEvents="none"
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    overflow: 'hidden',
  },
  border: {
    borderWidth: 1,
  },
  content: {
    // padding set by consumer
  },
});
