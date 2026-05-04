import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { radius, shadow } from '../tokens';
import { useThemeColors } from '../ThemeContext';

interface Props extends ViewProps {
  children?: React.ReactNode;
  padding?: number;
  borderRadius?: number;
  /**
   * Legacy prop kept for back-compat. Glassmorphism is dead in the
   * shatterbox register — surfaces are matte. Ignored at runtime.
   */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  padding = 16,
  borderRadius = radius.lg,
  style,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  intensity,
  ...rest
}: Props) {
  const tc = useThemeColors();
  return (
    <View style={[styles.shadowWrap, shadow.card, style]} {...rest}>
      <View style={[styles.clip, { borderRadius, backgroundColor: tc.glassFill }]}>
        <View style={[styles.border, { borderRadius, borderColor: tc.glassBorder }]} pointerEvents="none" />
        <View style={[styles.inner, { padding }]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    backgroundColor: 'transparent',
  },
  clip: {
    overflow: 'hidden',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  inner: {
    position: 'relative',
  },
});
