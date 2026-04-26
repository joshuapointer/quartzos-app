import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Path,
  Defs,
  RadialGradient,
  LinearGradient as SvgGradient,
  Stop,
  G,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../tokens';
import { useBleStore } from '../../state/bleStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useSessionStore } from '../../state/sessionStore';
import { formatTemp } from '../../utils/temperature';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

// ─── Constants ──────────────────────────────────────────────────────────────

const TORCH_DURATION_S = 30;
const RING_RADIUS = 110;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Step definitions ────────────────────────────────────────────────────────

type StepId = 'prepare' | 'heat' | 'cool' | 'dab' | 'dunk' | 'complete';

interface Step {
  id: StepId;
  supra: string;
  title: string;
  body: string;
  ctaLabel?: string;
  autoAdvance?: boolean;
}

const STEPS: Step[] = [
  {
    id: 'prepare',
    supra: 'STEP 1 OF 5',
    title: 'Prepare',
    body: 'Load your material into your cap and set your torch within reach.',
    ctaLabel: "I'm Ready",
  },
  {
    id: 'heat',
    supra: 'STEP 2 OF 5',
    title: 'Torch It',
    body: 'Apply heat evenly around the bottom and sides of your banger.',
    autoAdvance: true,
  },
  {
    id: 'cool',
    supra: 'STEP 3 OF 5',
    title: 'Cool Down',
    body: 'Set the torch down and let your banger settle to the target temperature.',
    autoAdvance: true,
  },
  {
    id: 'dab',
    supra: 'STEP 4 OF 5',
    title: 'Dab',
    body: 'Drop your material and inhale slowly. The dunk alarm will cue your next step.',
    ctaLabel: 'Done',
    autoAdvance: true,
  },
  {
    id: 'dunk',
    supra: 'STEP 5 OF 5',
    title: 'Dunk',
    body: 'While the banger is still warm, swab the inside to remove residue.',
    ctaLabel: 'All Done',
  },
  {
    id: 'complete',
    supra: 'SESSION',
    title: 'Complete',
    body: '',
    ctaLabel: 'Finish',
  },
];

const STEP_INDEX: Record<StepId, number> = {
  prepare: 0,
  heat: 1,
  cool: 2,
  dab: 3,
  dunk: 4,
  complete: 5,
};

// ─── Flame icon ──────────────────────────────────────────────────────────────

function FlameIcon({ size = 56, opacity = 1 }: { size?: number; opacity?: number }) {
  const flicker = useSharedValue(1);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 180, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(flicker); };
  }, []);

  const flickerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flicker.value }, { scaleX: 0.9 + flicker.value * 0.1 }],
    opacity,
  }));

  const s = size;
  return (
    <Animated.View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, flickerStyle]}>
      <Svg width={s} height={s} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="flamGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#fff5e0" stopOpacity={0.9} />
            <Stop offset="35%" stopColor={colors.emberBright} stopOpacity={1} />
            <Stop offset="75%" stopColor={colors.ember} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.emberDeep} stopOpacity={1} />
          </SvgGradient>
          <SvgGradient id="innerFlam" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#fffbe8" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="#ffd080" stopOpacity={0.8} />
            <Stop offset="100%" stopColor={colors.emberBright} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        {/* outer flame */}
        <Path
          d="M28 4 C28 4 38 14 38 24 C38 32 34 36 34 36 C36 28 30 26 30 26 C32 34 26 40 26 46 C22 42 16 36 16 28 C16 20 22 12 22 12 C20 20 26 22 26 22 C22 16 28 4 28 4 Z"
          fill="url(#flamGrad)"
        />
        {/* inner core */}
        <Path
          d="M28 20 C28 20 33 26 33 31 C33 35 30.5 37.5 30.5 37.5 C31.5 33 28.5 31 28.5 31 C29.5 35 26 38 26 42 C23.5 39 21 35 21 30 C21 25 25 21 25 21 C24 26 27 27 27 27 C25.5 23 28 20 28 20 Z"
          fill="url(#innerFlam)"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Cool icon ───────────────────────────────────────────────────────────────

