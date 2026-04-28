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
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
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
          accessibilityLabel="Start a new session"
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
  const startedAt = useFlow((s) => s.startedAt);
  const phaseTrack = useFlow((s) => s.phaseTrack);
  const phaseIdx = useFlow((s) => s.phaseIdx);
  const windowState = useFlow((s) => s.windowState);
  const reset = useFlow((s) => s.reset);

  // Guard: if startedAt is null, session was never properly started
  const hasValidSession = startedAt != null && sessionSeconds > 0;

  // Detect early exit: session ended before reaching the last phase
  const reachedEnd = phaseIdx >= phaseTrack.length - 1;
  const endedEarly = hasValidSession && !reachedEnd;

  // Track whether the session had a missed window at any point.
  // windowState reflects the last known state from the store.
  const hadMissedWindow = windowState === 'missed';

  const elapsed = hasValidSession ? formatElapsed(sessionSeconds) : null;

  // Headline adapts to session outcome
  const headline = (() => {
    if (!hasValidSession) return 'Session ended.';
    if (endedEarly) return 'Ended early.';
    return 'Sesh done.';
  })();

  // Sub copy adapts to outcome context
  const subCopy = (() => {
    if (!hasValidSession) return 'No session data recorded.';
    if (endedEarly && hadMissedWindow) return 'Window was missed before completing the full flow.';
    if (endedEarly) return 'Session stopped before the clean phase.';
    if (hadMissedWindow) return 'Completed with a missed window. Consider a longer cool time next run.';
    return 'Full cycle complete.';
  })();

  // Stagger: eyebrow, headline, elapsed/sub, button
  const STAGGER = 60;
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0);

  const easing = Easing.bezier(
    EASE_OUT_EXPO.curve[0],
    EASE_OUT_EXPO.curve[1],
    EASE_OUT_EXPO.curve[2],
    EASE_OUT_EXPO.curve[3],
  );

  useEffect(() => {
    [sv0, sv1, sv2, sv3, sv4].forEach((sv) => { sv.value = 0; });
    const enter = (sv: typeof sv0, delay: number) => {
      sv.value = withDelay(delay, withTiming(1, { duration: DUR.base, easing }));
    };
    enter(sv0, 0);
    enter(sv1, STAGGER);
    enter(sv2, STAGGER * 2);
    enter(sv3, STAGGER * 3);
    enter(sv4, STAGGER * 4);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const makeStyle = (sv: typeof sv0) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ translateY: (1 - sv.value) * 12 }],
    }));

  const s0 = makeStyle(sv0);
  const s1 = makeStyle(sv1);
  const s2 = makeStyle(sv2);
  const s3 = makeStyle(sv3);
  const s4 = makeStyle(sv4);

  // TODO: persist session data to storage once a save action is wired up
  // (store currently holds session in memory only — no persistence layer yet)

  return (
    <View style={styles.container}>
      {/* Phase completion label */}
      <Animated.View style={s0}>
        <Text style={styles.eyebrow}>COMPLETE</Text>
      </Animated.View>

      {/* Headline with ember halo behind it */}
      <Animated.View style={[styles.headlineWrap, s1]}>
        <EmberHalo />
        <Text style={styles.headline}>{headline}</Text>
      </Animated.View>

      {/* Elapsed time — only when we have a real session */}
      {elapsed !== null && (
        <Animated.View style={s2}>
          <Text style={styles.elapsed}>{elapsed} elapsed</Text>
        </Animated.View>
      )}

      {/* Outcome sub copy */}
      <Animated.View style={s3}>
        <Text style={styles.subCopy}>{subCopy}</Text>
      </Animated.View>

      {/* New session button — resets store cleanly */}
      <Animated.View style={[styles.btnWrap, s4]}>
        <ActionButton label="New session" onPress={reset} />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACE.xs,
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
  },
  haloWrap: {
    position: 'absolute',
    width: 260,
    height: 120,
    top: -30,
    left: -30,
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
  subCopy: {
    fontFamily: FONTS.sans + '_400Regular',
    fontSize: 12,
    color: THEME.bone[35],
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
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
    color: THEME.bone[100],
  },
});
