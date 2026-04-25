import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
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
      return 'rgba(140,180,255,0.7)';
    case 'HEATING_UP':
      return colors.activeAmber;
    case 'DAB_READY':
      return colors.activeGlow;
    case 'DUNK_READY':
      return '#6EE7F0';
    case 'COOLING':
      return 'rgba(212,106,11,0.55)';
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
  const state = useMemo(
    () => deriveState(tempF, dabAlarmF, dunkAlarmF, sessionActive),
    [tempF, dabAlarmF, dunkAlarmF, sessionActive],
  );

  const heatProgress = useSharedValue(0);
  const pulse = useSharedValue(0);

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

  const heatGlowStyle = useAnimatedStyle(() => ({
    opacity: heatProgress.value,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
  }));

  const displayTemp = useCelsius ? Math.round(((tempF - 32) * 5) / 9) : Math.round(tempF);
  const unit = useCelsius ? 'C' : 'F';
  const ringColor = ringColorFor(state);

  const bezelSize = size;
  const innerSize = size - 18;
  const sphereSize = size - 36;
  const ringSize = size + 8;

  return (
    <View style={[{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Pulse ring (absolute, behind orb) */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
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
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: ringColor,
          },
        ]}
        pointerEvents="none"
      />
      {/* Chrome bezel */}
      <View style={[styles.bezelWrap, shadow.orb, { width: bezelSize, height: bezelSize, borderRadius: bezelSize / 2 }]}>
        <LinearGradient
          colors={gradients.chrome}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: bezelSize / 2 }]}
        />
        {/* Inner dark gap */}
        <View
          style={[
            styles.innerGap,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
          ]}
        >
          {/* Glass sphere */}
          <View
            style={[
              styles.sphere,
              { width: sphereSize, height: sphereSize, borderRadius: sphereSize / 2 },
            ]}
          >
            <LinearGradient
              colors={[colors.idleLight, colors.idleMid, colors.idleDeep]}
              start={{ x: 0.25, y: 0.1 }}
              end={{ x: 0.75, y: 0.95 }}
              style={[StyleSheet.absoluteFill, { borderRadius: sphereSize / 2 }]}
            />
            {/* Heat glow core */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: sphereSize / 2, overflow: 'hidden' },
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
                { width: sphereSize, height: sphereSize * 0.55, borderTopLeftRadius: sphereSize / 2, borderTopRightRadius: sphereSize / 2 },
              ]}
              pointerEvents="none"
            />
            {/* Temperature readout */}
            <View style={styles.readout} pointerEvents="none">
              <Text style={styles.temp}>{displayTemp}</Text>
              <Text style={styles.unit}>°{unit}</Text>
            </View>
          </View>
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
  bezelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerGap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bezelDark,
    overflow: 'hidden',
  },
  sphere: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
  temp: {
    color: colors.textPrimary,
    fontSize: 84,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: -8,
  },
});
