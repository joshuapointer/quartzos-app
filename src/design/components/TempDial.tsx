import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, animation } from '../tokens';
import Svg, {
  Circle,
  Line,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DialState = 'idle' | 'heating' | 'target' | 'cooling' | 'dunk';

const PALETTE: Record<DialState, { ring: string; text: string; lensTop: string; lensBottom: string }> = {
  idle:    { ring: colors.quartzDim,    text: colors.bone90,  lensTop: colors.lensIdle,    lensBottom: colors.surface1 },
  heating: { ring: colors.emberMid,     text: colors.bone100, lensTop: colors.lensHeating, lensBottom: colors.surface1 },
  target:  { ring: colors.emberBright,  text: '#f6ded2',      lensTop: colors.lensTarget,  lensBottom: colors.surface2 },
  cooling: { ring: colors.emberCool,    text: colors.bone90,  lensTop: colors.lensCooling, lensBottom: colors.surface1 },
  dunk:    { ring: colors.quartzBright, text: '#cde5ff',      lensTop: colors.lensDunk,    lensBottom: colors.surface1 },
};

const STATE_LABELS: Record<DialState, string> = {
  idle:    'STANDBY',
  heating: 'HEATING',
  target:  'AT TARGET',
  cooling: 'DAB WINDOW',
  dunk:    'DUNK READY',
};

const STATE_INDICES: Record<DialState, number> = {
  idle: 0, heating: 1, target: 2, cooling: 3, dunk: 4,
};

const RING_COLOR_STOPS = [0, 0.25, 0.5, 0.75, 1];
const RING_COLORS = [colors.quartzDim, colors.emberMid, colors.emberBright, colors.emberCool, colors.quartzBright];

function deriveState(
  tempF: number,
  dabAlarmF: number,
  dunkAlarmF: number,
  sessionActive: boolean,
): DialState {
  if (!sessionActive && tempF < 200) return 'idle';
  if (tempF >= dabAlarmF && tempF < dunkAlarmF) return 'target';
  if (tempF >= dunkAlarmF) return 'dunk';
  if (tempF > 250 && tempF < dabAlarmF) return 'heating';
  if (tempF >= 200) return 'cooling';
  return 'idle';
}

// Scale constants for mini state
const FULL_SIZE = 280;
const MINI_SIZE = 80;
const MINI_SCALE = MINI_SIZE / FULL_SIZE; // ≈ 0.286

interface Props {
  tempF: number;
  dabAlarmF: number;
  dunkAlarmF: number;
  sessionActive: boolean;
  useCelsius?: boolean;
  size?: number;
  scaleState?: 'full' | 'mini';
}

export function TempDial({
  tempF,
  dabAlarmF,
  dunkAlarmF,
  sessionActive,
  useCelsius = false,
  size = 310,
  scaleState = 'full',
}: Props) {
  const state = deriveState(tempF, dabAlarmF, dunkAlarmF, sessionActive);
  const pal = PALETTE[state];

  const displayTemp = useCelsius ? Math.round(((tempF - 32) * 5) / 9) : Math.round(tempF);
  const tempStr = String(displayTemp);
  const unitLabel = useCelsius ? 'C' : 'F';
  const targetMin = useCelsius ? Math.round(((dabAlarmF - 20 - 32) * 5) / 9) : dabAlarmF - 20;
  const targetMax = useCelsius ? Math.round(((dabAlarmF + 20 - 32) * 5) / 9) : dabAlarmF + 20;

  const MAX_TEMP = 700;
  const progress = Math.max(0, Math.min(1, tempF / MAX_TEMP));

  const r = size * 0.44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Progress arc animation
  const animProgress = useSharedValue(0);
  React.useEffect(() => {
    animProgress.value = withSpring(progress, { damping: 22, stiffness: 80, mass: 1 });
  }, [progress]);

  // Ring color animation
  const colorProgress = useSharedValue(STATE_INDICES[state] / 4);
  React.useEffect(() => {
    colorProgress.value = withTiming(STATE_INDICES[state] / 4, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [state]);

  const animatedArcProps = useAnimatedProps(() => ({
    strokeDasharray: `${animProgress.value * circumference} ${circumference}`,
    stroke: interpolateColor(colorProgress.value, RING_COLOR_STOPS, RING_COLORS),
  }));

  // Pulse for target/dunk states
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    const shouldPulse = state === 'target' || state === 'dunk';
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 400 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.5]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.1]) }],
  }));

  // Outer glow based on alert state
  const glowOpacity = useSharedValue(0);
  React.useEffect(() => {
    glowOpacity.value = withTiming(
      state === 'target' || state === 'dunk' ? 1 : 0,
      { duration: 700, easing: Easing.out(Easing.quad) },
    );
  }, [state]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.15 + glowOpacity.value * 0.35,
    shadowRadius: 20 + glowOpacity.value * 16,
    shadowColor: interpolateColor(colorProgress.value, RING_COLOR_STOPS, RING_COLORS),
  }));

  const numFontSize = tempStr.length >= 3 ? size * 0.30 : size * 0.36;
  const lensSize = size * 0.78;

  // ── Scale state spring (full ↔ mini) ──────────────────────────────────────
  // Uses animation.toggleSpring: { damping: 15, stiffness: 260, mass: 0.5 }
  // scaleProgress: 0 = full, 1 = mini
  const scaleProgress = useDerivedValue(() =>
    withSpring(scaleState === 'mini' ? 1 : 0, animation.toggleSpring),
  );

  const scaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(scaleProgress.value, [0, 1], [1, MINI_SCALE]);
    return { transform: [{ scale }] };
  });

  // Build tick marks: 24 total, major at multiples of 6
  const TICK_COUNT = 24;
  const ticks = React.useMemo(() => Array.from({ length: TICK_COUNT }, (_, i) => {
    const isMajor = i % 6 === 0;
    const deg = (i * 360) / TICK_COUNT;
    const rad = ((deg - 90) * Math.PI) / 180;
    const innerR = size * (isMajor ? 0.452 : 0.460);
    const outerR = size * 0.476;
    return {
      x1: cx + Math.cos(rad) * innerR,
      y1: cy + Math.sin(rad) * innerR,
      x2: cx + Math.cos(rad) * outerR,
      y2: cy + Math.sin(rad) * outerR,
      isMajor,
    };
  }), [size]);

  return (
    <Animated.View style={scaleStyle}>
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          shadowOffset: { width: 0, height: 0 },
          elevation: 16,
        },
        glowStyle,
      ]}
    >
      {/* Pulse ring behind dial */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: pal.ring,
          },
          pulseStyle,
        ]}
        pointerEvents="none"
      />

      {/* Outer ring background */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface1,
          shadowColor: colors.voidObsidian,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.5,
          shadowRadius: 32,
          elevation: 12,
        }}
      />

      {/* SVG: progress arc */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.bone100 + '0A'}
          strokeWidth={1}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedArcProps}
        />
      </Svg>

      {/* SVG: tick marks (no rotation) */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {ticks.map((tick, i) => (
          <Line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.isMajor ? colors.bone100 + '47' : colors.bone100 + '17'}
            strokeWidth={tick.isMajor ? 1 : 0.5}
          />
        ))}
      </Svg>

      {/* Inner lens */}
      <View
        style={{
          position: 'absolute',
          width: lensSize,
          height: lensSize,
          borderRadius: lensSize / 2,
          overflow: 'hidden',
          borderWidth: 0.5,
          borderColor: colors.bone100 + '0D',
          shadowColor: colors.voidObsidian,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.7,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={[pal.lensTop, pal.lensBottom]}
          start={{ x: 0.35, y: 0.2 }}
          end={{ x: 0.65, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,240,220,0.07)', 'rgba(255,240,220,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: lensSize / 2 }]}
        />
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '12%',
            right: '12%',
            height: 0.5,
            backgroundColor: 'rgba(255,240,220,0.08)',
          }}
        />
      </View>

      {/* Text readout */}
      <View style={{ alignItems: 'center', zIndex: 10 }} pointerEvents="none">
        <Text
          style={{
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 2.0,
            textTransform: 'uppercase',
            color: colors.bone100 + '80',
            marginBottom: 8,
          }}
        >
          {STATE_LABELS[state]}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text
            style={{
              fontFamily: 'GeistMono_300Light',
              fontSize: numFontSize,
              lineHeight: numFontSize * 0.95,
              fontWeight: '300',
              fontVariant: ['tabular-nums'],
              color: pal.text,
              letterSpacing: -numFontSize * 0.03,
            }}
          >
            {tempStr}
          </Text>
          <Text
            style={{
              fontFamily: 'GeistMono_400Regular',
              fontVariant: ['tabular-nums'],
              fontSize: 11,
              letterSpacing: 1.2,
              color: colors.bone100 + '80',
              marginLeft: 5,
              marginTop: 8,
            }}
          >
            {unitLabel}°
          </Text>
        </View>
        {state !== 'idle' && (
          <Text
            style={{
              fontFamily: 'GeistMono_400Regular',
              fontVariant: ['tabular-nums'],
              marginTop: 10,
              fontSize: 10,
              letterSpacing: 1.2,
              color: colors.bone100 + '66',
            }}
          >
            {targetMin}–{targetMax}°
          </Text>
        )}
      </View>
    </Animated.View>
    </Animated.View>
  );
}
