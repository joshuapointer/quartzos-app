import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../tokens';
import { useBleStore } from '../../state/bleStore';
import { useSettingsStore } from '../../state/settingsStore';
import { useSessionStore } from '../../state/sessionStore';
import { useDabPreferencesStore } from '../../state/dabPreferencesStore';
import { formatTemp } from '../../utils/temperature';
import {
  findBanger,
  type Banger,
  type BangerId,
  type HeatTimeStage,
} from '../../data/bangers';
import {
  findConcentrate,
  type Concentrate,
  type ConcentrateId,
} from '../../data/concentrates';
import { findSensor, type Sensor } from '../../data/sensors';
import { findWallThickness, type WallThickness } from '../../data/wallThicknesses';
import {
  coldStartAvailable,
  inverseInterior,
  ENAIL_DEFAULT_MIDPOINT_F,
} from '../../utils/calibration';
import { BangerAnatomy } from './BangerAnatomy';
import { IrAimHint } from './IrAimHint';
import { StageTimer } from './StageTimer';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_HEAT_FALLBACK_S = 30;
const RING_RADIUS = 110;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Fallback context — when no preset banger / concentrate is wired ────────

function mustFind<T>(value: T | undefined, label: string): T {
  if (!value) throw new Error(`SessionWalkthrough: required catalog entry missing: ${label}`);
  return value;
}

const FALLBACK_BANGER = mustFind(findBanger('flat-top'), 'banger:flat-top');
const FALLBACK_CONCENTRATE = mustFind(findConcentrate('live-resin'), 'concentrate:live-resin');
const FALLBACK_SENSOR = mustFind(findSensor('ir'), 'sensor:ir');
const FALLBACK_WALL = mustFind(findWallThickness('standard'), 'wall:standard');

// ─── Range parsing helpers ──────────────────────────────────────────────────

/**
 * Parse a "20-40" / "55-90" range string into the midpoint in seconds.
 * Handles "30" (single value), "20-40 host (or 10-25 cold-start)" (free text)
 * and bad data by falling back to `fallback`.
 */
