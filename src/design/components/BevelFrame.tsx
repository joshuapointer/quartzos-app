import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius } from '../tokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export function BevelFrame({ children, style, borderRadius = radius.lg }: Props) {
  return (
    <View style={[styles.outer, { borderRadius: borderRadius + 1 }, style]}>
      <View style={[styles.inner, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderColor: colors.surface1,
    backgroundColor: 'transparent',
    padding: 1,
  },
  inner: {
    borderWidth: 1,
    borderColor: 'rgba(244,237,228,0.28)',
    overflow: 'hidden',
  },
});
