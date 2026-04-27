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

interface Props {
  children: React.ReactNode;
  variant?: SurfaceCardVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Elevation shadow — defaults true */
  elevated?: boolean;
}

const GRADIENT_MAP: Record<SurfaceCardVariant, readonly [string, string]> = {
  active:   gradients.cardActive,
  inactive: gradients.cardInactive,
  neutral:  gradients.cardNeutral,
};

export function SurfaceCard({
  children,
  variant = 'neutral',
  borderRadius = radius.lg,
  style,
  contentStyle,
  elevated = true,
}: Props) {
  return (
    <View style={[elevated && styles.shadow, style]}>
      <LinearGradient
        colors={GRADIENT_MAP[variant]}
        style={[styles.card, { borderRadius }]}
      >
        <View
          style={[StyleSheet.absoluteFillObject, styles.border, { borderRadius }]}
          pointerEvents="none"
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    overflow: 'hidden',
  },
  border: {
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  content: {
    // padding set by consumer
  },
});
