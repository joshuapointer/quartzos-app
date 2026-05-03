import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../ThemeContext';

interface DataStripProps {
  sessionTimeFormatted: string;
  peakTempFormatted: string;
  targetRangeFormatted: string;
  style?: StyleProp<ViewStyle>;
}

export function DataStrip({
  sessionTimeFormatted,
  peakTempFormatted,
  targetRangeFormatted,
  style,
}: DataStripProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.glassFill },
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.borderOverlay, { borderColor: colors.glassBorder }]} pointerEvents="none" />

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={[styles.value, { color: colors.onSurface }]}>{sessionTimeFormatted}</Text>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>SESSION</Text>
        </View>

        <View style={styles.column}>
          <Text style={[styles.value, { color: colors.onSurface }]}>{peakTempFormatted}</Text>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>PEAK</Text>
        </View>

        <View style={styles.column}>
          <Text style={[styles.value, { color: colors.onSurface }]}>{targetRangeFormatted}</Text>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>TARGET</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'GeistMono_300Light',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    opacity: 0.6,
    marginTop: 2,
  },
});
