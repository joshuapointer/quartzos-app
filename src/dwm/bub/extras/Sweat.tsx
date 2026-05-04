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

const DROP_DEFS = [
  { leftFrac: 0.18, topFrac: 0.22, delay: 0    },
  { leftFrac: 0.82, topFrac: 0.28, delay: 1200 },
];

const LOOP_DUR = 1600;

function Drop({ leftFrac, topFrac, delay, size, paused }: {
  leftFrac: number; topFrac: number; delay: number; size: number; paused: boolean;
}) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.6);

  useEffect(() => {
    if (paused) {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
      return;
    }
    const easing = Easing.in(Easing.ease);
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,  { duration: 0 }),
        withTiming(30, { duration: LOOP_DUR, easing }),
      ),
      -1,
      false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(0,   { duration: LOOP_DUR * 0.05 }),
        withTiming(0.6, { duration: LOOP_DUR * 0.15 }),
        withTiming(0.6, { duration: LOOP_DUR * 0.60 }),
        withTiming(0,   { duration: LOOP_DUR * 0.20 }),
      ),
      -1,
      false,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(1.0, { duration: LOOP_DUR * 0.20 }),
        withTiming(1.0, { duration: LOOP_DUR * 0.60 }),
        withTiming(0.7, { duration: LOOP_DUR * 0.20 }),
      ),
      -1,
      false,
    ));
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [paused, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  // Drop shape: 9×14px teardrop
  const dropW = 9;
  const dropH = 14;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top:  size * topFrac,
          left: size * leftFrac - dropW / 2,
          width:  dropW,
          height: dropH,
          borderRadius: dropW / 2,
          // Teardrop: round on top, pointed at bottom via border radii
          borderTopLeftRadius:     dropW / 2,
          borderTopRightRadius:    dropW / 2,
          borderBottomLeftRadius:  dropW * 0.4,
          borderBottomRightRadius: dropW * 0.4,
          backgroundColor: 'rgba(100,170,210,0.9)',
        },
        animStyle,
      ]}
    >
      {/* Inner highlight */}
      <View
        style={{
          position: 'absolute',
          top:  2,
          left: 2,
          width:  3,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.85)',
        }}
      />
    </Animated.View>
  );
}

export function Sweat({ size, paused }: Props) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {DROP_DEFS.map((d, i) => (
        <Drop
          key={i}
          leftFrac={d.leftFrac}
          topFrac={d.topFrac}
          delay={d.delay}
          size={size}
          paused={paused}
        />
      ))}
    </View>
  );
}
