import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useConcentrate, useFlow } from '../store';
import { MOTION, SCREEN, SPACE, THEME, TYPE } from '../theme';
import { motion, reanimatedEasing } from '@/design/tokens';
import { PrimaryButton } from '../components/PrimaryButton';

import BangerChooser from './BangerChooser';
import ConcChooser from './ConcChooser';
import ReviewStep from './ReviewStep';
import WallChooser from './WallChooser';

const STEP_LABELS = ['BANGER', 'CONCENTRATE', 'WALL', 'REVIEW'] as const;
const STEP_TITLES = [
  'Select your banger.',
  'Choose your concentrate.',
  'Banger wall thickness.',
  'Setup confirmed.',
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
      easing: MOTION.STAGGER_EASE,
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
      entering={FadeIn.duration(motion.duration.modal).easing(reanimatedEasing.easeOut)}
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

  function handleBack() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    builderBack();
  }
  function handleNext() {
    if (!ready) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    builderNext();
  }

  const continueLabel = step < 3 ? 'CONTINUE' : 'BEGIN SESSION';

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
          {STEP_LABELS[step]}
        </Text>
        <Text style={styles.title}>{STEP_TITLES[step]}</Text>
      </View>

      <StageBody step={step} />

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

        <PrimaryButton
          label={continueLabel}
          onPress={handleNext}
          disabled={!ready}
        />

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
    paddingHorizontal: SCREEN.HPAD,
    paddingBottom: 28,
  },
  // ── Progress strip ──
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: SPACE.lg,
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
    backgroundColor: THEME.bone.warm08,
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
    paddingHorizontal: SPACE.lg,
    borderRadius: SCREEN.PILL_RADIUS,
    backgroundColor: 'transparent',
  },
  backText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: THEME.bone[70],
    letterSpacing: 0.04 * 12,
  },
});