function CoolIcon({ size = 56 }: { size?: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(pulse); };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="coolGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.quartzBright} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={colors.quartzDeep} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        <SvgCircle cx={28} cy={28} r={20} fill="none" stroke="url(#coolGrad)" strokeWidth={2} />
        <SvgCircle cx={28} cy={28} r={12} fill="none" stroke={colors.quartz} strokeWidth={1.5} strokeDasharray="3 3" />
        <Path d="M28 14 L28 18 M28 38 L28 42 M14 28 L18 28 M38 28 L42 28" stroke={colors.quartzBright} strokeWidth={2} strokeLinecap="round" />
        <SvgCircle cx={28} cy={28} r={4} fill={colors.quartzBright} opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

// ─── Dab icon ────────────────────────────────────────────────────────────────

function DabIcon({ size = 56 }: { size?: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(glow); };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.5,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, glowStyle]}>
        <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, backgroundColor: colors.emberBright, opacity: 0.12 }} />
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="dabGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.emberBright} />
            <Stop offset="100%" stopColor={colors.ember} />
          </SvgGradient>
        </Defs>
        <Path d="M28 10 C20 10 14 16 14 24 C14 32 20 40 28 46 C36 40 42 32 42 24 C42 16 36 10 28 10 Z" fill="none" stroke="url(#dabGrad)" strokeWidth={2} />
        <SvgCircle cx={28} cy={28} r={6} fill={colors.emberBright} opacity={0.85} />
        <Path d="M28 22 L28 26 M22 28 L26 28 M28 30 L28 34 M30 28 L34 28" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ─── Dunk icon ───────────────────────────────────────────────────────────────

function DunkIcon({ size = 56 }: { size?: number }) {
  const drop = useSharedValue(0);
  useEffect(() => {
    drop.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(drop); };
  }, []);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value * 8 }],
    opacity: 1 - drop.value * 0.5,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={dropStyle}>
        <Svg width={size} height={size} viewBox="0 0 56 56">
          <Defs>
            <SvgGradient id="dunkGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor={colors.quartzBright} />
              <Stop offset="100%" stopColor={colors.quartzDeep} />
            </SvgGradient>
          </Defs>
          <Path d="M28 8 C28 8 18 22 18 32 C18 38.6 22.7 44 28 44 C33.3 44 38 38.6 38 32 C38 22 28 8 28 8 Z" fill="none" stroke="url(#dunkGrad)" strokeWidth={2} />
          <Path d="M22 34 C22 34 24 38 28 38" stroke={colors.quartzBright} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── Complete icon ────────────────────────────────────────────────────────────

