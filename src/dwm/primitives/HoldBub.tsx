import React, { ReactNode, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import { palette, springs } from '../tokens';
import { HintLabel } from './HintLabel';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOLD_DURATION = 720;
const RING_INSET = 18;
const STROKE_WIDTH = 5;

interface Props {
  onComplete: () => void;
  hintLabel: string;
  size: number;
  children: ReactNode;
  enabled?: boolean;
}

export function HoldBub({ onComplete, hintLabel, size, children, enabled = true }: Props) {
  const reduced = useReducedMotion();
  const holdProgress = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const squish = useSharedValue(1);

  const ringSize = size + RING_INSET * 2;
  const radius = ringSize / 2 - STROKE_WIDTH / 2;
  const circumference = 2 * Math.PI * radius;

  const fire = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // RNGH's LongPress fires onStart exactly once when minDuration is met.
  // Driving the fire from onStart (not a withTiming callback) is the standard
  // pattern; minDuration(0) on iOS makes UILongPressGestureRecognizer
  // BEGAN→ENDED in the same frame as touch-down, which silently kills the
  // hold visual.
  const gesture = useMemo(
    () => Gesture.LongPress()
      .minDuration(reduced ? 0 : HOLD_DURATION)
      .maxDistance(999)
      .shouldCancelWhenOutside(false)
      .onBegin(() => {
        'worklet';
        ringOpacity.value = withTiming(1, { duration: 150 });
        squish.value = withSpring(0.92, springs.squish);
        if (reduced) {
          holdProgress.value = 1;
        } else {
          holdProgress.value = withTiming(1, {
            duration: HOLD_DURATION,
            easing: Easing.linear,
          });
        }
      })
      .onStart(() => {
        'worklet';
        runOnJS(fire)();
      })
      .onFinalize((_, success) => {
        'worklet';
        if (!success) {
          holdProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
          ringOpacity.value = withTiming(0, { duration: 200 });
          squish.value = withSpring(1, springs.squish);
        } else {
          // completed — brief squish handoff then reset
          squish.value = withSpring(1.08, springs.squish, () => {
            squish.value = withSpring(1, springs.gentle);
          });
          holdProgress.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
          ringOpacity.value = withTiming(0, { duration: 400 });
        }
      }),
    [fire, reduced, holdProgress, ringOpacity, squish],
  );

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference * (1 - holdProgress.value);
    return {
      strokeDashoffset: offset,
      opacity: ringOpacity.value,
    };
  });

  const squishStyle = useAnimatedStyle(() => ({
    transform: [{ scale: squish.value }],
  }));

  const ringOpacityStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  if (!enabled) {
    return (
      <View style={{ width: size, height: size }}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SVG ring sits behind the child, sized to include the inset */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            top: -RING_INSET,
            left: -RING_INSET,
          },
          ringOpacityStyle,
        ]}
        pointerEvents="none"
      >
        <Svg width={ringSize} height={ringSize}>
          {/* Track ring */}
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            stroke={`${palette.border}88`}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress ring — rotated so it starts from top (12 o'clock) */}
          <AnimatedCircle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            stroke={palette.accent}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            // rotate -90deg so progress starts at 12 o'clock
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            animatedProps={animatedProps}
          />
        </Svg>
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width: size, height: size }, squishStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>

      <View style={styles.hint}>
        <HintLabel label={hintLabel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hint: {
    marginTop: 12,
    alignItems: 'center',
  },
});
