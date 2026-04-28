/**
 * src/flow/components/Orb.tsx
 *
 * Phase 3 — the persistent orb. The single morphing visual at the top of every
 * stage of the linear flow. Ported from the web prototype (Dial.jsx + flow-shell
 * PersistentOrb) to react-native-svg + Reanimated v4.
 *
 * Subcomponents:
 *   - Orb (default export)              — picks the right visual per state
 *   - TempDial  (refractive quartz orb) — idle / searching / standby / cool / dunk / clean / complete
 *   - TorchRing (290pt countdown ring)  — heat / heat-reheat
 *
 * Visual references:
 *   /tmp/quartzie-prototype/src/Dial.jsx         (refractive quartz)
 *   /tmp/quartzie-prototype/src/flow-shell.jsx   (PersistentOrb torch + size morph)
 *
 * Tokens: see ./theme.ts. Hardcoded fallbacks live alongside the THEME usage so
 * this component doesn't crash if tokens shift.
 */

import React, { memo, useEffect, useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { THEME, TYPE } from '../theme';

// ─── Public API ──────────────────────────────────────────────────────────────

export type OrbState =
  | 'idle'
  | 'searching'
  | 'standby'
  | 'heat'
  | 'heat-reheat'
  | 'cool'
  | 'cool-fast-drop'
  | 'cool-in-window'
  | 'dab'
  | 'dunk'
  | 'clean'
  | 'complete';

export type OrbProps = {
  state: OrbState;
  /** Override / current size in points. Has a per-state default. */
  size?: number;
  label?: string;
  /** Live °F for cool / dunk / clean states. */
  temp?: number;
  /** Dab window center °F. */
  target?: number;
  /** Dab window low °F. */
  low?: number;
  /** Dab window high °F. */
  high?: number;
  /** 0..1 progress for torch ring. */
  heatProgress?: number;
  /** Total torch seconds — drives the "30s TOTAL" caption. */
  heatTotalSeconds?: number;
  /** Hide the temp readout (dab phase). */
  noReading?: boolean;
  /** Degrees-per-second drop rate (cool phase). */
  dropRate?: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SIZE: Record<OrbState, number> = {
  idle: 200,
  searching: 200,
  standby: 160,
  heat: 290,
  'heat-reheat': 290,
  cool: 240,
  'cool-fast-drop': 240,
  'cool-in-window': 240,
  dab: 240,
  dunk: 240,
  clean: 170,
  complete: 150,
};

const DEFAULT_LABEL: Record<OrbState, string> = {
  idle: 'DEVICE NOT FOUND',
  searching: 'SCANNING',
  standby: 'STANDBY',
  heat: 'TORCH',
  'heat-reheat': 'REHEAT',
  cool: 'LIVE · IR',
  'cool-fast-drop': 'COOLING FAST',
  'cool-in-window': 'IN WINDOW · LIFT TO DAB',
  dab: 'DABBING',
  dunk: 'DUNK READY',
  clean: 'CLEAN UP',
  complete: 'COMPLETE',
};

const MORPH = { duration: 700, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const FADE = { duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1) };

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHeat(s: OrbState): boolean {
  return s === 'heat' || s === 'heat-reheat';
}

function isCool(s: OrbState): boolean {
  return (
    s === 'cool' ||
    s === 'cool-fast-drop' ||
    s === 'cool-in-window' ||
    s === 'dab' ||
    s === 'dunk' ||
    s === 'clean'
  );
}

// ─── TorchRing ───────────────────────────────────────────────────────────────

interface TorchRingProps {
  size: number;
  heatProgress: number;
  heatTotalSeconds: number;
  reheat: boolean;
  label: string;
}

function TorchRingInner({
  size,
  heatProgress,
  heatTotalSeconds,
  reheat,
  label,
}: TorchRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 6;
  const r = size / 2 - stroke;
  const circumference = 2 * Math.PI * r;

  // Animated dashoffset — sweep clockwise from 12 o'clock.
  const progress = useSharedValue(heatProgress);

  useEffect(() => {
    progress.value = withTiming(heatProgress, {
      duration: 200,
      easing: Easing.linear,
    });
  }, [heatProgress, progress]);

  const animatedArcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const secondsLeft = Math.max(
    0,
    Math.ceil((1 - heatProgress) * heatTotalSeconds),
  );

  const gradId = useMemo(() => `torch-${reheat ? 'r' : 'n'}-${size}`, [reheat, size]);

  const ringHi = reheat ? THEME.danger : THEME.ember.bright;
  const ringLo = reheat ? '#c44' : THEME.ember.deep;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Soft halo — ember bloom behind the orb. */}
      <View
        pointerEvents="none"
        style={[
          styles.haloAbs,
          {
            shadowColor: ringHi,
          },
        ]}
      />

      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ringHi} stopOpacity="1" />
            <Stop offset="1" stopColor={ringLo} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* etched track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={THEME.navy[4]}
          strokeWidth={stroke}
          opacity={0.55}
        />

        {/* progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedArcProps}
        />
      </Svg>

      {/* Centered numeric + caption. */}
      <View pointerEvents="none" style={styles.centerStack}>
        <Text
          style={[
            styles.eyebrow,
            { color: ringHi, marginBottom: 6 },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.bigNumber,
            { fontSize: Math.round(size * 0.34), color: '#fff5e8' },
          ]}
        >
          {secondsLeft}
        </Text>
        <Text style={[styles.monoCaption, { marginTop: 12 }]}>
          {`SECONDS · ${Math.round(heatTotalSeconds)}s TOTAL`}
        </Text>
      </View>
    </View>
  );
}

