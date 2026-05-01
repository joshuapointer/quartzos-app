import * as Haptics from 'expo-haptics';
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
  SPACE,
  THEME,
} from '../theme';
import {
  useCalibration,
  useBanger,
  useFlow,
} from '../store';
import { useBleStore } from '../../state/bleStore';

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

// Downward chevron — self-describing for a falling-temp readout. Replaces an
// earlier 4-bar snowflake that read as a cross at 12px.
function DropGlyph({ size = 11, color = THEME.danger }: { size?: number; color?: string }) {
  return (
    <Text
      style={{
        fontFamily: 'GeistMono_500Medium',
        fontSize: size,
        lineHeight: size + 1,
        color,
        includeFontPadding: false,
      }}
    >
      ↓
    </Text>
  );
}

function DropRateStrip({ dropRate }: { dropRate: number }) {
  // Chip only renders for fast-drop now (see showCoolStrip gate above), so
  // styling collapses to the danger variant.
  return (
    <View style={styles.dropChipWrap}>
      <View style={[styles.dropPill, styles.dropPillFast]}>
        <DropGlyph size={11} color={THEME.danger} />
        <Text style={[styles.dropLabel, { color: THEME.danger }]}>
          DROPPING FAST · {dropRate.toFixed(1)}°/s
        </Text>
      </View>
    </View>
  );
}

