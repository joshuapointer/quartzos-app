import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

interface Props {
  progress?: number; // 0..1
  torchOn?: number;  // 0..1
}

const SPARK_POSITIONS = [0.30, 0.55, 0.70, 0.22];
const SPARK_DURATIONS = [3200, 3600, 3000, 3800];
const SPARK_DELAYS    = [0,    800,  1600, 2400];

function Spark({ xFrac, duration, delay, torchOn, reduced }: {
  xFrac: number; duration: number; delay: number; torchOn: number; reduced: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [reduced, duration, delay]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const tx = interpolate(p, [0, 0.5, 1], [0, 8, -12]);
    const ty = interpolate(p, [0, 0.5, 1], [0, -300, -700]);
    const scale = interpolate(p, [0, 0.2, 1], [0.5, 0.9, 0.4]);
    const opacity = interpolate(p, [0, 0.2, 0.5, 1], [0, 1, 0.9, 0]) * torchOn;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: xFrac * SCREEN_W - 2,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: palette.accent,
          shadowColor: palette.accentDeep,
          shadowOpacity: 0.85,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export function HeatFillBg({ progress = 0, torchOn = 0 }: Props) {
  const reduced = useReducedMotion();

  const fillH = reduced ? progress * SCREEN_H : progress * SCREEN_H;
  const glowOpacity = reduced ? 0.18 + 0.82 * torchOn : undefined;

  const glowAnim = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      glowAnim.value = 0;
      return;
    }
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(glowAnim);
  }, [reduced]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? (glowOpacity ?? 0.18)
      : interpolate(glowAnim.value, [0, 1], [
          0.18 + 0.82 * torchOn * 0.9,
          0.18 + 0.82 * torchOn,
        ]),
    transform: reduced
      ? []
      : [
          { translateY: interpolate(glowAnim.value, [0, 1], [0, -6]) },
          { scale: interpolate(glowAnim.value, [0, 1], [1, 1.05]) },
        ],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]} pointerEvents="none">
      {/* Warm radial behind from bottom */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: SCREEN_H * 0.55,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', `${palette.warm}44`, `${palette.accent}55`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Rising fill — visual timer */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: fillH,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            `${palette.accent}00`,
            `${palette.accent}2E`,
            `${palette.warm}52`,
            `${palette.accentDeep}6B`,
          ]}
          locations={[0, 0.25, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Leading-edge glow line */}
        {torchOn > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              opacity: torchOn,
              backgroundColor: `${palette.accent}B2`,
              shadowColor: palette.accent,
              shadowOpacity: 0.55,
              shadowRadius: 7,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        )}
      </View>

      {/* Ember sparks */}
      {SPARK_POSITIONS.map((xFrac, i) => (
        <Spark
          key={i}
          xFrac={xFrac}
          duration={SPARK_DURATIONS[i]}
          delay={SPARK_DELAYS[i]}
          torchOn={torchOn}
          reduced={reduced}
        />
      ))}
    </View>
  );
}
