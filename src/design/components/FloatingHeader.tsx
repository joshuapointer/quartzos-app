import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../tokens';
import { useThemeColors } from '../ThemeContext';

export interface FloatingHeaderProps {
  connectionState?: string;
}

export function FloatingHeader({ connectionState = '' }: FloatingHeaderProps) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  return (
    <View style={[styles.container, { top: 16 + insets.top, borderColor: tc.glassBorder }]} pointerEvents="none">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, { backgroundColor: tc.bgDeep + 'BF' }]} />
      <View style={styles.row}>
        {/* Left: icon */}
        <MaterialIcons name="blur-on" size={24} color={tc.primaryContainer} />

        {/* Center: wordmark */}
        <Text style={[styles.wordmark, { color: tc.primaryContainer }]}>QUARTZIE</Text>

        {/* Right: status pill */}
        <StatusPill connectionState={connectionState} tc={tc} />
      </View>
    </View>
  );
}

function StatusPill({ connectionState, tc }: FloatingHeaderProps & { tc: ReturnType<typeof useThemeColors> }) {
  let dotColor = colors.error;
  let label = 'OFFLINE';

  if (connectionState === 'READY') {
    dotColor = colors.success;
    label = 'LIVE';
  } else if (connectionState === 'RECONNECTING' || connectionState === 'SCANNING' || connectionState === 'CONNECTING' || connectionState === 'DISCOVERING') {
    dotColor = colors.warning;
    label = 'SYNCING';
  }

  return (
    <View style={[styles.pill, { backgroundColor: tc.bgDeep + '99', borderColor: tc.glassBorder }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.pillLabel, { color: tc.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  wordmark: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 4.8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