function CompleteIcon({ size = 56 }: { size?: number }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="complGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.success} />
            <Stop offset="100%" stopColor="#5aaa7a" />
          </SvgGradient>
        </Defs>
        <SvgCircle cx={28} cy={28} r={22} fill="none" stroke="url(#complGrad)" strokeWidth={2} />
        <Path d="M18 28 L24 34 L38 20" stroke={colors.success} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

// ─── Torch timer ring ────────────────────────────────────────────────────────

interface TorchTimerProps {
  durationSeconds: number;
  onComplete: () => void;
}

function TorchTimer({ durationSeconds, onComplete }: TorchTimerProps) {
  const progress = useSharedValue(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);

  const advanceStep = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    startedAt.current = Date.now();

    progress.value = withTiming(1, {
      duration: durationSeconds * 1000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(advanceStep)();
      }
    });

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const rem = Math.max(0, Math.ceil(durationSeconds - elapsed));
      setRemaining(rem);
      if (rem === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 250);

    return () => {
      cancelAnimation(progress);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animatedRingProps = useAnimatedProps(() => {
    const offset = RING_CIRCUMFERENCE * (1 - progress.value);
    return { strokeDashoffset: offset };
  });

  const ringColorStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + progress.value * 0.4,
  }));

  const secondsDisplay = remaining;
  const minsDisplay = Math.floor(secondsDisplay / 60);
  const secsDisplay = secondsDisplay % 60;
  const timeLabel = minsDisplay > 0
    ? `${minsDisplay}:${String(secsDisplay).padStart(2, '0')}`
    : `${secsDisplay}`;

  return (
    <View style={styles.timerContainer}>
      {/* Background ring glow */}
      <Animated.View style={[styles.timerGlow, ringColorStyle]} />

      <Svg width={RING_RADIUS * 2 + 40} height={RING_RADIUS * 2 + 40} style={styles.timerSvg}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.emberBright} stopOpacity={0.3} />
            <Stop offset="50%" stopColor={colors.emberBright} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={colors.ember} stopOpacity={0.05} />
          </SvgGradient>
          <SvgGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.emberBright} />
            <Stop offset="100%" stopColor="#ffd080" />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <SvgCircle
          cx={RING_RADIUS + 20}
          cy={RING_RADIUS + 20}
          r={RING_RADIUS}
          fill="none"
          stroke="rgba(244,237,228,0.06)"
          strokeWidth={RING_STROKE}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={RING_RADIUS + 20}
          cy={RING_RADIUS + 20}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.emberBright}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeLinecap="round"
          animatedProps={animatedRingProps}
          transform={`rotate(-90, ${RING_RADIUS + 20}, ${RING_RADIUS + 20})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.timerCenter}>
        <FlameIcon size={52} />
        <Text style={styles.timerCountdown}>{timeLabel}</Text>
        <Text style={styles.timerLabel}>SECONDS</Text>
      </View>
    </View>
  );
}

// ─── Live temp display ───────────────────────────────────────────────────────

function LiveTempBadge({ dabAlarmF, useCelsius }: { dabAlarmF: number; useCelsius: boolean }) {
  const tempF = useBleStore((s) => s.liveTempF) ?? 72;
  const diff = tempF - dabAlarmF;

  const isClose = Math.abs(diff) <= 15;
  const isAtTarget = Math.abs(diff) <= 5;
  const isTooHot = diff > 5;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isClose) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isClose]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const accentColor = isAtTarget ? colors.success : isClose ? colors.emberBright : isTooHot ? colors.ember : colors.quartzBright;

  return (
    <Animated.View style={[styles.liveTempBadge, { borderColor: accentColor + '44' }, pulseStyle]}>
      <Text style={[styles.liveTempValue, { color: accentColor }]}>
        {formatTemp(tempF, useCelsius)}
      </Text>
      <Text style={styles.liveTempSub}>
        {isAtTarget ? 'AT TARGET' : isClose ? 'NEARLY THERE' : isTooHot ? 'COOLING DOWN' : 'LIVE TEMP'}
      </Text>
    </Animated.View>
  );
}

// ─── Step dots ──────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  const totalDots = 5; // steps 0-4, complete is not a dot
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: totalDots }, (_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive && styles.dotActive,
              isDone && styles.dotDone,
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Step content body ───────────────────────────────────────────────────────

interface StepBodyProps {
  step: Step;
  stepIndex: number;
  torchDuration: number;
  onTorchComplete: () => void;
  onCta: () => void;
  dabAlarmF: number;
  dunkAlarmF: number;
  useCelsius: boolean;
  peakF: number;
  walkthroughStartedAt: number;
}

function StepBody({
  step,
  stepIndex,
  torchDuration,
  onTorchComplete,
  onCta,
  dabAlarmF,
  dunkAlarmF,
  useCelsius,
  peakF,
  walkthroughStartedAt,
}: StepBodyProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (step.id !== 'complete') return;
    setElapsed(Math.floor((Date.now() - walkthroughStartedAt) / 1000));
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - walkthroughStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [step.id, walkthroughStartedAt]);

  const elapsedLabel =
    elapsed > 0
      ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
      : '0:00';

  if (step.id === 'prepare') {
    return (
      <View style={styles.stepCenterIcon}>
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Defs>
            <SvgGradient id="prepGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor={colors.bone90} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={colors.bone50} stopOpacity={0.6} />
            </SvgGradient>
          </Defs>
          {/* Banger silhouette */}
          <Path d="M36 18 C36 18 24 22 24 34 C24 46 30 54 36 54 C42 54 48 46 48 34 C48 22 36 18 36 18 Z" fill="none" stroke="url(#prepGrad)" strokeWidth={2} />
          <Path d="M28 30 C28 30 32 36 36 36 C40 36 44 30 44 30" stroke={colors.bone70} strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <SvgCircle cx={36} cy={42} r={4} fill={colors.bone50} opacity={0.6} />
          {/* Gleam */}
          <Path d="M30 24 L32 20" stroke={colors.bone90} strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
        </Svg>
      </View>
    );
  }

  if (step.id === 'heat') {
    return (
      <View style={styles.stepCenterIcon}>
        <TorchTimer key={stepIndex} durationSeconds={torchDuration} onComplete={onTorchComplete} />
      </View>
    );
  }

  if (step.id === 'cool') {
    return (
      <View style={styles.stepCenterIcon}>
        <CoolIcon size={72} />
        <View style={{ height: 24 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={styles.targetPill}>
          <Text style={styles.targetPillText}>TARGET  {formatTemp(dabAlarmF, useCelsius)}</Text>
        </View>
      </View>
    );
  }

  if (step.id === 'dab') {
    return (
      <View style={styles.stepCenterIcon}>
        <DabIcon size={72} />
        <View style={{ height: 24 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={[styles.targetPill, { borderColor: colors.quartz + '44' }]}>
          <Text style={[styles.targetPillText, { color: colors.quartz }]}>DUNK AT  {formatTemp(dunkAlarmF, useCelsius)}</Text>
        </View>
      </View>
    );
  }

  if (step.id === 'dunk') {
    return (
      <View style={styles.stepCenterIcon}>
        <DunkIcon size={72} />
      </View>
    );
  }

  if (step.id === 'complete') {
    return (
      <View style={styles.stepCenterIcon}>
        <CompleteIcon size={72} />
        <View style={{ height: 28 }} />
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{formatTemp(peakF, useCelsius)}</Text>
            <Text style={styles.statLabel}>PEAK TEMP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{elapsedLabel}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────

interface SessionWalkthroughProps {
  visible: boolean;
  onClose: () => void;
}

export function SessionWalkthrough({ visible, onClose }: SessionWalkthroughProps) {
  const insets = useSafeAreaInsets();

  const liveTempF = useBleStore((s) => s.liveTempF) ?? 72;
  const settings = useSettingsStore((s) => s.settings);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const endSession = useSessionStore((s) => s.endSession);
  const dunkAlertFired = useSessionStore((s) => s.dunkAlertFired);

  const walkthroughStartedAt = useRef<number>(Date.now());
  const hasHeatedRef = useRef(false);
  const [capturedPeakF, setCapturedPeakF] = useState(0);

  const [stepIndex, setStepIndex] = useState(0);
  const torchDuration = TORCH_DURATION_S;

  // Modal backdrop + content enter/exit animations
  const backdropOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(60);
  const contentOpacity = useSharedValue(0);

  // Step transition animations
  const stepOpacity = useSharedValue(1);
  const stepTranslateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      walkthroughStartedAt.current = Date.now();
      hasHeatedRef.current = false;
      setCapturedPeakF(0);
      backdropOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
      contentTranslateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      contentOpacity.value = withTiming(1, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      contentTranslateY.value = withTiming(60, { duration: 220 });
      contentOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const step = STEPS[stepIndex] ?? STEPS[0];

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
    const next = stepIndex + 1;
    if (next < STEPS.length) {
      if (STEPS[next]?.id === 'complete') {
        setCapturedPeakF(peakF);
      }
      transitionToStep(next);
    }
  }, [stepIndex, transitionToStep, peakF]);

  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 220 });
    contentTranslateY.value = withTiming(80, { duration: 220 });
    contentOpacity.value = withTiming(0, { duration: 220 }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  const handleFinish = useCallback(() => {
    if (sessionActive) endSession();
    backdropOpacity.value = withTiming(0, { duration: 220 });
    contentTranslateY.value = withTiming(80, { duration: 220 });
    contentOpacity.value = withTiming(0, { duration: 220 }, () => {
      runOnJS(onClose)();
    });
  }, [sessionActive, endSession, onClose]);

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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
    opacity: contentOpacity.value,
  }));

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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <LinearGradient
          colors={['rgba(5,4,3,0.96)', 'rgba(12,9,8,0.98)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Content card */}
      <View style={[styles.sheetOuter, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, contentStyle]}>
          <LinearGradient
            colors={['#1a1410', '#0f0b08']}
            style={styles.sheetGradient}
          >
            {/* Crystal border */}
            <View style={[StyleSheet.absoluteFillObject, styles.sheetBorder]} pointerEvents="none" />

            {/* Header */}
            <View style={[styles.sheetHeader, { paddingTop: insets.top > 0 ? insets.top + 8 : 24 }]}>
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
            <StepDots current={stepIndex} />

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
                stepIndex={stepIndex}
                torchDuration={torchDuration}
                onTorchComplete={advance}
                onCta={handleCta}
                dabAlarmF={settings.dabAlarmF}
                dunkAlarmF={settings.dunkAlarmF}
                useCelsius={settings.useCelsius}
                peakF={capturedPeakF}
                walkthroughStartedAt={walkthroughStartedAt.current}
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
            {step.autoAdvance && !step.ctaLabel && step.id === 'heat' && (
              <View style={styles.autoAdvanceHint}>
                <Text style={styles.autoAdvanceText}>Advances automatically when timer ends</Text>
              </View>
            )}
            {step.id === 'cool' && (
              <View style={styles.autoAdvanceHint}>
                <Text style={styles.autoAdvanceText}>Advances automatically when target is reached</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheetOuter: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },

  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    minHeight: SCREEN_H * 0.82,
  },

  sheetGradient: {
    flex: 1,
    minHeight: SCREEN_H * 0.82,
  },

  sheetBorder: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  headerLeft: {
    flex: 1,
  },

  supraLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: colors.bone35,
    textTransform: 'uppercase',
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244,237,228,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingBottom: 20,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(244,237,228,0.12)',
  },

  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.emberBright,
  },

  dotDone: {
    backgroundColor: 'rgba(232,146,64,0.35)',
  },

  stepArea: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },

  stepTitle: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.76,
    textAlign: 'center',
    marginBottom: 10,
  },

  stepBody: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.bone50,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 28,
    maxWidth: 280,
  },

  stepCenterIcon: {
    alignItems: 'center',
    marginTop: 12,
    flex: 1,
  },

  // Torch timer
  timerContainer: {
    width: RING_RADIUS * 2 + 40,
    height: RING_RADIUS * 2 + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerGlow: {
    position: 'absolute',
    width: RING_RADIUS * 2,
    height: RING_RADIUS * 2,
    borderRadius: RING_RADIUS,
    backgroundColor: colors.emberBright,
    opacity: 0.04,
  },

  timerSvg: {
    position: 'absolute',
  },

  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerCountdown: {
    fontFamily: 'Georgia',
    fontSize: 48,
    fontWeight: '400',
    color: colors.bone90,
    letterSpacing: -1,
    marginTop: 4,
  },

  timerLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Live temp badge
  liveTempBadge: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(244,237,228,0.03)',
  },

  liveTempValue: {
    fontFamily: 'Georgia',
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: -0.7,
  },

  liveTempSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 3,
  },

  targetPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.ember + '44',
    backgroundColor: 'rgba(232,146,64,0.06)',
  },

  targetPillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.ember,
    textTransform: 'uppercase',
  },

  // Stats (complete step)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,237,228,0.04)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.08)',
  },

  statCol: {
    alignItems: 'center',
    minWidth: 80,
  },

  statValue: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    color: colors.bone90,
    letterSpacing: -0.5,
  },

  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.bone35,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  statDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: 'rgba(244,237,228,0.08)',
    marginHorizontal: 24,
  },

  // CTA
  ctaRow: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    paddingTop: 16,
  },

  ctaBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  ctaBtnFinal: {
    shadowColor: colors.success,
  },

  ctaBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 18,
  },

  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#fff',
  },

  autoAdvanceHint: {
    paddingBottom: 20,
    alignItems: 'center',
  },

  autoAdvanceText: {
    fontSize: 11,
    color: colors.bone35,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
