import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../tokens';
import { useThemeColors } from '../ThemeContext';
import { QWordmark } from './QWordmark';

export interface FloatingHeaderProps {
  connectionState?: string;
}

export function FloatingHeader({ connectionState = '' }: FloatingHeaderProps) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  return (
    <View style={[styles.container, { top: 16 + insets.top, borderColor: tc.glassBorder }]} pointerEvents="none">
      {/* Matte ink fill — no BlurView in shatterbox register */}
      <View style={[styles.overlay, { backgroundColor: tc.bgDeep }]} />
      <View style={styles.row}>
        {/* Left: icon */}
        <MaterialIcons name="blur-on" size={24} color={colors.firedAmber} />

        {/* Center: wordmark */}
        <View style={styles.wordmarkWrap} pointerEvents="none">
          <QWordmark connected={connectionState === 'READY'} />
        </View>

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
    dotColor = colors.firedAmber;
    label = 'LIVE';
  } else if (connectionState === 'RECONNECTING' || connectionState === 'SCANNING' || connectionState === 'CONNECTING' || connectionState === 'DISCOVERING') {
    dotColor = colors.warning;
    label = 'SYNCING';
  }

  return (
    <View style={[styles.pill, { backgroundColor: tc.surface3, borderColor: tc.glassBorder }]}>
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
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
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
  wordmarkWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  // Engraved chip (2px) — was a 9999px pill in the molten refresh register
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  // Status dot stays round — small enough that the engraved geometry rule
  // would read as a square pixel.
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
