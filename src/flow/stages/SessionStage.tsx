import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  DUR,
  EASE_OUT_EXPO,
  RADIUS,
  SPACE,
  THEME,
  TYPE,
} from '../theme';
import {
  useCalibration,
  useBanger,
  useFlow,
} from '../store';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGGER_MS = 60;
const ENTER_DUR = DUR.base; // 380ms

// Phase transition order for haptic firing
const PHASE_ORDER: string[] = ['load', 'heat', 'cool', 'dab', 'dunk', 'clean'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SV = ReturnType<typeof useSharedValue<number>>;

function enterSv(sv: SV, delay: number) {
  sv.value = withDelay(
    delay,
    withTiming(1, {
      duration: ENTER_DUR,
      easing: Easing.bezier(
        EASE_OUT_EXPO.curve[0],
        EASE_OUT_EXPO.curve[1],
        EASE_OUT_EXPO.curve[2],
        EASE_OUT_EXPO.curve[3],
      ),
    }),
  );
}

function useStaggerStyle(sv: SV) {
  return useAnimatedStyle(() => ({
    opacity: sv.value,
    transform: [{ translateY: (1 - sv.value) * 12 }],
  }));
}

// Format mm:ss from seconds
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropRateStrip({ dropRate }: { dropRate: number }) {
  const fast = dropRate > 3;
  return (
    <View
      style={[
        styles.dropPill,
        fast ? styles.dropPillFast : styles.dropPillNormal,
      ]}
    >
      <Text
        style={[
          styles.dropLabel,
          fast ? styles.dropLabelFast : styles.dropLabelNormal,
        ]}
      >
        {fast ? 'DROPPING TOO FAST' : 'COOL RATE'}
      </Text>
      <Text style={[styles.dropValue, fast && { color: THEME.danger }]}>
        {dropRate.toFixed(1)}°/s · ideal 2°/s
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.45 : 1,
  }));

  function handlePressIn() {
    if (disabled) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }
  async function handlePress() {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          disabled={disabled}
        >
          <Text style={styles.actionBtnText}>{label}</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionStage() {
  const phaseTrack = useFlow((s) => s.phaseTrack);
  const phaseIdx = useFlow((s) => s.phaseIdx);
  const sessionSeconds = useFlow((s) => s.sessionSeconds);
  const heatTimeFactor = useFlow((s) => s.heatTimeFactor);
  const heatReason = useFlow((s) => s.heatReason);
  const coolDropRate = useFlow((s) => s.coolDropRate);
  const windowState = useFlow((s) => s.windowState);
  const windowSecondsLeft = useFlow((s) => s.windowSecondsLeft);
  const startedAt = useFlow((s) => s.startedAt);
  const liftToDab = useFlow((s) => s.liftToDab);
  const placeBack = useFlow((s) => s.placeBack);

  const banger = useBanger();
  const calibration = useCalibration();

  // Bounds-guard phaseIdx against a stale or resetting track
  const safeIdx = phaseIdx >= 0 && phaseIdx < phaseTrack.length ? phaseIdx : 0;
  const cur = phaseTrack[safeIdx] ?? 'heat';
  const isReheat = heatTimeFactor < 1;
  const isMissed = windowState === 'missed';

  // ── Haptics on phase transition ───────────────────────────────────────────
  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = cur;

    // Skip the first render (no transition yet)
    if (prev === null) return;
    if (prev === cur) return;

    const prevOrder = PHASE_ORDER.indexOf(prev);
    const curOrder = PHASE_ORDER.indexOf(cur);

    if (curOrder > prevOrder) {
      // Forward phase transition
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [cur]);

  // ── Haptic on missed window ───────────────────────────────────────────────
  const prevWindowRef = useRef<string>(windowState);
  useEffect(() => {
    const prev = prevWindowRef.current;
    prevWindowRef.current = windowState;
    if (prev !== 'missed' && windowState === 'missed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [windowState]);

  // ── Eyebrow ───────────────────────────────────────────────────────────────
  const reheatSuffix = isReheat && cur === 'heat' ? ' · REHEAT' : '';
  // Only show session clock when startedAt is available (null guard)
  const clockSuffix = startedAt != null ? ` · ${formatTime(sessionSeconds)}` : '';
  const eyebrowText = `${cur.toUpperCase()}${reheatSuffix}${clockSuffix}`;

  // ── Dab window countdown (count-down: time remaining in window) ───────────
  const dabWindowText =
    cur === 'dab' && !isMissed && windowSecondsLeft > 0
      ? `${windowSecondsLeft}s left`
      : null;

  // ── Headline ──────────────────────────────────────────────────────────────
  const headline = (() => {
    if (cur === 'load') return 'Load the banger cold.';
    if (cur === 'heat') {
      if (!isReheat) return 'Torch the banger.';
      if (heatReason === 'missed') return 'Window slipped. Reheat.';
      return 'Underheated. Top it off.';
    }
    if (cur === 'cool') return 'Place back on the DabRite.';
    if (cur === 'dab') {
      if (isMissed) return 'Missed the window.';
      return 'Dab now.';
    }
    if (cur === 'dunk') return 'Dunk the q-tip.';
    if (cur === 'clean') return 'Swab the residue.';
    return '';
  })();

  // ── Sub copy ──────────────────────────────────────────────────────────────
  const subCopy = (() => {
    if (cur === 'load') {
      const targetTemp = calibration?.displayed ?? '—';
      return `Drop the dab in cold, cap it, then torch up to ${targetTemp}°. Cold-start protects the terps.`;
    }
    if (cur === 'heat') {
      if (!isReheat)
        return `${banger?.name ?? 'Banger'} · target ${banger?.heat_time ?? '—'}. Torch off when timer ends.`;
      if (heatReason === 'missed')
        return 'Temp fell below the dab window before you lifted. Half-time torch this round.';
      return "IR saw a fast drop. Banger didn't soak the heat. Half-time torch to bring it back up.";
    }
    if (cur === 'cool') {
      const targetTemp = calibration?.displayed ?? '—';
      return `Cooling toward ${targetTemp}°. Lift the banger when the orb says LIFT TO DAB.`;
    }
    if (cur === 'dab') {
      if (isMissed) return 'Temp dropped before you lifted. Place back and let it reheat.';
      return 'Apply the concentrate. Tap done when the banger comes back to the DabRite.';
    }
    if (cur === 'dunk') return 'Cool enough to dunk and pull cap.';
    if (cur === 'clean') return 'Q-tip the inside before the puddle hardens.';
    return '';
  })();

  // ── Stagger entrance (fixed 5 shared values, always declared) ────────────
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0);
  // Separate shared value for dab window countdown
  const sv5 = useSharedValue(0);

  const hasCoolStrip = cur === 'cool';
  const showCoolStrip = cur === 'cool' && coolDropRate > 0;
  const hasAction = cur === 'cool' || cur === 'dab';

  useEffect(() => {
    sv0.value = 0;
    sv1.value = 0;
    sv2.value = 0;
    sv3.value = 0;
    sv4.value = 0;
    sv5.value = 0;

    enterSv(sv0, 0);
    enterSv(sv1, STAGGER_MS);
    enterSv(sv2, STAGGER_MS * 2);

    let next = 3;
    if (hasCoolStrip) {
      enterSv(sv3, STAGGER_MS * next);
      next += 1;
    }
    if (cur === 'dab') {
      enterSv(sv5, STAGGER_MS * next);
      next += 1;
    }
    if (hasAction) {
      enterSv(sv4, STAGGER_MS * next);
    }
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const s0 = useStaggerStyle(sv0);
  const s1 = useStaggerStyle(sv1);
  const s2 = useStaggerStyle(sv2);
  const s3 = useStaggerStyle(sv3);
  const s4 = useStaggerStyle(sv4);
  const s5 = useStaggerStyle(sv5);

  // Missed window desaturates the headline to bone instead of ember tones
  const headlineColor = isMissed ? THEME.bone[50] : THEME.bone[100];

  // Lift to dab is only actionable if we are in cool and not missed
  const liftDisabled = cur === 'cool' && isMissed;
  // Place back is always actionable when in dab
  const placeBackDisabled = false;

  return (
    <View style={styles.container}>
      {/* Phase label with session clock — announced as live region for a11y */}
      <Animated.View
        style={s0}
        accessibilityLiveRegion="polite"
        accessibilityLabel={eyebrowText}
      >
        <Text style={styles.eyebrow}>{eyebrowText}</Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={[styles.headlineWrap, s1]}>
        <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>
      </Animated.View>

      {/* Sub copy */}
      <Animated.View style={s2}>
        <Text style={styles.sub}>{subCopy}</Text>
      </Animated.View>

      {/* Missed window hint — quiet, no shouting */}
      {isMissed && cur === 'dab' && (
        <Animated.View style={[styles.missedHint, s2]}>
          <Text style={styles.missedHintText}>missed window</Text>
        </Animated.View>
      )}

      {/* Drop-rate strip, cool only, hidden until first reading arrives */}
      {showCoolStrip && (
        <Animated.View style={s3}>
          <DropRateStrip dropRate={coolDropRate} />
        </Animated.View>
      )}

      {/* Dab window countdown */}
      {dabWindowText !== null && (
        <Animated.View style={[styles.dabWindowWrap, s5]}>
          <Text style={styles.dabWindowText}>{dabWindowText}</Text>
        </Animated.View>
      )}

      {/* Action buttons */}
      {hasAction && (
        <Animated.View style={[styles.actionWrap, s4]}>
          {cur === 'cool' ? (
            <ActionButton
              label="Lift to dab"
              onPress={liftToDab}
              disabled={liftDisabled}
              accessibilityLabel="Lift banger to begin dab"
            />
          ) : (
            <ActionButton
              label="Place back on DabRite"
              onPress={placeBack}
              disabled={placeBackDisabled}
              accessibilityLabel="Place banger back on DabRite to continue"
            />
          )}
        </Animated.View>
      )}
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
  },
  eyebrow: {
    ...TYPE.eyebrow,
  },
  headlineWrap: {
    marginTop: 6,
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 26,
    letterSpacing: -0.91,
    lineHeight: 30,
  },
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12.5,
    color: THEME.bone[50],
    lineHeight: 12.5 * 1.5,
    marginTop: 10,
  },
  missedHint: {
    marginTop: 10,
  },
  missedHintText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: THEME.bone[35],
  },
  dropPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: SPACE.sm,
    paddingHorizontal: 10,
    borderRadius: SPACE.sm,
    borderWidth: 1,
    marginTop: 14,
  },
  dropPillNormal: {
    backgroundColor: 'rgba(20,16,12,0.50)',
    borderColor: 'rgba(56,52,48,1)',
  },
  dropPillFast: {
    backgroundColor: 'rgba(50,16,10,0.60)',
    borderColor: 'rgba(100,40,30,0.60)',
  },
  dropLabel: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  dropLabelNormal: {
    color: THEME.bone[50],
  },
  dropLabelFast: {
    color: THEME.danger,
  },
  dropValue: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10.5,
    color: THEME.bone[50],
  },
  dabWindowWrap: {
    marginTop: 10,
  },
  dabWindowText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.6,
    color: THEME.bone[50],
  },
  actionWrap: {
    marginTop: 20,
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
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.26,
    color: THEME.bone[100],
  },
});