const TorchRing = memo(TorchRingInner);

// ─── TempDial (refractive quartz body) ───────────────────────────────────────

interface TempDialProps {
  size: number;
  state: OrbState;
  label: string;
  temp?: number;
  noReading: boolean;
  inWindow: boolean;
  fastDrop: boolean;
}

function TempDialInner({
  size,
  state,
  label,
  temp,
  noReading,
  inWindow,
  fastDrop,
}: TempDialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Caustic rotations — two layers spinning opposite directions.
  const causticCw = useSharedValue(0);
  const causticCcw = useSharedValue(0);
  const breathe = useSharedValue(0);
  const searchPulse = useSharedValue(0);

  useEffect(() => {
    causticCw.value = withRepeat(
      withTiming(1, { duration: 30000, easing: Easing.linear }),
      -1,
      false,
    );
    causticCcw.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(causticCw);
      cancelAnimation(causticCcw);
      cancelAnimation(breathe);
    };
  }, [breathe, causticCcw, causticCw]);

  useEffect(() => {
    if (state === 'searching') {
      searchPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(searchPulse);
      searchPulse.value = withTiming(0, { duration: 200 });
    }
    return () => {
      cancelAnimation(searchPulse);
    };
  }, [state, searchPulse]);

  const causticCwStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${causticCw.value * 360}deg` }],
  }));
  const causticCcwStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-causticCcw.value * 360}deg` }],
  }));
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1.0, 1.012]) }],
  }));
  const searchPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchPulse.value, [0, 1], [0, 0.6]),
  }));

  const showTemp =
    !noReading &&
    typeof temp === 'number' &&
    (state === 'cool' ||
      state === 'cool-fast-drop' ||
      state === 'cool-in-window' ||
      state === 'dunk' ||
      state === 'clean');

  // For cool states, the eyebrow color shifts to quartz-bright when in window.
  const eyebrowColor = inWindow
    ? THEME.quartz.bright
    : state === 'dab'
      ? THEME.ember.bright
      : THEME.bone[50];

  // Dim the body during the dab state.
  const bodyOpacity = state === 'dab' ? 0.5 : 1;

  // Numeric scaling — match prototype rule (3+ digits → 0.42, else 0.50).
  const tempStr = showTemp ? `${Math.round(temp ?? 0)}` : '';
  const numScale = tempStr.length >= 3 ? 0.42 : 0.5;

  const reactUid = useId();
  const uid = useMemo(
    () => `td-${reactUid.replace(/:/g, '-')}`,
    [reactUid],
  );

  return (
    <Animated.View
      style={[
        styles.box,
        { width: size, height: size, opacity: bodyOpacity },
        breatheStyle,
      ]}
    >
      {/* Far halo — softly tinted by state. We use shadow rather than blur
          to keep iOS GPU happy; visually similar at this scale. */}
      <View
        pointerEvents="none"
        style={[
          styles.haloAbs,
          {
            shadowColor: isCool(state) ? THEME.ember.bright : THEME.quartz.glow,
          },
        ]}
      />

      {/* Search pulse ring — only animates while searching. */}
      {state === 'searching' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.searchPulse,
            { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
            searchPulseStyle,
          ]}
        />
      )}

      {/* Glass body — radial gradient core. */}
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          {/* Body gradient: bright bone center → navy edge. */}
          <RadialGradient
            id={`${uid}-body`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.bone[100]} stopOpacity="0.18" />
            <Stop offset="0.45" stopColor={THEME.navy[3]} stopOpacity="0.85" />
            <Stop offset="1" stopColor={THEME.navy[0]} stopOpacity="1" />
          </RadialGradient>

          {/* Top refraction streak (off-center highlight). */}
          <RadialGradient
            id={`${uid}-streak`}
            cx="32%"
            cy="22%"
            rx="38%"
            ry="38%"
          >
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>

          {/* Emissive ember overlay for cool states. */}
          <RadialGradient
            id={`${uid}-ember`}
            cx="50%"
            cy="55%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.ember.bright} stopOpacity="0.55" />
            <Stop offset="0.55" stopColor={THEME.ember.deep} stopOpacity="0.20" />
            <Stop offset="1" stopColor={THEME.ember.deep} stopOpacity="0" />
          </RadialGradient>

          {/* Caustic stroke gradient. */}
          <RadialGradient
            id={`${uid}-caustic`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.quartz.bright} stopOpacity="0" />
            <Stop offset="0.55" stopColor={THEME.quartz.bright} stopOpacity="0.28" />
            <Stop offset="1" stopColor={THEME.quartz.bright} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glass body */}
        <Circle cx={cx} cy={cy} r={r - 1} fill={`url(#${uid}-body)`} />

        {/* Emissive ember (only for cool/dunk/clean states with a real temp). */}
        {isCool(state) && state !== 'dab' && (
          <Circle
            cx={cx}
            cy={cy}
            r={r - 4}
            fill={`url(#${uid}-ember)`}
            opacity={inWindow ? 0.95 : 0.55}
          />
        )}

        {/* Top refraction streak */}
        <Circle cx={cx} cy={cy} r={r - 1} fill={`url(#${uid}-streak)`} />

        {/* Outer hairline — light-catching edge. */}
        <Circle
          cx={cx}
          cy={cy}
          r={r - 0.5}
          fill="none"
          stroke="rgba(220, 230, 245, 0.18)"
          strokeWidth={0.5}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r - 1.5}
          fill="none"
          stroke="rgba(0, 0, 0, 0.30)"
          strokeWidth={0.5}
        />

        {/* Fast-drop danger ring (inside the orb edge). */}
        {fastDrop && (
          <Circle
            cx={cx}
            cy={cy}
            r={r - 6}
            fill="none"
            stroke={THEME.danger}
            strokeWidth={1.25}
            opacity={0.55}
          />
        )}
      </Svg>

      {/* Caustic layer 1 — clockwise. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.causticAbs, causticCwStyle]}
      >
        <Svg width={size * 1.4} height={size * 1.4} viewBox="0 0 400 400">
          <G opacity={0.32}>
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <Circle
                key={deg}
                cx={200}
                cy={200}
                r={140 + (i % 2) * 18}
                fill="none"
                stroke={THEME.quartz.bright}
                strokeOpacity={0.35}
                strokeWidth={1.5}
                strokeDasharray={i % 2 === 0 ? '40 360' : '24 376'}
                transform={`rotate(${deg} 200 200)`}
              />
            ))}
          </G>
        </Svg>
      </Animated.View>

      {/* Caustic layer 2 — counter-clockwise, slower. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.causticAbs, causticCcwStyle]}
      >
        <Svg width={size * 1.4} height={size * 1.4} viewBox="0 0 400 400">
          <G opacity={0.18}>
            {[30, 90, 150, 210, 270, 330].map((deg, i) => (
              <Circle
                key={deg}
                cx={200}
                cy={200}
                r={120 + (i % 3) * 12}
                fill="none"
                stroke={THEME.bone[100]}
                strokeOpacity={0.20}
                strokeWidth={1}
                strokeDasharray={i % 2 === 0 ? '20 380' : '8 392'}
                transform={`rotate(${deg} 200 200)`}
              />
            ))}
          </G>
        </Svg>
      </Animated.View>

      {/* Centered text stack. */}
      <View pointerEvents="none" style={styles.centerStack}>
        <Text
          style={[
            styles.eyebrow,
            { color: eyebrowColor, marginBottom: showTemp ? 10 : 0 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {showTemp ? (
          <View style={styles.tempRow}>
            <Text
              style={[
                styles.bigNumber,
                {
                  fontSize: Math.round(size * numScale),
                  color: THEME.bone[100],
                },
              ]}
            >
              {tempStr}
            </Text>
            <Text style={styles.degSymbol}>°</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const TempDial = memo(TempDialInner);

// ─── Orb (entry point) ──────────────────────────────────────────────────────

function OrbInner(props: OrbProps) {
  const {
    state,
    size: sizeOverride,
    label: labelOverride,
    temp,
    target: _target,
    low,
    high,
    heatProgress = 0,
    heatTotalSeconds = 30,
    noReading = false,
    dropRate: _dropRate,
  } = props;

  const targetSize = sizeOverride ?? DEFAULT_SIZE[state];
  const label = labelOverride ?? DEFAULT_LABEL[state];

  // Smooth size morph — animated via container scale on a fixed 320px base
  // to avoid re-layout thrash on every re-render during the cool phase.
  const BASE = 320;
  const sizeShared = useSharedValue(targetSize);
  useEffect(() => {
    sizeShared.value = withTiming(targetSize, MORPH);
  }, [targetSize, sizeShared]);

  const morphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sizeShared.value / BASE }],
  }));

  // Crossfade when state changes — keeps label/treatment swap soft.
  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withSequence(
      withTiming(0.55, { duration: FADE.duration / 2, easing: FADE.easing }),
      withTiming(1, { duration: FADE.duration / 2, easing: FADE.easing }),
    );
  }, [state, fade]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const inWindow =
    state === 'cool-in-window' ||
    (typeof temp === 'number' &&
      typeof low === 'number' &&
      typeof high === 'number' &&
      temp >= low &&
      temp <= high);

  const fastDrop = state === 'cool-fast-drop';

  return (
    <Animated.View
      style={[
        styles.outer,
        { width: BASE, height: BASE },
        morphStyle,
      ]}
    >
      <Animated.View style={[styles.outer, fadeStyle]}>
        {isHeat(state) ? (
          <TorchRing
            size={BASE}
            heatProgress={Math.max(0, Math.min(1, heatProgress))}
            heatTotalSeconds={heatTotalSeconds}
            reheat={state === 'heat-reheat'}
            label={label}
          />
        ) : (
          <TempDial
            size={BASE}
            state={state}
            label={label}
            temp={temp}
            noReading={noReading || state === 'dab'}
            inWindow={inWindow}
            fastDrop={fastDrop}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const Orb = memo(OrbInner);

export default Orb;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  causticAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloAbs: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -40,
    bottom: -40,
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
    shadowOpacity: 0.6,
  },
  searchPulse: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: THEME.ember.bright,
    backgroundColor: 'transparent',
  },
  eyebrow: {
    ...TYPE.eyebrow,
    fontSize: 9.5,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  bigNumber: {
    fontFamily: TYPE.display.fontFamily,
    letterSpacing: -0.07 * 16,
    lineHeight: undefined,
    includeFontPadding: false,
  },
  monoCaption: {
    fontFamily: TYPE.mono.fontFamily,
    fontSize: 9.5,
    letterSpacing: 2,
    color: THEME.bone[50],
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  degSymbol: {
    fontFamily: TYPE.display.fontFamily,
    color: THEME.bone[100],
    fontSize: 22,
    marginLeft: 4,
    marginTop: 8,
    opacity: 0.7,
  },
});
