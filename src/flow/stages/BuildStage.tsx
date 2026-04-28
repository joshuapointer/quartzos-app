
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useConcentrate, useFlow } from '../store';
import { THEME, TYPE } from '../theme';

import BangerChooser from './BangerChooser';
import ConcChooser from './ConcChooser';
import ReviewStep from './ReviewStep';
import WallChooser from './WallChooser';

const STEP_LABELS = ['BANGER', 'CONCENTRATE', 'WALL', 'REVIEW'] as const;
const STEP_TITLES = [
  'Pick your vessel.',
  'What are you dabbing?',
  'Wall thickness?',
  'Calibration locked.',
] as const;

// ─── Progress pill ────────────────────────────────────────────────────────────

type ProgressPillProps = {
  index: number;
  step: number;
};

function ProgressPill({ index, step }: ProgressPillProps) {
  const progress = useSharedValue(index <= step ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(index <= step ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [index, step, progress]);

  const animStyle = useAnimatedStyle(() => {
    const isCurrent = index === step;
    const isPast = index < step;
    const isFuture = index > step;
    const bg = isPast
      ? THEME.ember.base
      : isCurrent
        ? THEME.ember.base
        : 'rgba(180, 200, 230, 0.10)';
    const shadowOpacity = isCurrent ? 0.6 * progress.value : 0;
    return {
      backgroundColor: bg,
      shadowOpacity,
      opacity: isFuture ? 0.4 + 0.6 * (1 - progress.value) : 1,
    };
  });

  return (
    <Animated.View
      style={[
        styles.progressPill,
        animStyle,
        index === step && styles.progressPillCurrent,
      ]}
    />
  );
}

// ─── Body switcher ────────────────────────────────────────────────────────────

function StageBody({ step }: { step: number }) {
  let child: React.ReactNode = null;
  if (step === 0) child = <BangerChooser />;
  else if (step === 1) child = <ConcChooser />;
  else if (step === 2) child = <WallChooser />;
  else if (step === 3) child = <ReviewStep />;

  return (
    <Animated.View
      key={step}
      entering={FadeIn.duration(480).easing(Easing.bezier(0.22, 1, 0.36, 1))}
      style={styles.bodyWrap}
    >
      {child}
    </Animated.View>
  );
}

// ─── BuildStage ───────────────────────────────────────────────────────────────

export default function BuildStage() {
  const step = useFlow((s) => s.builderStep);
  const bangerId = useFlow((s) => s.bangerId);
  const concId = useFlow((s) => s.concId);
  const wallId = useFlow((s) => s.wallId);
  const builderNext = useFlow((s) => s.builderNext);
  const builderBack = useFlow((s) => s.builderBack);
  const concentrate = useConcentrate();

  const ready = (() => {
    if (step === 0) return !!bangerId;
    if (step === 1) return !!concId && !concentrate?.blocked;
    if (step === 2) return !!wallId;
    return true;
  })();

  const continueScale = useSharedValue(1);
  const continueAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
    flex: 1,
  }));

  function handleBack() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    builderBack();
  }
  function handleNext() {
    if (!ready) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    builderNext();
  }
  function handleContinuePressIn() {
    if (!ready) return;
    continueScale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }
  function handleContinuePressOut() {
    continueScale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }

  const continueLabel = step < 3 ? 'Continue →' : 'Start sesh →';

  return (
    <View style={styles.container}>
      {/* Progress strip */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <ProgressPill key={i} index={i} step={step} />
        ))}
      </View>

      {/* Eyebrow + title */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>
          STEP {step + 1}/4 · {STEP_LABELS[step]}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      </View>

      {/* Body */}
      <StageBody step={step} />

      {/* Footer button row */}
      {!ready && step < 3 && (
        <Text style={styles.notReadyHint}>Make a selection to continue</Text>
      )}
      <View style={styles.footerRow}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Animated.View style={continueAnimStyle}>
          <Pressable
            onPress={handleNext}
            onPressIn={handleContinuePressIn}
            onPressOut={handleContinuePressOut}
            disabled={!ready}
            style={[styles.continuePressable, { flex: undefined, width: '100%' }]}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            accessibilityState={{ disabled: !ready }}
          >
            {ready ? (
              <LinearGradient
                colors={[THEME.ember.base, THEME.ember.deep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.continueBg]}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.continueBg,
                  styles.continueBgDisabled,
                ]}
              />
            )}
            <Text style={[styles.continueText, !ready && styles.continueTextDisabled]}>
              {continueLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  progressPill: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(180, 200, 230, 0.10)',
    shadowColor: THEME.ember.base,
    shadowRadius: 10,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  progressPillCurrent: {
    elevation: 3,
  },
  headerBlock: {
    marginBottom: 12,
  },
  eyebrow: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.32 * 9,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    marginBottom: 6,
  } as const,
  title: {
    fontFamily: 'Geist_300Light',
    fontSize: 26,
    color: THEME.bone[100],
    letterSpacing: -0.7,
    lineHeight: 26 * 1.05,
  },
  bodyWrap: {
    flex: 1,
    minHeight: 0,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 240, 220, 0.10)',
  },
  backText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: THEME.bone[70],
    letterSpacing: 0.04 * 12,
  },
  continuePressable: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  continueBg: {
    borderRadius: 100,
  },
  continueBgDisabled: {
    backgroundColor: 'rgba(180, 200, 230, 0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
  },
  continueText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12.5,
    color: THEME.bone[100],
    letterSpacing: 0.02 * 12.5,
  },
  notReadyHint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 10.5,
    color: THEME.bone[35],
    textAlign: 'center',
    marginBottom: 6,
  },
  continueTextDisabled: {
    color: THEME.bone[35],
  },
});
