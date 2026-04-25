import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../tokens';

export interface FloatingHeaderProps {
  connectionState?: string;
}

export function FloatingHeader({ connectionState = '' }: FloatingHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { top: 16 + insets.top }]} pointerEvents="none">
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.row}>
        {/* Left: icon */}
        <MaterialIcons name="blur-on" size={24} color={colors.primaryContainer} />

        {/* Center: wordmark */}
        <Text style={styles.wordmark}>QUARTZIE</Text>

        {/* Right: status pill */}
        <StatusPill connectionState={connectionState} />
      </View>
    </View>
  );
}

function StatusPill({ connectionState }: FloatingHeaderProps) {
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
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.pillLabel}>{label}</Text>
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
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,12,31,0.60)',
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
    color: colors.primaryContainer,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(18,12,31,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
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
    color: colors.onSurfaceVariant,
  },
});
