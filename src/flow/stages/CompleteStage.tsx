/**
 * src/flow/stages/CompleteStage.tsx
 *
 * Phase 7 — Complete stage: session-logged confirmation with ember halo glow.
 *
 * PRD §5.10 / prototype flow-shell.jsx CompleteStage (line 647).
 * The persistent orb is rendered by the parent shell, not here.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  DUR,
  EASE_OUT_EXPO,
  FONTS,
  RADIUS,
  SPACE,
  THEME,
  TYPE,
} from '../theme';
import { useFlow } from '../store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

// ─── Ember halo underlay ──────────────────────────────────────────────────────

function EmberHalo() {
  return (
    <View style={styles.haloWrap} pointerEvents="none">
      <Svg width={260} height={120} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="emberHalo"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={THEME.ember.base} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={THEME.ember.base} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="260" height="120" fill="url(#emberHalo)" />
      </Svg>
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }
  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <Animated.View style={[styles.actionShadow, animStyle]}>
      <LinearGradient
        colors={[THEME.ember.base, THEME.ember.deep]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.actionGradient}
      >
        <View style={styles.actionHighlight} />
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.actionPressable}
          accessibilityRole="button"
          accessibilityLabel="Start a new sesh"
        >
          <Text style={styles.actionBtnText}>{label}</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CompleteStage() {
  const sessionSeconds = useFlow((s) => s.sessionSeconds);
  const reset = useFlow((s) => s.reset);

  const elapsed = formatElapsed(sessionSeconds);

  // Stagger: eyebrow → headline → time → button (60ms apart)
  const STAGGER = 60;
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);

  const easing = Easing.bezier(
    EASE_OUT_EXPO.curve[0],
    EASE_OUT_EXPO.curve[1],
    EASE_OUT_EXPO.curve[2],
    EASE_OUT_EXPO.curve[3],
  );

  useEffect(() => {
    [sv0, sv1, sv2, sv3].forEach((sv) => { sv.value = 0; });
    const enter = (sv: typeof sv0, delay: number) => {
      sv.value = withDelay(delay, withTiming(1, { duration: DUR.base, easing }));
    };
    enter(sv0, 0);
    enter(sv1, STAGGER);
    enter(sv2, STAGGER * 2);
    enter(sv3, STAGGER * 3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const s0 = useAnimatedStyle(() => ({
    opacity: sv0.value,
    transform: [{ translateY: (1 - sv0.value) * 12 }],
  }));
  const s1 = useAnimatedStyle(() => ({
    opacity: sv1.value,
    transform: [{ translateY: (1 - sv1.value) * 12 }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: sv2.value,
    transform: [{ translateY: (1 - sv2.value) * 12 }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: sv3.value,
    transform: [{ translateY: (1 - sv3.value) * 12 }],
  }));

  return (
    <View style={styles.container}>
      {/* Eyebrow */}
      <Animated.View style={s0}>
        <Text style={styles.eyebrow}>COMPLETE</Text>
      </Animated.View>

      {/* Headline with ember halo behind it */}
      <Animated.View style={[styles.headlineWrap, s1]}>
        <EmberHalo />
        <Text style={styles.headline}>Sesh logged.</Text>
      </Animated.View>

      {/* Elapsed time */}
      <Animated.View style={s2}>
        <Text style={styles.elapsed}>{elapsed} elapsed</Text>
      </Animated.View>

      {/* New sesh button */}
      <Animated.View style={[styles.btnWrap, s3]}>
        <ActionButton label="New sesh" onPress={reset} />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACE.xs,       // 4
    paddingHorizontal: 22,
    paddingBottom: 130,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...TYPE.eyebrow,
    textAlign: 'center',
  },
  headlineWrap: {
    marginTop: 8,
    alignItems: 'center',
    // overflow visible so halo can bleed outside
  },
  haloWrap: {
    position: 'absolute',
    width: 260,
    height: 120,
    top: -30,
    left: -30,
    // blur simulated via large radial gradient; no blurRadius on View needed
  },
  headline: {
    fontFamily: FONTS.sans + '_300Light',
    fontSize: 32,
    letterSpacing: -1.12,
    color: THEME.bone[100],
    textAlign: 'center',
    lineHeight: 36,
  },
  elapsed: {
    fontFamily: FONTS.sans + '_400Regular',
    fontSize: 13,
    color: THEME.bone[50],
    marginTop: 8,
    textAlign: 'center',
  },
  btnWrap: {
    marginTop: 24,
    width: '100%',
  },
  actionShadow: {
    borderRadius: RADIUS.pill,
    shadowColor: THEME.ember.base,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  actionGradient: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  actionHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    borderTopLeftRadius: RADIUS.pill,
    borderTopRightRadius: RADIUS.pill,
    zIndex: 1,
  },
  actionPressable: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: FONTS.sans + '_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.26,
    color: '#fff5e8',
  },
});
