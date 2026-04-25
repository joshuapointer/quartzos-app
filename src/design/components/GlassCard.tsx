import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, gradients, radius, shadow } from '../tokens';

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
  intensity = 45,
  style,
  ...rest
}: Props) {
  return (
    <View style={[styles.shadowWrap, shadow.card, style]} {...rest}>
      <View style={[styles.clip, { borderRadius }]}>
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={gradients.crystal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradients.gloss}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { height: '55%' }]}
        />
        {/* Top-edge gloss arc */}
        <View style={styles.arcWrap} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
            <Path
              d="M2 32 C 50 6, 150 6, 198 32"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={1.2}
              fill="none"
            />
          </Svg>
        </View>
        <View style={[styles.border, { borderRadius }]} pointerEvents="none" />
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
    backgroundColor: colors.glassDeep,
  },
  arcWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: colors.crystalEdge,
  },
  inner: {
    position: 'relative',
  },
});
