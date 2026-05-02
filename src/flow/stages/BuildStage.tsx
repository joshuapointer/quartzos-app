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
    const isReached = index <= step;
    return {
      backgroundColor: isReached ? THEME.ember.base : 'rgba(246, 222, 210, 0.10)',
      shadowOpacity: isCurrent ? 0.8 * progress.value : 0,
    };
  });

  const isFuture = index > step;

  return (
    <Animated.View
      style={[
        styles.progressPill,
        isFuture && styles.progressPillFuture,
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

  const continueLabel = step < 3 ? 'CONTINUE' : 'START SESH';

  return (
    <View style={styles.container}>
      {/* Progress strip — 4 short pills, centered */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <ProgressPill key={i} index={i} step={step} />
        ))}
      </View>

      {/* Eyebrow + title — centered */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>
          STEP {step + 1}/4 · {STEP_LABELS[step]}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      </View>

      <StageBody step={step} />

      {!ready && step < 3 && (
        <Text style={styles.notReadyHint}>Make a selection to continue</Text>
      )}

      {/* Three equal-flex cells keep the continue pill optically centered
          regardless of whether Back is present. */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomCellLeft}>
          {step > 0 && (
            <Pressable
              onPress={handleBack}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          )}
        </View>

        <Animated.View style={[styles.continueWrap, continueAnimStyle]}>
          <Pressable
            onPress={handleNext}
            onPressIn={handleContinuePressIn}
            onPressOut={handleContinuePressOut}
            disabled={!ready}
            style={[styles.continuePressable, !ready && styles.continuePressableDisabled]}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            accessibilityState={{ disabled: !ready }}
          >
            <LinearGradient
              colors={['#ff8a14', '#ff7a00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, styles.continueBg]}
            />
            {/* Hairline highlight near top edge */}
            <View style={styles.pillHighlight} />
            <Text style={styles.continueText}>{continueLabel}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.bottomCellRight} />
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
    paddingBottom: 28,
  },
  // ── Progress strip ──
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 14,
  },
  progressPill: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.ember.base,
    shadowColor: '#ff7a00',
    shadowRadius: 12,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  progressPillFuture: {
    backgroundColor: 'rgba(246, 222, 210, 0.10)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(246, 222, 210, 0.30)',
  },
  progressPillCurrent: {
    elevation: 3,
  },
  // ── Header ──
  headerBlock: {
    marginBottom: 12,
    alignItems: 'center',
  },
  eyebrow: {
    ...(TYPE.eyebrow as object),
    marginBottom: 6,
    textAlign: 'center',
  } as const,
  title: {
    fontFamily: 'Geist_300Light',
    fontSize: 32,
    letterSpacing: -1.28,
    color: THEME.bone[100],
    lineHeight: 36,
    textAlign: 'center',
  },
  // ── Body ──
  bodyWrap: {
    flex: 1,
    minHeight: 0,
  },
  // ── Not-ready hint ──
  notReadyHint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 10.5,
    color: THEME.bone[35],
    textAlign: 'center',
    marginBottom: 6,
  },
  // ── Bottom row — flex row with three cells: back / continue / spacer ──
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  bottomCellLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bottomCellRight: {
    flex: 1,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  backText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: THEME.bone[50],
    letterSpacing: 0.04 * 12,
  },
  continueWrap: {
    alignItems: 'center',
  },
  continuePressable: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 9999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7a00',
    shadowRadius: 28,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  continuePressableDisabled: {
    opacity: 0.45,
  },
  continueBg: {
    borderRadius: 9999,
  },
  // Hairline highlight near top edge of pill
  pillHighlight: {
    position: 'absolute',
    top: 8,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    borderRadius: 1,
  },
  continueText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: '#1c110a',
  },
});
