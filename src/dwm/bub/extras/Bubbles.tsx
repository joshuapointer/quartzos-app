import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  size: number;
  paused: boolean;
}

const BUBBLE_DEFS = [
  { leftFrac: 0.20, diameter: 12, delay: 0    },
  { leftFrac: 0.42, diameter: 7,  delay: 600  },
  { leftFrac: 0.62, diameter: 10, delay: 1200 },
  { leftFrac: 0.78, diameter: 6,  delay: 1800 },
];

const LOOP_DUR = 2400;

function Bubble({ leftFrac, diameter, delay, containerSize, paused }: {
  leftFrac: number;
  diameter: number;
  delay: number;
  containerSize: number;
  paused: boolean;
}) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      return;
    }
    const easing = Easing.out(Easing.ease);
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,                       { duration: 0 }),
        withTiming(-containerSize * 0.60,   { duration: LOOP_DUR, easing }),
      ),
      -1,
      false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(0.7, { duration: LOOP_DUR * 0.15 }),
        withTiming(0.7, { duration: LOOP_DUR * 0.65 }),
        withTiming(0,   { duration: LOOP_DUR * 0.20 }),
      ),
      -1,
      false,
    ));
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [paused, delay, containerSize]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const left = containerSize * leftFrac - diameter / 2;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: containerSize * 0.06,
          left,
          width:  diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: 'rgba(220,240,255,0.85)',
          borderWidth: 1.2,
          borderColor: 'rgba(120,180,220,0.7)',
        },
        animStyle,
      ]}
    >
      {/* Inner highlight */}
      <View
        style={{
          position: 'absolute',
          top: diameter * 0.12,
          left: diameter * 0.18,
          width:  diameter * 0.32,
          height: diameter * 0.32,
          borderRadius: diameter * 0.16,
          backgroundColor: 'rgba(255,255,255,0.95)',
        }}
      />
    </Animated.View>
  );
}

export function Bubbles({ size, paused }: Props) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {BUBBLE_DEFS.map((b, i) => (
        <Bubble
          key={i}
          leftFrac={b.leftFrac}
          diameter={b.diameter}
          delay={b.delay}
          containerSize={size}
          paused={paused}
        />
      ))}
    </View>
  );
}
