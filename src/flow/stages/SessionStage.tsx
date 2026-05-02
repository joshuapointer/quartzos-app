import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  SCREEN,
  SPACE,
  THEME,
} from '../theme';
import {
  useCalibration,
  useBanger,
  useFlow,
} from '../store';
import { useBleStore } from '../../state/bleStore';
import { useStaggerEntrance } from '../components/useStaggerEntrance';
import { useReducedMotion } from '../components/useReducedMotion';

// ─── Constants ────────────────────────────────────────────────────────────────

// Phase transition order for haptic firing
const PHASE_ORDER: string[] = ['load', 'heat', 'cool', 'dab', 'dunk', 'clean'];

// Above this rate (°/s) the orb is dropping faster than the user can absorb;
// surface a danger chip so the user can re-torch before the window closes.
const FAST_DROP_THRESHOLD_DEG_PER_SEC = 3;

// ─── Sub-components ───────────────────────────────────────────────────────────

// Downward chevron — self-describing for a falling-temp readout. Replaces an
// earlier 4-bar snowflake that read as a cross at 12px.
function DropGlyph({ size = 11, color = THEME.danger.base }: { size?: number; color?: string }) {
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
        <DropGlyph size={11} color={THEME.danger.base} />
        <Text style={[styles.dropLabel, { color: THEME.danger.base }]}>
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
  const reduced = useReducedMotion();
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
    if (reduced) return;
    // Acknowledge the touch even when not tappable — a small dip + soft selection
    // haptic tells the user "I heard you, the temperature isn't there yet".
    scale.value = withSpring(config.tappable ? 0.97 : 0.99, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    if (reduced) return;
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
          accessibilityRole="button"
          accessibilityState={{ disabled: !config.tappable }}
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
  const heatTimeFactor = useFlow((s) => s.heatTimeFactor);
  const heatReason = useFlow((s) => s.heatReason);
  const heatActive = useFlow((s) => s.heatActive);
  const coolDropRate = useFlow((s) => s.coolDropRate);
  const windowState = useFlow((s) => s.windowState);
  const windowSecondsLeft = useFlow((s) => s.windowSecondsLeft);
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
  // Bold #6: clock has moved out of the eyebrow into the orb's session arc.
  // Eyebrow now only carries phase + reheat suffix.
  const reheatSuffix = isReheat && cur === 'heat' ? ' · REHEAT' : '';
  const eyebrowText = `${cur.toUpperCase()}${reheatSuffix}`;

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
      return 'Underheated. Reheat briefly.';
    }
    if (cur === 'cool') return 'Place back on the Dab Rite.';
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
        return 'Light your torch — we detect the heat. Or tap to start.';
      if (!isReheat)
        return `${banger?.name} · ${banger?.heat_time} target. Off on ring.`;
      if (heatReason === 'missed')
        return 'Temperature dropped below window. Half-time torch.';
      return "Fast drop detected — heat didn't soak. Short reheat.";
    }
    if (cur === 'cool') {
      // No sub copy at the highest-tension moment. The orb shows the live
      // temp; ReviewStep already showed the target. Two numbers competing
      // here forces the user to compute a delta during the dab window.
      return '';
    }
    if (cur === 'dab') {
      if (isMissed) return 'Apply. Place back to finish.';
      // Auto-advances when the banger returns to the sensor — no Done button.
      return 'Apply the concentrate. Place back when finished.';
    }
    if (cur === 'dunk') return 'Temperature ready for swab and cap.';
    if (cur === 'clean') return 'Swab the interior before residue sets.';
    return '';
  })();

  // Only surface the drop-rate chip when it's actionable (fast drop) — during
  // normal cool the orb's live temp is enough; the chip just adds noise to the
  // highest-tension moment.
  const showCoolStrip = cur === 'cool' && coolDropRate > FAST_DROP_THRESHOLD_DEG_PER_SEC;

  // Stagger entrance for stage children — canonical 60ms gap, 600ms ease.
  const sStyle0 = useStaggerEntrance(0);
  const sStyle1 = useStaggerEntrance(1);
  const sStyle2 = useStaggerEntrance(2);
  const sStyle3 = useStaggerEntrance(3);
  const sStyle4 = useStaggerEntrance(4);

  // Missed window desaturates the headline to bone instead of ember tones
  const headlineColor = isMissed ? THEME.bone[50] : THEME.bone[100];

  return (
    <View style={styles.container}>
      {/* Phase-label header — centered mono eyebrow */}
      <Animated.View
        style={[styles.eyebrowRow, sStyle0]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={eyebrowText}
      >
        <Text style={styles.eyebrow} numberOfLines={1}>
          {eyebrowText}
        </Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={[styles.headlineWrap, sStyle1]}>
        <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>
      </Animated.View>

      {/* Sub copy — suppressed for phases (cool) that should be silent */}
      {subCopy.length > 0 && (
        <Animated.View style={sStyle2}>
          <Text style={styles.sub}>{subCopy}</Text>
        </Animated.View>
      )}

      {/* Drop-rate glass chip, cool only, hidden until first reading arrives */}
      {showCoolStrip && (
        <Animated.View style={sStyle3}>
          <DropRateStrip dropRate={coolDropRate} />
        </Animated.View>
      )}

      {/* Dab window countdown */}
      {dabWindowText !== null && (
        <Animated.View style={[styles.dabWindowWrap, sStyle4]}>
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
    paddingHorizontal: SCREEN.HPAD,
    paddingBottom: SPACE.xxl,
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
    textAlign: 'center',
  },

  // ── Sub copy ─────────────────────────────────────────────────────────────
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[50],
    lineHeight: 19,
    marginTop: SPACE.sm,
    maxWidth: 300,
    textAlign: 'center',
    alignSelf: 'center',
  },

  // ── Drop-rate glass chip ─────────────────────────────────────────────────
  dropChipWrap: {
    alignItems: 'center',
    marginTop: SPACE.lg,
  },
  dropPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACE.lg,
    borderRadius: SCREEN.PILL_RADIUS,
    gap: 8,
    borderWidth: 0.5,
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
  // Sits as the last flex child in the column; `marginTop: 'auto'` pushes it
  // against the container's bottom padding so the content above can grow.
  bottomPillAnchor: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  bottomPillShadow: {
    borderRadius: SCREEN.PILL_RADIUS,
    shadowColor: THEME.ember.base,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 12,
  },
  // Readout variant — shown while the pill is a status, not an action.
  // The ember halo belongs only to the tappable CTA; readouts kill the glow
  // entirely (transparent shadow) so the orb stays the loud element above.
  bottomPillShadowReadout: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  bottomPill: {
    borderRadius: SCREEN.PILL_RADIUS,
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
    color: THEME.navy[1],
  },
  bottomPillLabelReadout: {
    color: THEME.ember.bright,
  },
  bottomPillGlyph: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    color: THEME.navy[1],
  },
  bottomPillGlyphReadout: {
    color: THEME.ember.bright,
  },
});
