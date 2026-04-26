import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, shadow } from '../tokens';
import { useThemeColors } from '../ThemeContext';

interface Props extends ViewProps {
  children?: React.ReactNode;
  padding?: number;
  borderRadius?: number;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  padding = 16,
  borderRadius = radius.lg,
  intensity = 20,
  style,
  ...rest
}: Props) {
  const tc = useThemeColors();
  return (
    <View style={[styles.shadowWrap, shadow.card, style]} {...rest}>
      <View style={[styles.clip, { borderRadius, backgroundColor: tc.glassFill }]}>
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Subtle inner highlight — top-left 1px border */}
        <View style={[styles.innerHighlight, { borderRadius }]} pointerEvents="none" />
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
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  inner: {
    position: 'relative',
  },
});
