import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect, G } from 'react-native-svg';
import { colors } from '../../tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Drift amount: ±3% of screen dimensions
const DRIFT_X = SCREEN_W * 0.03;
const DRIFT_Y = SCREEN_H * 0.03;

// Ellipse radii in userSpaceOnUse pixels, derived from the prototype's
// percentage stop positions (55%, 60%, 70% of the larger screen dimension).
const BASE = Math.max(SCREEN_W, SCREEN_H);
const CYAN_RX    = BASE * 0.55 * 0.7; // slightly wider than tall for ellipse
const CYAN_RY    = BASE * 0.55 * 0.5;
const MAGENTA_RX = BASE * 0.60 * 0.7;
const MAGENTA_RY = BASE * 0.60 * 0.5;
const BLOOM_RX   = BASE * 0.70 * 0.6;
const BLOOM_RY   = BASE * 0.70 * 0.5;

// Gradient center points in pixels
const CYAN_CX    = SCREEN_W * 0.28;
const CYAN_CY    = SCREEN_H * 0.18;
const MAGENTA_CX = SCREEN_W * 0.78;
const MAGENTA_CY = SCREEN_H * 0.85;
const BLOOM_CX   = SCREEN_W * 0.52;
const BLOOM_CY   = SCREEN_H * 0.50;

const AnimatedG = Animated.createAnimatedComponent(G);

type MoltenBackgroundProps = {
  children?: React.ReactNode;
  /** 0–1 multiplier for haze opacity (default 1) */
  intensity?: number;
};

export function MoltenBackground({ children, intensity = 1 }: MoltenBackgroundProps) {
  // Slow drift shared value: 0 → 1 → 0 over ~30 seconds
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cyan haze drifts +DRIFT in each direction over the cycle
  const cyanGProps = useAnimatedProps(() => ({
    translateX: -DRIFT_X + drift.value * DRIFT_X * 2,
    translateY: -DRIFT_Y + drift.value * DRIFT_Y * 2,
  }));

  // Magenta haze drifts in the opposite direction
  const magentaGProps = useAnimatedProps(() => ({
    translateX: DRIFT_X - drift.value * DRIFT_X * 2,
    translateY: DRIFT_Y - drift.value * DRIFT_Y * 2,
  }));

  return (
    <View style={styles.root}>
      {/* Full-screen SVG background — pointer events disabled */}
      <Svg
        width={SCREEN_W}
        height={SCREEN_H}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          {/* Cyan haze: oklch(0.14 0.05 220 / 0.40) */}
          <RadialGradient
            id="bg-cyan"
            cx={CYAN_CX}
            cy={CYAN_CY}
            rx={CYAN_RX}
            ry={CYAN_RY}
            fx={CYAN_CX}
            fy={CYAN_CY}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor={colors.bgHazeCyan} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.bgHazeCyan} stopOpacity={0} />
          </RadialGradient>

          {/* Magenta haze: oklch(0.13 0.06 320 / 0.35) */}
          <RadialGradient
            id="bg-magenta"
            cx={MAGENTA_CX}
            cy={MAGENTA_CY}
            rx={MAGENTA_RX}
            ry={MAGENTA_RY}
            fx={MAGENTA_CX}
            fy={MAGENTA_CY}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor={colors.bgHazeMagenta} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.bgHazeMagenta} stopOpacity={0} />
          </RadialGradient>

          {/* Center bloom: oklch(0.10 0.020 270 / 0.32) */}
          <RadialGradient
            id="bg-bloom"
            cx={BLOOM_CX}
            cy={BLOOM_CY}
            rx={BLOOM_RX}
            ry={BLOOM_RY}
            fx={BLOOM_CX}
            fy={BLOOM_CY}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor={colors.bgCenterBloom} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.bgCenterBloom} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Layer 1: Center bloom (behind hazes, no drift) */}
        <Rect
          x={0}
          y={0}
          width={SCREEN_W}
          height={SCREEN_H}
          fill="url(#bg-bloom)"
          opacity={intensity}
        />

        {/* Layer 2: Cyan haze — drifts +direction */}
        <AnimatedG animatedProps={cyanGProps}>
          <Rect
            x={0}
            y={0}
            width={SCREEN_W}
            height={SCREEN_H}
            fill="url(#bg-cyan)"
            opacity={intensity}
          />
        </AnimatedG>

        {/* Layer 3: Magenta haze — drifts −direction */}
        <AnimatedG animatedProps={magentaGProps}>
          <Rect
            x={0}
            y={0}
            width={SCREEN_W}
            height={SCREEN_H}
            fill="url(#bg-magenta)"
            opacity={intensity}
          />
        </AnimatedG>
      </Svg>

      {/* Children layer — above the SVG */}
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background, // #060507
  },
  children: {
    flex: 1,
    position: 'relative',
  },
});