function parseRangeMidpoint(range: string, fallback: number): number {
  if (!range) return fallback;
  // Strip everything but the first <num>-<num> or <num> match.
  const match = range.match(/(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?/);
  if (!match) return fallback;
  const lo = Number.parseFloat(match[1]);
  const hi = match[2] != null ? Number.parseFloat(match[2]) : lo;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return fallback;
  return Math.round((lo + hi) / 2);
}

function parseHeatSeconds(range: string): number {
  return parseRangeMidpoint(range, DEFAULT_HEAT_FALLBACK_S);
}

/**
 * Compute a PID setpoint for a given interior surface target. Uses the
 * banger's `pid_offset_midpoint_f` when present (e-bangers), otherwise the
 * +50°F community midpoint.
 */
function pidSetpointFor(banger: Banger, interiorF: number): number {
  if (banger.geometry === 'enail') {
    return Math.round(interiorF + banger.pid_offset_midpoint_f);
  }
  return Math.round(interiorF + ENAIL_DEFAULT_MIDPOINT_F);
}

/**
 * For a slurper-class banger with a `heat_time_breakdown`, return a stable
 * sum of every stage's duration. Otherwise return the parsed midpoint.
 */
function totalHeatSeconds(banger: Banger): number {
  if (banger.heat_time_breakdown && banger.heat_time_breakdown.length > 0) {
    return banger.heat_time_breakdown.reduce(
      (acc: number, stage: HeatTimeStage) => acc + stage.duration_seconds,
      0,
    );
  }
  return parseHeatSeconds(banger.heat_time_seconds);
}

/** Find the active stage index given cumulative elapsed seconds. */
function activeStageFromElapsed(
  breakdown: readonly HeatTimeStage[],
  elapsed: number,
): number {
  let consumed = 0;
  for (let i = 0; i < breakdown.length; i += 1) {
    consumed += breakdown[i].duration_seconds;
    if (elapsed < consumed) return i;
  }
  return breakdown.length - 1;
}

// ─── Step definitions ────────────────────────────────────────────────────────

type StepId =
  | 'prepare'
  | 'heat'
  | 'cool'
  | 'cold-load'
  | 'cold-heat'
  | 'dab'
  | 'dunk'
  | 'complete';

interface Step {
  id: StepId;
  supra: string;
  title: string;
  body: string;
  ctaLabel?: string;
  autoAdvance?: boolean;
}

interface BuildStepsArgs {
  readonly banger: Banger;
  readonly concentrate: Concentrate;
  readonly sensor: Sensor;
  readonly displayedTargetF: number;
  readonly interiorTargetF: number;
  readonly pidSetpointF: number;
  readonly useCelsius: boolean;
  readonly coldStart: boolean;
}

function buildHeatBody(banger: Banger): string {
  const torchPattern = banger.torch_pattern.replace(/_/g, ' ');
  if (banger.torch_distance_inches != null) {
    return `Apply the torch using a ${torchPattern} sweep, ${banger.torch_distance_inches}" from quartz.`;
  }
  return `Apply the torch using a ${torchPattern} sweep.`;
}

function buildCoolBody(args: {
  readonly banger: Banger;
  readonly sensor: Sensor;
  readonly displayedTargetF: number;
  readonly interiorTargetF: number;
  readonly pidSetpointF: number;
  readonly useCelsius: boolean;
}): string {
  const { banger, sensor, displayedTargetF, interiorTargetF, pidSetpointF, useCelsius } = args;
  switch (sensor.method) {
    case 'ir':
      return `Aim ${sensor.name} at ${banger.ir_aim_location}. Dab on the descent through ${formatTemp(displayedTargetF, useCelsius)} — not at peak torch.`;
    case 'contact':
      return `Probe contact reads surface truth. Dab when probe shows ${formatTemp(interiorTargetF, useCelsius)}.`;
    case 'enail':
      return `PID is set & forget. When the coil shows ${formatTemp(pidSetpointF, useCelsius)}, you're ready.`;
    case 'visual':
    default:
      return `Watch for: ${banger.visual_cue}. Counted timing fills the gap.`;
  }
}

function buildDabBody(concentrate: Concentrate): string {
  const tip = concentrate.notes[0] ?? '';
  return tip ? `Drop ${concentrate.name}. ${tip}` : `Drop ${concentrate.name}.`;
}

function buildSteps(args: BuildStepsArgs): Step[] {
  const { banger, concentrate, sensor, useCelsius } = args;
  const heatBody = buildHeatBody(banger);
  const coolBody = buildCoolBody(args);
  const dabBody = buildDabBody(concentrate);
  const completeSummary = `${banger.name} · ${concentrate.name} · ${sensor.name}`;

  if (args.coldStart) {
    return [
      {
        id: 'prepare',
        supra: 'STEP 1 OF 4',
        title: 'Prepare',
        body: 'Cold-start ready. Set your torch within reach and grab your cap.',
        ctaLabel: "I'm Ready",
      },
      {
        id: 'cold-load',
        supra: 'STEP 2 OF 4',
        title: 'Cold Load',
        body: 'Load your concentrate cold into the bucket. Cap on, torch ready.',
        ctaLabel: 'Loaded',
      },
      {
        id: 'cold-heat',
        supra: 'STEP 3 OF 4',
        title: 'Light Heat',
        body: 'Light heat from below for 10–20 seconds. Pull torch when oil starts to bubble.',
        autoAdvance: true,
      },
      {
        id: 'dab',
        supra: 'STEP 4 OF 4',
        title: 'Dab',
        body: dabBody,
        ctaLabel: 'Done',
        autoAdvance: true,
      },
      {
        id: 'complete',
        supra: 'SESSION',
        title: 'Complete',
        body: completeSummary,
        ctaLabel: 'Finish',
      },
    ];
  }

  return [
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
      body: heatBody,
      autoAdvance: true,
    },
    {
      id: 'cool',
      supra: 'STEP 3 OF 5',
      title: 'Cool Down',
      body: coolBody,
      autoAdvance: true,
    },
    {
      id: 'dab',
      supra: 'STEP 4 OF 5',
      title: 'Dab',
      body: dabBody,
      ctaLabel: 'Done',
      autoAdvance: true,
    },
    {
      id: 'dunk',
      supra: 'STEP 5 OF 5',
      title: 'Dunk',
      body: `While the banger is still warm, swab the inside to remove residue.`,
      ctaLabel: 'All Done',
    },
    {
      id: 'complete',
      supra: 'SESSION',
      title: 'Complete',
      body: completeSummary,
      ctaLabel: 'Finish',
    },
  ];
}

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
            <Stop offset="0%" stopColor="#f4ede4" stopOpacity={0.9} />
            <Stop offset="35%" stopColor={colors.emberBright} stopOpacity={1} />
            <Stop offset="75%" stopColor={colors.ember} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.emberDeep} stopOpacity={1} />
          </SvgGradient>
          <SvgGradient id="innerFlam" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#f4ede4" stopOpacity={0.95} />
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
        <Path d="M28 22 L28 26 M22 28 L26 28 M28 30 L28 34 M30 28 L34 28" stroke="rgba(244,237,228,0.6)" strokeWidth={1.5} strokeLinecap="round" />
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
  onElapsedChange?: (elapsedSec: number) => void;
}

