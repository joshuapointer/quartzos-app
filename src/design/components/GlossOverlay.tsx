import React from 'react';
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlossOverlay({ intensity = 1, style }: Props) {
  const alpha = Math.max(0, Math.min(1, 0.4 * intensity));
  return (
    <View pointerEvents="none" style={[styles.wrap, style]}>
      <LinearGradient
        colors={[`rgba(246,222,210,${alpha})`, 'rgba(246,222,210,0)'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.grad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  grad: {
    ...StyleSheet.absoluteFillObject,
  },
});
