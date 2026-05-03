import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  DUR,
  EASE_OUT_EXPO,
  SCREEN,
  THEME,
} from '../theme';
import { useFlow, useBanger, useConcentrate, useCalibration } from '../store';
import { PrimaryButton } from '../components/PrimaryButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Glass summary card ───────────────────────────────────────────────────────

function SummaryCard() {
  const banger = useBanger();
  const concentrate = useConcentrate();
  const calibration = useCalibration();

  const profileName = banger?.name ?? '—';
  const materialName = concentrate?.name
    ? concentrate.name.toUpperCase()
    : '—';
  const targetTemp = calibration?.displayed ?? null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.40)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardRimGradient}
      />
      <View style={[styles.cardRow, styles.cardRowBorder]}>
        <Text style={styles.cardLabel}>PROFILE</Text>
        <Text style={styles.cardValue}>{profileName}</Text>
      </View>
      <View style={[styles.cardRow, styles.cardRowBorder]}>
        <Text style={styles.cardLabel}>MATERIAL</Text>
        <Text style={styles.cardValue}>{materialName}</Text>
      </View>
      <View style={styles.cardRow}>
        {/* Calibrated target the Dab Rite watched for — not a recorded peak.
            "PEAK TEMP" implied a measurement; this is the dial number. */}
        <Text style={styles.cardLabel}>TARGET</Text>
        {targetTemp !== null ? (
          <View style={styles.tempRow}>
            <Text style={styles.cardValue}>{targetTemp}°</Text>
            <Text style={styles.tempSuffix}>F</Text>
          </View>
        ) : (
          <Text style={styles.cardValue}>—</Text>
        )}
      </View>
    </View>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTER_EASING = Easing.bezier(
  EASE_OUT_EXPO.curve[0],
  EASE_OUT_EXPO.curve[1],
  EASE_OUT_EXPO.curve[2],
  EASE_OUT_EXPO.curve[3],
);

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

  // Animate the duration counting up from 0 to sessionSeconds on mount —
  // turns the static receipt-style readout into a beat that lands the close.
  const [animatedSeconds, setAnimatedSeconds] = useState(0);
  useEffect(() => {
    if (!hasValidSession) return;
    const target = sessionSeconds;
    const startMs = Date.now();
    const DUR_MS = 800;
    let rafId: number;

    function tick() {
      const t = Math.min(1, (Date.now() - startMs) / DUR_MS);
      // ease-out-quart — fast start, slow finish
      const eased = 1 - Math.pow(1 - t, 4);
      setAnimatedSeconds(Math.round(target * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasValidSession, sessionSeconds]);

  const elapsed = hasValidSession ? formatElapsed(animatedSeconds) : null;

  // Headline adapts to session outcome
  const headline = (() => {
    if (!hasValidSession) return 'Session closed.';
    if (endedEarly) return 'Stopped early.';
    return 'Session logged.';
  })();

  // Outcome differentiation: window-held gets a quartz calm tint;
  // slipped/stopped/closed use a quieter bone tone.
  const headlineColor = (() => {
    if (hasValidSession && !endedEarly && !hadMissedWindow) {
      // "Session logged." — window was held
      return THEME.quartz.bright;
    }
    // "Window slipped.", "Stopped early.", "Session closed."
    return THEME.bone[50];
  })();

  // One short warm acknowledgment line for successful sessions — the brand
  // promise is "ritualistic, restrained": one line, in bone[50], no theater.
  const acknowledgment = (() => {
    if (!hasValidSession || endedEarly) return null;
    if (hadMissedWindow) return 'Window slipped.';
    return 'Window held.';
  })();

  // Sub copy adapts to outcome context (used for non-successful outcomes)
  const subCopy = (() => {
    if (!hasValidSession) return 'Nothing recorded.';
    if (endedEarly && hadMissedWindow) return 'Window missed before reaching clean phase.';
    if (endedEarly) return 'Session stopped before the clean phase.';
    return null;
  })();

  // Stagger: headline, duration, acknowledgment, summary card, button.
  const STAGGER = 60;
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0);

  useEffect(() => {
    [sv0, sv1, sv2, sv3, sv4].forEach((sv) => { sv.value = 0; });
    const enter = (sv: typeof sv0, delay: number) => {
      sv.value = withDelay(delay, withTiming(1, { duration: DUR.base, easing: ENTER_EASING }));
    };
    enter(sv0, 0);
    enter(sv1, STAGGER);
    enter(sv2, STAGGER * 2);
    enter(sv3, STAGGER * 3);
    enter(sv4, STAGGER * 4);
  }, []);

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
  const s4 = useAnimatedStyle(() => ({
    opacity: sv4.value,
    transform: [{ translateY: (1 - sv4.value) * 12 }],
  }));

  return (
    <View style={styles.container}>
      {/* Headline — orb above (rendered by QFlowShell at 'complete' state)
          carries the visual closure; the dot was undersized after the orb
          climax during the dab window. */}
      <Animated.View style={[styles.headlineWrap, s0]}>
        <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>
      </Animated.View>

      {/* Giant amber duration — only when we have a real successful session */}
      {elapsed !== null && !endedEarly && (
        <Animated.View style={s1}>
          <Text style={styles.duration}>{elapsed}</Text>
        </Animated.View>
      )}

      {/* Sub copy for early/missed outcomes (replaces duration slot) */}
      {subCopy !== null && (
        <Animated.View style={s1}>
          <Text style={styles.subCopy}>{subCopy}</Text>
        </Animated.View>
      )}

      {/* Warm acknowledgment line — one short beat under the duration */}
      {acknowledgment !== null && (
        <Animated.View style={s2}>
          <Text style={styles.acknowledgment}>{acknowledgment}</Text>
        </Animated.View>
      )}

      {/* Glass summary card */}
      <Animated.View style={[styles.cardWrap, s3]}>
        <SummaryCard />
      </Animated.View>

      {/* New session button */}
      <Animated.View style={[styles.btnWrap, s4]}>
        <PrimaryButton label="NEW SESSION" onPress={reset} />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SCREEN.HPAD,
    paddingBottom: SCREEN.BOTTOM,
    flexDirection: 'column',
    alignItems: 'center',
    // Headline sits at the top under the persistent orb cell — let stagger
    // staircase the rest of the column below it rather than centering.
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  // Headline
  headlineWrap: {
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'Geist_400Regular',
    fontSize: 24,
    letterSpacing: -0.48,
    color: THEME.bone[100],
    textAlign: 'center',
  },
  // Giant amber duration
  duration: {
    fontFamily: 'Geist_300Light',
    fontSize: 48,
    letterSpacing: -1.92,
    lineHeight: 54,
    color: THEME.ember.base,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(255,255,255,0.30)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Sub copy for non-successful outcomes
  subCopy: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: THEME.bone[35],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Warm acknowledgment under the duration ("Window held." etc.)
  acknowledgment: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: THEME.bone[50],
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.14,
  },
  // Glass summary card
  cardWrap: {
    width: '100%',
    maxWidth: SCREEN.CARD_MAX,
    alignSelf: 'center',
    marginTop: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 14,
    shadowColor: THEME.navy[0],
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
  },
  cardRimGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 14,
  },
  cardLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: THEME.bone[70],
  },
  cardValue: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 13,
    color: THEME.bone[100],
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tempSuffix: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    color: THEME.bone[50],
  },
  // Button
  btnWrap: {
    marginTop: 24,
    width: '100%',
  },
});
