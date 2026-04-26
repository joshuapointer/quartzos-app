import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, gradients, animation, shadow } from '../tokens';

export type OrbState = 'IDLE' | 'HEATING_UP' | 'DAB_READY' | 'DUNK_READY' | 'COOLING';

interface Props {
  tempF: number;
  dabAlarmF: number;
  dunkAlarmF: number;
  sessionActive: boolean;
  useCelsius?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const MIN_HEAT_F = 120;
const MAX_HEAT_F = 900;

function deriveState(
  tempF: number,
  dabAlarmF: number,
  dunkAlarmF: number,
  sessionActive: boolean,
): OrbState {
  if (!sessionActive && tempF < 200) return 'IDLE';
  if (sessionActive && tempF >= dabAlarmF && tempF < dunkAlarmF) return 'DAB_READY';
  if (sessionActive && tempF >= dunkAlarmF) return 'DUNK_READY';
  if (tempF > 250 && tempF < dabAlarmF) return 'HEATING_UP';
  if (tempF >= 200 && !sessionActive) return 'COOLING';
  return 'IDLE';
}

function ringColorFor(state: OrbState): string {
  switch (state) {
    case 'IDLE':
      return colors.heatIdle;
    case 'HEATING_UP':
      return colors.heatAmber;
    case 'DAB_READY':
      return colors.heatGlow;
    case 'DUNK_READY':
      return colors.heatCyan;
    case 'COOLING':
      return colors.heatCooling;
  }
}

function glowColorFor(state: OrbState): string {
  switch (state) {
    case 'IDLE':
      return '#b5a1ff';
    case 'HEATING_UP':
      return '#FFA93C';
    case 'DAB_READY':
      return '#FFD27A';
    case 'DUNK_READY':
      return '#5AD9FF';
    case 'COOLING':
      return '#D46A0B';
  }
}

export function TemperatureOrb({
  tempF,
  dabAlarmF,
  dunkAlarmF,
  sessionActive,
  useCelsius = false,
  size = 280,
  style,
}: Props) {
  const state = React.useMemo(
    () => deriveState(tempF, dabAlarmF, dunkAlarmF, sessionActive),
    [tempF, dabAlarmF, dunkAlarmF, sessionActive],
  );

  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const heatProgress = useSharedValue(0);
  const pulse = useSharedValue(0);
  const refractRotation1 = useSharedValue(0);
  const refractRotation2 = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    const normalized = Math.max(
      0,
      Math.min(1, (tempF - MIN_HEAT_F) / (MAX_HEAT_F - MIN_HEAT_F)),
    );
    heatProgress.value = withSpring(normalized, { damping: 22, stiffness: 120, mass: 0.8 });
  }, [tempF, heatProgress]);

  useEffect(() => {
    const shouldPulse = state === 'DAB_READY' || state === 'DUNK_READY';
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
      return;
    }
    pulse.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: animation.pulseDurationMs / 2, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: animation.pulseDurationMs / 2, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [state, pulse]);

  // Slow breathing animation for the ambient glow
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(breathe);
      breathe.value = 0;
      return;
    }
    breathe.value = 0;
    breathe.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reduceMotion, breathe]);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(refractRotation1);
      cancelAnimation(refractRotation2);
      return;
    }
    refractRotation1.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
    refractRotation2.value = withRepeat(
      withTiming(1, { duration: 28000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduceMotion, refractRotation1, refractRotation2]);

  const heatGlowStyle = useAnimatedStyle(() => ({
    opacity: heatProgress.value,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
  }));

  const refractRing1Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${45 + refractRotation1.value * 360}deg` },
    ],
  }));

  const refractRing2Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-12 + refractRotation2.value * 360}deg` },
    ],
  }));

  // Breathing ambient glow — shadow radius oscillates gently
  const ambientGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(breathe.value, [0, 1], [0.25, 0.5]),
    shadowRadius: interpolate(breathe.value, [0, 1], [40, 60]),
  }));

  const displayTemp = useCelsius ? Math.round(((tempF - 32) * 5) / 9) : Math.round(tempF);
  const unit = useCelsius ? '°C' : '°F';
  const ringColor = ringColorFor(state);
  const glowColor = glowColorFor(state);

  const containerSize = size + 8;
  const ring1Size = size + 48;
  const ring2Size = size + 96;

  return (
    <View
      style={[
        { width: ring2Size, height: ring2Size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {/* Refraction ring 2 (outermost) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: ring2Size,
            height: ring2Size,
            borderRadius: ring2Size / 2,
            borderWidth: 1,
            borderColor: 'rgba(181,161,255,0.06)',
            borderBottomColor: 'rgba(181,161,255,0.20)',
          },
          refractRing2Style,
        ]}
        pointerEvents="none"
      />

      {/* Refraction ring 1 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: ring1Size,
            height: ring1Size,
            borderRadius: ring1Size / 2,
            borderWidth: 1,
            borderColor: 'rgba(207,193,255,0.10)',
            borderTopColor: 'rgba(207,193,255,0.35)',
          },
          refractRing1Style,
        ]}
        pointerEvents="none"
      />

      {/* Pulse ring (absolute, behind orb) */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderColor: ringColor,
          },
          pulseRingStyle,
        ]}
        pointerEvents="none"
      />

      {/* State ring */}
      <View
        style={[
          styles.stateRing,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderColor: ringColor,
          },
        ]}
        pointerEvents="none"
      />

      {/* Orb sphere with ambient glow */}
      <Animated.View
        style={[
          styles.sphere,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            elevation: 24,
          },
          ambientGlowStyle,
        ]}
      >
        {/* Inner depth gradient — gives the sphere dimensionality */}
        <LinearGradient
          colors={['rgba(30,24,44,0.0)', 'rgba(18,12,31,0.6)']}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          pointerEvents="none"
        />

        {/* Inner amethyst glow approximation */}
        <View
          style={[
            styles.innerGlow,
            {
              top: 24,
              left: 24,
              right: 24,
              bottom: 24,
              borderRadius: (size - 48) / 2,
            },
          ]}
          pointerEvents="none"
        />

        {/* Heat glow core (warm amber — functional feedback) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2, overflow: 'hidden' },
            heatGlowStyle,
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={gradients.heatCore}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0.2 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Top gloss (specular highlight) */}
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.0)']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[
            styles.gloss,
            {
              width: size,
              height: size * 0.5,
              borderTopLeftRadius: size / 2,
              borderTopRightRadius: size / 2,
            },
          ]}
          pointerEvents="none"
        />

        {/* Temperature readout */}
        <View style={styles.readout} pointerEvents="none">
          <Text style={styles.label}>Current Temp</Text>
          <Text style={styles.temp}>{displayTemp}<Text style={styles.unit}>{unit}</Text></Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    borderWidth: 6,
  },
  stateRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  sphere: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(207,193,255,0.20)',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(207,193,255,0.06)',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  readout: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  temp: {
    color: colors.onSurface,
    fontSize: 88,
    lineHeight: 96,
    fontWeight: '200',
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  unit: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 0,
  },
});