// Bottom action pill — emissive amber, phase-dynamic
function BottomActionPill({
  cur,
  heatActive,
  startHeating,
}: {
  cur: string;
  heatActive: boolean;
  startHeating: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Derive label + glyph + tappable per phase
  const config: { label: string; glyph: string | null; tappable: boolean } = (() => {
    if (cur === 'load') return { label: 'COLD LOAD', glyph: null, tappable: false };
    if (cur === 'heat') {
      if (heatActive) return { label: 'TORCHING', glyph: null, tappable: false };
      return { label: 'START HEATING', glyph: '→', tappable: true };
    }
    if (cur === 'cool') return { label: 'LIFT TO DAB', glyph: '↑', tappable: false };
    if (cur === 'dab') return { label: 'PLACE BACK', glyph: '↻', tappable: false };
    if (cur === 'dunk') return { label: 'DUNK Q-TIP', glyph: '↓', tappable: false };
    if (cur === 'clean') return { label: 'SWAB CLEAN', glyph: '→', tappable: false };
    return { label: '', glyph: null, tappable: false };
  })();

  function handlePressIn() {
    // Acknowledge the touch even when not tappable — a small dip + soft selection
    // haptic tells the user "I heard you, the temperature isn't there yet".
    scale.value = withSpring(config.tappable ? 0.97 : 0.99, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }
  async function handlePress() {
    if (!config.tappable) {
      void Haptics.selectionAsync();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startHeating();
  }

  return (
    <View style={styles.bottomPillAnchor} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.bottomPillShadow,
          !config.tappable && styles.bottomPillShadowReadout,
          animStyle,
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={[styles.bottomPill, !config.tappable && styles.bottomPillReadout]}
          accessibilityRole={config.tappable ? 'button' : 'text'}
          accessibilityLabel={config.label}
          accessibilityHint={config.tappable ? undefined : 'Auto-advances on temperature'}
        >
          {/* Top-edge highlight bar — only on the active CTA, not on readouts */}
          {config.tappable && <View style={styles.bottomPillHighlight} />}
          <View style={styles.bottomPillInner}>
            <Text
              style={[
                styles.bottomPillLabel,
                !config.tappable && styles.bottomPillLabelReadout,
              ]}
            >
              {config.label}
            </Text>
            {config.glyph !== null && (
              <Text
                style={[
                  styles.bottomPillGlyph,
                  !config.tappable && styles.bottomPillGlyphReadout,
                ]}
              >
                {config.glyph}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionStage() {
  const phaseTrack = useFlow((s) => s.phaseTrack);
  const phaseIdx = useFlow((s) => s.phaseIdx);
  const sessionSeconds = useFlow((s) => s.sessionSeconds);
  const heatTimeFactor = useFlow((s) => s.heatTimeFactor);
  const heatReason = useFlow((s) => s.heatReason);
  const heatActive = useFlow((s) => s.heatActive);
  const coolDropRate = useFlow((s) => s.coolDropRate);
  const windowState = useFlow((s) => s.windowState);
  const windowSecondsLeft = useFlow((s) => s.windowSecondsLeft);
  const startedAt = useFlow((s) => s.startedAt);
  const startHeating = useFlow((s) => s.startHeating);

  const banger = useBanger();
  const calibration = useCalibration();
  const liveTempF = useBleStore((s) => s.liveTempF);

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

  // ── Haptic on dab-window arrival ──────────────────────────────────────────
  // The peak of the entire product. cool-in-window is an orb-state derived
  // from temp + calibration; the phase-transition haptic doesn't fire here,
  // so without this the moment lands silent.
  const wasInWindowRef = useRef(false);
  useEffect(() => {
    const inWindow =
      cur === 'cool' &&
      calibration != null &&
      liveTempF >= calibration.low &&
      liveTempF <= calibration.high;
    const was = wasInWindowRef.current;
    wasInWindowRef.current = inWindow;
    if (!was && inWindow) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [cur, liveTempF, calibration]);

  // ── Eyebrow / phase-label header ─────────────────────────────────────────
  const reheatSuffix = isReheat && cur === 'heat' ? ' · REHEAT' : '';
  // Only show session clock when startedAt is available (null guard)
  const clockSuffix = startedAt != null ? ` · ${formatTime(sessionSeconds)}` : '';
  const eyebrowText = `${cur.toUpperCase()}${reheatSuffix}${clockSuffix}`;

  // ── Dab window countdown (count-down: time remaining in window) ───────────
  // Show a closing-now state at zero so the user isn't left without feedback
  // for the brief gap before windowState transitions to 'missed'.
  const dabWindowText =
    cur === 'dab' && !isMissed
      ? windowSecondsLeft > 0
        ? `${windowSecondsLeft}s left`
        : 'closing now'
      : null;

  // ── Headline ──────────────────────────────────────────────────────────────
  const headline = (() => {
    if (cur === 'load') return 'Load the banger cold.';
    if (cur === 'heat') {
      // Active imperative even before torch detect — keeps headline + bottom
      // pill on the same emotional beat ("Strike the torch." / START HEATING).
      if (!heatActive) return 'Strike the torch.';
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
      // Cold-start was explained on ReviewStep — at execution time the user
      // has the rig in hand and shouldn't be re-reading the rationale.
      return 'Load concentrate cold, then cap.';
    }
    if (cur === 'heat') {
      if (!heatActive)
        return 'Light your torch, we will listen for it. Or tap below to start manually.';
      if (!isReheat)
        return `${banger?.name ?? 'Banger'} · target ${banger?.heat_time ?? '—'}. Torch off when timer ends.`;
      if (heatReason === 'missed')
        return 'Temp fell below the dab window before you lifted. Half-time torch this round.';
      return "IR saw a fast drop. Banger didn't soak the heat. Half-time torch to bring it back up.";
    }
    if (cur === 'cool') {
      // No sub copy at the highest-tension moment. The orb shows the live
      // temp; ReviewStep already showed the target. Two numbers competing
      // here forces the user to compute a delta during the dab window.
      return '';
    }
    if (cur === 'dab') {
      if (isMissed) return 'Temp dropped before you lifted. Place back and let it reheat.';
      // Auto-advances when the banger returns to the sensor — no Done button.
      return 'Apply the concentrate. Place back when finished.';
    }
    if (cur === 'dunk') return 'Cool enough to dunk and pull cap.';
    if (cur === 'clean') return 'Q-tip the inside before the puddle hardens.';
    return '';
  })();

  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv5 = useSharedValue(0);

  // Only surface the drop-rate chip when it's actionable (fast drop) — during
  // normal cool the orb's live temp is enough; the chip just adds noise to the
  // highest-tension moment.
  const showCoolStrip = cur === 'cool' && coolDropRate > 3;
  const hasCoolStrip = showCoolStrip;

  useEffect(() => {
    sv0.value = 0;
    sv1.value = 0;
    sv2.value = 0;
    sv3.value = 0;
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
    }
  }, [cur, heatActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const s0 = useStaggerStyle(sv0);
  const s1 = useStaggerStyle(sv1);
  const s2 = useStaggerStyle(sv2);
  const s3 = useStaggerStyle(sv3);
  const s5 = useStaggerStyle(sv5);

  // Missed window desaturates the headline to bone instead of ember tones
  const headlineColor = isMissed ? THEME.bone[50] : THEME.bone[100];

  return (
    <View style={styles.container}>
      {/* Phase-label header — centered mono eyebrow */}
      <Animated.View
        style={[styles.eyebrowRow, s0]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={eyebrowText}
      >
        <Text style={styles.eyebrow}>{eyebrowText}</Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={[styles.headlineWrap, s1]}>
        <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>
      </Animated.View>

      {/* Sub copy — suppressed for phases (cool) that should be silent */}
      {subCopy.length > 0 && (
        <Animated.View style={s2}>
          <Text style={styles.sub}>{subCopy}</Text>
        </Animated.View>
      )}

      {/* Missed window hint — quiet, no shouting */}
      {isMissed && cur === 'dab' && (
        <Animated.View style={[styles.missedHint, s2]}>
          <Text style={styles.missedHintText}>missed window</Text>
        </Animated.View>
      )}

      {/* Drop-rate glass chip, cool only, hidden until first reading arrives */}
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

      {/* Fixed bottom action pill — shown every phase */}
      <BottomActionPill
        cur={cur}
        heatActive={heatActive}
        startHeating={startHeating}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACE.xs,
    paddingHorizontal: 22,
    paddingBottom: 120,
    flexDirection: 'column',
  },

  // ── Phase label header ──────────────────────────────────────────────────
  eyebrowRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(246, 222, 210, 0.50)',
    textAlign: 'center',
  },

  // ── Headline ────────────────────────────────────────────────────────────
  headlineWrap: {
    marginTop: 6,
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 28,
    letterSpacing: -1.12,
    lineHeight: 32,
    maxWidth: 280,
    textAlign: 'center',
  },

  // ── Sub copy ─────────────────────────────────────────────────────────────
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[50],
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 300,
    textAlign: 'center',
    alignSelf: 'center',
  },

  // ── Missed hint ──────────────────────────────────────────────────────────
  missedHint: {
    marginTop: 10,
    alignItems: 'center',
  },
  missedHintText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: THEME.bone[35],
  },

  // ── Drop-rate glass chip ─────────────────────────────────────────────────
  dropChipWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  dropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    gap: 8,
    borderWidth: 0.5,
  },
  dropPillNormal: {
    backgroundColor: 'rgba(246, 222, 210, 0.04)',
    borderColor: 'rgba(246, 222, 210, 0.18)',
  },
  dropPillFast: {
    backgroundColor: 'rgba(50, 16, 10, 0.60)',
    borderColor: 'rgba(100, 40, 30, 0.60)',
  },
  dropLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Dab window countdown ─────────────────────────────────────────────────
  dabWindowWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  dabWindowText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.6,
    color: THEME.bone[50],
    textAlign: 'center',
  },

  // ── Bottom emissive amber action pill ────────────────────────────────────
  bottomPillAnchor: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomPillShadow: {
    borderRadius: 9999,
    shadowColor: THEME.ember.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 12,
  },
  // Readout variant — shown while the pill is a status, not an action.
  // Tames the glow so the orb stays the loud element, but keeps the ember tint
  // so the bottom rail still belongs to the same family.
  bottomPillShadowReadout: {
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  bottomPill: {
    borderRadius: 9999,
    backgroundColor: THEME.ember.base,
    overflow: 'hidden',
  },
  bottomPillReadout: {
    backgroundColor: 'rgba(255, 122, 0, 0.22)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 122, 0, 0.45)',
  },
  bottomPillHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    zIndex: 1,
  },
  bottomPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    gap: 8,
  },
  bottomPillLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#1c110a',
  },
  bottomPillLabelReadout: {
    color: THEME.ember.bright,
  },
  bottomPillGlyph: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    color: '#1c110a',
  },
  bottomPillGlyphReadout: {
    color: THEME.ember.bright,
  },
});
