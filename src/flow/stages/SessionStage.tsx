/**
 * src/flow/stages/SessionStage.tsx
 *
 * Phase 7 — Session stage: eyebrow + headline + sub copy + drop-rate strip
 * (cool only) + action button (cool/dab). Stagger entrance on phase change.
 *
 * PRD §5.4–§5.9 / prototype flow-shell.jsx SessionStage (line 555).
 * The persistent orb is rendered by the parent shell, not here.
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withTiming(0.96, { duration: 80 });
  }
  function handlePressOut() {
    scale.value = withTiming(1, { duration: 120 });
  }
  async function handlePress() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.actionBtnText}>{label}</Text>
      </Pressable>
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
  const liftToDab = useFlow((s) => s.liftToDab);
  const placeBack = useFlow((s) => s.placeBack);

  const banger = useBanger();
  const calibration = useCalibration();

  const cur = phaseTrack[phaseIdx] ?? 'heat';
  const isReheat = heatTimeFactor < 1;

  // ── Eyebrow ──────────────────────────────────────────────────────────────
  const m = Math.floor(sessionSeconds / 60);
  const ss = String(sessionSeconds % 60).padStart(2, '0');
  const reheatSuffix = isReheat && cur === 'heat' ? ' · REHEAT' : '';
  const eyebrowText = `${cur.toUpperCase()}${reheatSuffix} · ${m}:${ss}`;

  // ── Headline ─────────────────────────────────────────────────────────────
  const headline = (() => {
    if (cur === 'load') return 'Load the banger cold.';
    if (cur === 'heat') {
      if (!isReheat) return 'Torch the banger.';
      if (heatReason === 'missed') return 'Window slipped. Reheat.';
      return 'Underheated. Top it off.';
    }
    if (cur === 'cool') return 'Place back on the DabRite.';
    if (cur === 'dab') return 'Dab now.';
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
      return "IR saw a fast drop — banger didn't soak the heat. Half-time torch to bring it back up.";
    }
    if (cur === 'cool') {
      const targetTemp = calibration?.displayed ?? '—';
      return `Cooling toward ${targetTemp}°. Lift the banger when the orb says LIFT TO DAB.`;
    }
    if (cur === 'dab')
      return 'Apply the concentrate. Tap done when the banger comes back to the DabRite.';
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

  const hasCoolStrip = cur === 'cool';
  const hasAction = cur === 'cool' || cur === 'dab';

  useEffect(() => {
    sv0.value = 0;
    sv1.value = 0;
    sv2.value = 0;
    sv3.value = 0;
    sv4.value = 0;

    // eyebrow, headline, sub always enter
    enterSv(sv0, 0);
    enterSv(sv1, STAGGER_MS);
    enterSv(sv2, STAGGER_MS * 2);

    let next = 3;
    if (hasCoolStrip) {
      enterSv(sv3, STAGGER_MS * next);
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

  return (
    <View style={styles.container}>
      {/* Eyebrow */}
      <Animated.View style={s0}>
        <Text style={styles.eyebrow}>{eyebrowText}</Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={[styles.headlineWrap, s1]}>
        <Text style={styles.headline}>{headline}</Text>
      </Animated.View>

      {/* Sub copy */}
      <Animated.View style={s2}>
        <Text style={styles.sub}>{subCopy}</Text>
      </Animated.View>

      {/* Drop-rate strip — cool only */}
      {hasCoolStrip && (
        <Animated.View style={s3}>
          <DropRateStrip dropRate={coolDropRate} />
        </Animated.View>
      )}

      {/* Action button — cool or dab */}
      {hasAction && (
        <Animated.View style={[styles.actionWrap, s4]}>
          {cur === 'cool' ? (
            <ActionButton label="Lift to dab →" onPress={liftToDab} />
          ) : (
            <ActionButton
              label="Place back on DabRite →"
              onPress={placeBack}
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
    paddingTop: SPACE.xs,      // 4
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
    color: THEME.bone[100],
    lineHeight: 30,
  },
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12.5,
    color: THEME.bone[50],
    lineHeight: 12.5 * 1.5,
    marginTop: 10,
  },
  dropPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: SPACE.sm,    // 8
    paddingHorizontal: 10,
    borderRadius: SPACE.sm,       // 8
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
    letterSpacing: 0.9, // 0.10em at 9pt
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
  actionWrap: {
    marginTop: 20,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: RADIUS.pill,
    backgroundColor: THEME.ember.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.ember.base,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 8,
  },
  actionBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.26,
    color: '#fff5e8',
  },
});
