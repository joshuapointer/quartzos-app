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
      withTiming(1, { duration: 20000, easing: Easing.linear }),
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

  const displayTemp = useCelsius ? Math.round(((tempF - 32) * 5) / 9) : Math.round(tempF);
  const displayTarget = useCelsius ? Math.round(((dabAlarmF - 32) * 5) / 9) : Math.round(dabAlarmF);
  const unit = useCelsius ? 'C' : 'F';
  const ringColor = ringColorFor(state);

  const containerSize = size + 8;
  const ring1Size = size + 40;
  const ring2Size = size + 80;

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
            borderColor: 'rgba(181,161,255,0.08)',
            borderBottomColor: 'rgba(181,161,255,0.25)',
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
            borderColor: 'rgba(207,193,255,0.15)',
            borderTopColor: 'rgba(207,193,255,0.45)',
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

      {/* Orb sphere */}
      <View
        style={[
          styles.sphere,
          shadow.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Inner amethyst glow approximation */}
        <View
          style={[
            styles.innerGlow,
            {
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              borderRadius: (size - 40) / 2,
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

        {/* Top gloss (specular) */}
        <LinearGradient
          colors={gradients.gloss}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 0.9 }}
          style={[
            styles.gloss,
            {
              width: size,
              height: size * 0.55,
              borderTopLeftRadius: size / 2,
              borderTopRightRadius: size / 2,
            },
          ]}
          pointerEvents="none"
        />

        {/* Temperature readout */}
        <View style={styles.readout} pointerEvents="none">
          <Text style={styles.label}>Current Temp</Text>
          <View style={styles.tempRow}>
            <Text style={styles.temp}>{displayTemp}</Text>
            <Text style={styles.unit}>°{unit}</Text>
          </View>
          <Text style={styles.target}>Target: {displayTarget}°</Text>
        </View>
      </View>
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
    borderColor: 'rgba(207,193,255,0.25)',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(207,193,255,0.08)',
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
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to start (top) so the baseline difference is handled by padding/margins, or we can keep flex-end if lineHeight is set properly
  },
  temp: {
    color: colors.onSurface,
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  unit: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12, // Since we changed to flex-start, we add top margin to push it down
    marginLeft: 2,
  },
  target: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 4,
  },
});