function TorchTimer({ durationSeconds, onComplete, onElapsedChange }: TorchTimerProps) {
  const progress = useSharedValue(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);
  const onElapsedChangeRef = useRef(onElapsedChange);
  onElapsedChangeRef.current = onElapsedChange;

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
      onElapsedChangeRef.current?.(elapsed);
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

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => {
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
  banger: Banger;
  concentrate: Concentrate;
  sensor: Sensor;
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
  banger,
  concentrate,
  sensor,
}: StepBodyProps) {
  const [elapsed, setElapsed] = useState(0);
  const [heatElapsed, setHeatElapsed] = useState(0);

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
        <BangerAnatomy banger={banger} size={140} />
      </View>
    );
  }

  if (step.id === 'heat' || step.id === 'cold-heat') {
    const breakdown = banger.heat_time_breakdown;
    const hasBreakdown =
      step.id === 'heat' && breakdown != null && breakdown.length > 0;
    const activeStageIdx =
      hasBreakdown && breakdown
        ? activeStageFromElapsed(breakdown, heatElapsed)
        : undefined;

    return (
      <View style={styles.stepCenterIcon}>
        <View style={styles.heatRow}>
          <TorchTimer
            key={stepIndex}
            durationSeconds={torchDuration}
            onComplete={onTorchComplete}
            onElapsedChange={hasBreakdown ? setHeatElapsed : undefined}
          />
          {step.id === 'heat' ? (
            <View style={styles.bangerSlot}>
              <BangerAnatomy
                banger={banger}
                size={120}
                showZones
                activeZoneIdx={activeStageIdx}
              />
            </View>
          ) : null}
        </View>
        {hasBreakdown && breakdown ? (
          <View style={styles.stageTimerSlot}>
            <StageTimer
              breakdown={breakdown}
              activeStageIdx={activeStageIdx ?? 0}
              elapsedSec={heatElapsed}
            />
          </View>
        ) : null}
        {step.id === 'heat' ? (
          <Text style={styles.visualCue}>Stop when: {banger.visual_cue}</Text>
        ) : null}
      </View>
    );
  }

  if (step.id === 'cold-load') {
    return (
      <View style={styles.stepCenterIcon}>
        <BangerAnatomy banger={banger} size={140} />
      </View>
    );
  }

  if (step.id === 'cool') {
    return (
      <View style={styles.stepCenterIcon}>
        <CoolIcon size={64} />
        <View style={{ height: 18 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={styles.targetPill}>
          <Text style={styles.targetPillText}>TARGET  {formatTemp(dabAlarmF, useCelsius)}</Text>
        </View>
        <View style={{ height: 16 }} />
        <View style={styles.aimHintSlot}>
          <IrAimHint banger={banger} sensor={sensor} />
        </View>
      </View>
    );
  }

  if (step.id === 'dab') {
    return (
      <View style={styles.stepCenterIcon}>
        <DabIcon size={64} />
        <View style={{ height: 18 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={[styles.targetPill, { borderColor: colors.quartz + '44' }]}>
          <Text style={[styles.targetPillText, { color: colors.quartz }]}>DUNK AT  {formatTemp(dunkAlarmF, useCelsius)}</Text>
        </View>
        {concentrate.notes[0] ? (
          <Text style={styles.visualCue}>{concentrate.notes[0]}</Text>
        ) : null}
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
          <Text style={styles.autoAdvanceText}>The next step opens when the timer settles</Text>
        </View>
      )}
      {step.id === 'cool' && (
        <View style={styles.autoAdvanceHint}>
          <Text style={styles.autoAdvanceText}>Hold here — the dial settles into target on its own</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
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
    fontFamily: 'SpaceGrotesk_400Regular',
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

  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  bangerSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  stageTimerSlot: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },

  aimHintSlot: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
  },

  visualCue: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    maxWidth: 280,
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
    fontFamily: 'SpaceGrotesk_300Light',
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
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
    fontFamily: 'SpaceGrotesk_300Light',
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
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
    fontFamily: 'SpaceGrotesk_300Light',
    fontSize: 28,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
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
    paddingBottom: 16,
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
    color: '#f4ede4',
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
