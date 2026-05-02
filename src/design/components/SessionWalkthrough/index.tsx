import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../tokens';
import { useBleStore } from '../../../state/bleStore';
import { useSettingsStore } from '../../../state/settingsStore';
import { useSessionStore } from '../../../state/sessionStore';
import { useDabPreferencesStore } from '../../../state/dabPreferencesStore';
import {
  findBanger,
  type BangerId,
} from '../../../data/bangers';
import {
  findConcentrate,
  type ConcentrateId,
} from '../../../data/concentrates';
import { findSensor } from '../../../data/sensors';
import { findWallThickness } from '../../../data/wallThicknesses';
import {
  coldStartAvailable,
  inverseInterior,
} from '../../../utils/calibration';

import { StepBody } from './StepBody';
import { StepDots } from './StepDots';
import { buildSteps } from './stepContent';
import { pidSetpointFor, totalHeatSeconds } from './utils';
import { FALLBACK_BANGER, FALLBACK_CONCENTRATE, FALLBACK_SENSOR, FALLBACK_WALL } from './constants';
import { styles } from './styles';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SessionWalkthroughProps {
  visible: boolean;
  onClose: () => void;
  /** Active banger for this session. Falls back to `flat-top` if omitted. */
  bangerId?: BangerId;
  /** Active concentrate for this session. Falls back to `live-resin`. */
  concentrateId?: ConcentrateId;
  /**
   * Force cold-start flow on/off. Defaults to the user's
   * `coldStartByDefault` preference, gated by `coldStartAvailable`.
   */
  coldStart?: boolean;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function SessionWalkthrough({
  visible,
  onClose,
  bangerId,
  concentrateId,
  coldStart,
}: SessionWalkthroughProps) {
  const insets = useSafeAreaInsets();

  const liveTempF = useBleStore((s) => s.liveTempF) ?? 72;
  const settings = useSettingsStore((s) => s.settings);
  const peakF = useSessionStore((s) => s.peakF);
  const dunkAlertFired = useSessionStore((s) => s.dunkAlertFired);

  // Pull active banger/concentrate/sensor/wall context (Phase 2D fallbacks).
  const preferredSensor = useDabPreferencesStore((s) => s.preferredSensor);
  const preferredWall = useDabPreferencesStore((s) => s.preferredWall);
  const coldStartByDefault = useDabPreferencesStore((s) => s.coldStartByDefault);

  const sensor = findSensor(preferredSensor) ?? FALLBACK_SENSOR;
  const wall = findWallThickness(preferredWall) ?? FALLBACK_WALL;
  const banger =
    (bangerId != null ? findBanger(bangerId) : undefined) ?? FALLBACK_BANGER;
  const concentrate =
    (concentrateId != null ? findConcentrate(concentrateId) : undefined) ??
    FALLBACK_CONCENTRATE;

  const walkthroughStartedAt = useRef<number>(Date.now());
  const hasHeatedRef = useRef(false);
  const [capturedPeakF, setCapturedPeakF] = useState(0);

  const [stepIndex, setStepIndex] = useState(0);

  // Heat duration sourced from banger metadata (slurper sums breakdown stages).
  const torchDuration = totalHeatSeconds(banger);

  // Resolve cold-start flow eligibility.
  const coldStartCompatible = coldStartAvailable(concentrate, banger);
  const coldStartEnabled =
    coldStartCompatible && (coldStart ?? coldStartByDefault);

  // Compute targets for sensor-aware cool-step copy.
  // displayedTargetF reflects the user's instrument; interiorTargetF is the
  // surface truth (probe target); pidSetpointF is the e-nail coil setpoint.
  const displayedTargetF = settings.dabAlarmF;
  const interiorTargetF =
    concentrate.surface_temp_optimal_f ??
    Math.round(inverseInterior({ displayedF: displayedTargetF, banger, sensor, wall }));
  const pidSetpointF = pidSetpointFor(banger, interiorTargetF);

  const steps = useMemo(
    () =>
      buildSteps({
        banger,
        concentrate,
        sensor,
        displayedTargetF,
        interiorTargetF,
        pidSetpointF,
        useCelsius: settings.useCelsius,
        coldStart: coldStartEnabled,
      }),
    [
      banger,
      concentrate,
      sensor,
      displayedTargetF,
      interiorTargetF,
      pidSetpointF,
      settings.useCelsius,
      coldStartEnabled,
    ],
  );

  // Number of progress dots — every step except `complete`.
  const totalDots = steps.length - 1;

  // Step transition animations
  const stepOpacity = useSharedValue(1);
  const stepTranslateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      walkthroughStartedAt.current = Date.now();
      hasHeatedRef.current = false;
      setCapturedPeakF(0);
    }
  }, [visible]);

  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeStepIndex] ?? steps[0];

  const transitionToStep = useCallback((nextIndex: number) => {
    stepOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(setStepIndex)(nextIndex);
      stepTranslateY.value = 20;
      stepOpacity.value = withTiming(1, { duration: 220 });
      stepTranslateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const advance = useCallback(() => {
    const next = safeStepIndex + 1;
    if (next < steps.length) {
      if (steps[next]?.id === 'complete') {
        setCapturedPeakF(peakF);
      }
      transitionToStep(next);
    }
  }, [safeStepIndex, steps, transitionToStep, peakF]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleFinish = useCallback(() => {
    // Note: do NOT call endSession() here. BleManager owns session lifecycle
    // (auto-ends when temp = 0 for 30 s) and is the only path that persists
    // peak temp + samples to the DB via sessionsDb.end(). Calling
    // endSession() in the UI would clear peakF/samples before the BLE
    // teardown writes them, leaving the persisted row blank.
    onClose();
  }, [onClose]);

  // Auto-advance: cool step — detect falling edge through dabAlarmF (temp must first rise above alarm + 25)
  useEffect(() => {
    if (!visible || step.id !== 'cool') return;
    if (liveTempF > settings.dabAlarmF + 25) {
      hasHeatedRef.current = true;
    }
    if (hasHeatedRef.current && liveTempF <= settings.dabAlarmF + 5) {
      advance();
    }
  }, [liveTempF, step.id, visible, settings.dabAlarmF, advance]);

  // Auto-advance: dab step triggers when dunk alarm fires
  useEffect(() => {
    if (!visible || step.id !== 'dab') return;
    if (dunkAlertFired) {
      advance();
    }
  }, [dunkAlertFired, step.id, visible, advance]);

  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateY: stepTranslateY.value }],
  }));

  const handleCta = useCallback(() => {
    if (step.id === 'complete') {
      handleFinish();
    } else {
      advance();
    }
  }, [step.id, advance, handleFinish]);

  const isFinalStep = step.id === 'complete';

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.supraLabel}>{step.supra}</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Svg width={18} height={18} viewBox="0 0 18 18">
            <Path d="M3 3 L15 15 M15 3 L3 15" stroke={colors.bone50} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Step dots */}
      <StepDots current={safeStepIndex} total={totalDots} />

      {/* Animated step */}
      <Animated.View style={[styles.stepArea, stepStyle]}>
        {/* Title */}
        <Text style={styles.stepTitle}>{step.title}</Text>
        {step.body.length > 0 && (
          <Text style={styles.stepBody}>{step.body}</Text>
        )}

        {/* Icon / Timer / Live temp area */}
        <StepBody
          step={step}
          stepIndex={safeStepIndex}
          torchDuration={torchDuration}
          onTorchComplete={advance}
          onCta={handleCta}
          dabAlarmF={settings.dabAlarmF}
          dunkAlarmF={settings.dunkAlarmF}
          useCelsius={settings.useCelsius}
          peakF={capturedPeakF}
          walkthroughStartedAt={walkthroughStartedAt.current}
          banger={banger}
          concentrate={concentrate}
          sensor={sensor}
        />
      </Animated.View>

      {/* CTA footer */}
      {step.ctaLabel && (
        <View style={styles.ctaRow}>
          <TouchableOpacity
            onPress={handleCta}
            activeOpacity={0.8}
            style={[styles.ctaBtn, isFinalStep && styles.ctaBtnFinal]}
          >
            <LinearGradient
              colors={isFinalStep ? [colors.success, '#5aaa7a'] : [colors.emberBright, colors.ember]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtnGradient}
            >
              <Text style={styles.ctaBtnText}>{step.ctaLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Auto-advance indicator */}
      {step.autoAdvance && !step.ctaLabel && (step.id === 'heat' || step.id === 'cold-heat') && (
        <View style={[styles.autoAdvanceHint, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.autoAdvanceText}>The timer carries you forward</Text>
        </View>
      )}
      {step.id === 'cool' && (
        <View style={styles.autoAdvanceHint}>
          <Text style={styles.autoAdvanceText}>Hold — the dial settles on its own</Text>
        </View>
      )}
    </View>
  );
}

export default SessionWalkthrough;
