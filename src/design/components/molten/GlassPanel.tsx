import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../tokens';

type Tone = 'thin' | 'thick' | 'pane';
type Edge = 'soft' | 'strong' | 'none';

interface GlassPanelProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
  edge?: Edge;
  radius?: number;
}

const toneColor: Record<Tone, string> = {
  thin:  colors.glassThin,
  thick: colors.glassThick,
  pane:  colors.glassPane,
};

const edgeBorderColor: Record<Edge, string | undefined> = {
  soft:   colors.glassEdge,
  strong: colors.glassEdgeStrong,
  none:   undefined,
};

export function GlassPanel({
  children,
  style,
  tone = 'pane',
  edge = 'soft',
  radius: borderRadius = 18,
}: GlassPanelProps) {
  const bg = toneColor[tone];
  const borderColor = edgeBorderColor[edge];
  const hasBorder = edge !== 'none';

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        hasBorder && { borderWidth: 0.5, borderColor },
        style,
      ]}
    >
      <BlurView
        intensity={22}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius, backgroundColor: bg },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
