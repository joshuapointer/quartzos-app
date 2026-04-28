/**
 * src/flow/components/QWordmark.tsx
 *
 * Header bar: sphere glyph + "Quartzie" wordmark (left) + connection-state pill (right).
 * When `onDisconnect` is provided, renders a Disconnect button instead of the status pill.
 *
 * Accessibility: the connection dot uses accessibilityLiveRegion="polite" so screen
 * readers announce connected/disconnected changes without interrupting the user.
 *
 * Tokens: src/flow/theme.ts
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { THEME } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QWordmarkProps = {
  connected: boolean;
  onDisconnect?: (() => void) | null;
};

// ─── Sphere Glyph ────────────────────────────────────────────────────────────
// Refractive ember sphere: white-center shimmer + ember radial + near-black edge.

function SphereGlyph() {
  return (
    <View style={styles.sphereWrapper}>
      <Svg width={22} height={22} viewBox="0 0 22 22">
        <Defs>
          {/* Main ember radial */}
          <RadialGradient id="sphereMain" cx="65%" cy="75%" r="60%" fx="65%" fy="75%">
            <Stop offset="0%" stopColor={THEME.ember.bright} stopOpacity="1" />
            <Stop offset="36%" stopColor={THEME.ember.bright} stopOpacity="1" />
            <Stop offset="50%" stopColor={THEME.ember.deep} stopOpacity="1" />
            <Stop offset="100%" stopColor="#02060e" stopOpacity="1" />
          </RadialGradient>
          {/* Bone shimmer highlight */}
          <RadialGradient id="sphereShimmer" cx="32%" cy="26%" r="36%" fx="32%" fy="26%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.40" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="11" cy="11" r="11" fill="url(#sphereMain)" />
        <Circle cx="11" cy="11" r="11" fill="url(#sphereShimmer)" />
        {/* Thin oklch ember ring — approximated as a stroke circle */}
        <Circle
          cx="11"
          cy="11"
          r="10.25"
          fill="none"
          stroke={THEME.ember.bright}
          strokeOpacity={0.30}
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
}

// ─── Animated dot ─────────────────────────────────────────────────────────────

type DotProps = { connected: boolean; size?: number };

function AnimatedDot({ connected, size = 6 }: DotProps) {
  const progress = useSharedValue(connected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(connected ? 1 : 0, { duration: 400 });
  }, [connected, progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [THEME.bone[35], THEME.ember.bright],
    ),
    shadowColor: THEME.ember.base,
    shadowRadius: progress.value * 8,
    shadowOpacity: progress.value * 0.7,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animStyle,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={connected ? 'Connected' : 'Disconnected'}
    />
  );
}

// ─── QWordmark ────────────────────────────────────────────────────────────────

export default function QWordmark({ connected, onDisconnect }: QWordmarkProps) {
  return (
    <View style={styles.container}>
      {/* Left: glyph + wordmark */}
      <View style={styles.wordmarkRow}>
        <SphereGlyph />
        <Text style={styles.wordmarkText}>Quartzie</Text>
      </View>

      {/* Right: disconnect button OR status pill */}
      {onDisconnect ? (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDisconnect();
          }}
          style={styles.disconnectBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Disconnect Dab Rite"
        >
          <AnimatedDot connected={connected} size={5} />
          <Text style={styles.disconnectText}>Disconnect</Text>
        </Pressable>
      ) : (
        <View style={styles.statusPill}>
          <AnimatedDot connected={connected} size={6} />
          <Text style={styles.statusText}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 0,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sphereWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    // iOS glow
    shadowColor: '#e3801f',
    shadowRadius: 14,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
    // Android elevation fallback
    elevation: 6,
  },
  wordmarkText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 19,
    color: THEME.bone[100],
    letterSpacing: -0.475,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9.5,
    letterSpacing: 0.18 * 9.5,
    color: THEME.bone[50],
    textTransform: 'uppercase' as const,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
  },
  disconnectText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9,
    letterSpacing: 0.16 * 9,
    color: THEME.bone[50],
  },
});
