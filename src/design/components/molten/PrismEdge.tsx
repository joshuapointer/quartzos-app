import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { prism, animation } from '../../tokens';

interface PrismEdgeProps {
  radius?: number;
  strokeWidth?: number;
  opacity?: number;
  durationMs?: number;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function PrismEdge({
  radius: borderRadius = 18,
  strokeWidth = 0.75,
  opacity = 1,
  durationMs = animation.prismDriftMs,
}: PrismEdgeProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
  }, [durationMs, progress]);

  const animatedGradientProps = useAnimatedProps(() => {
    const angle = progress.value * 360;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Map unit circle to 0–1 coordinates (center 0.5, radius 0.5)
    const x1 = 0.5 + 0.5 * Math.cos(rad + Math.PI);
    const y1 = 0.5 + 0.5 * Math.sin(rad + Math.PI);
    const x2 = 0.5 + 0.5 * cos;
    const y2 = 0.5 + 0.5 * sin;
    return { x1: `${x1}`, y1: `${y1}`, x2: `${x2}`, y2: `${y2}` };
  });

  return (
    <Svg style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
      <Defs>
        <AnimatedLinearGradient
          id="prismGrad"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          animatedProps={animatedGradientProps}
        >
          <Stop offset="0%" stopColor={prism.gradient[0]} stopOpacity="1" />
          <Stop offset="50%" stopColor={prism.gradient[1]} stopOpacity="1" />
          <Stop offset="100%" stopColor={prism.gradient[2]} stopOpacity="1" />
        </AnimatedLinearGradient>
      </Defs>
      <Rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width="100%"
        height="100%"
        rx={borderRadius}
        ry={borderRadius}
        stroke="url(#prismGrad)"
        strokeWidth={strokeWidth}
        fill="none"
      />
    </Svg>
  );
}
