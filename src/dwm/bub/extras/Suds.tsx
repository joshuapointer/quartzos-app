import React, { useEffect } from 'react';
import { View } from 'react-native';
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

const BLOB_DEFS = [
  { top: 0,  left: 10, diameter: 14, delay: 0    },
  { top: 14, left: 0,  diameter: 10, delay: 500  },
  { top: 24, left: 18, diameter: 18, delay: 1000 },
  { top: 34, left: 4,  diameter: 8,  delay: 1500 },
  { top: 8,  left: 28, diameter: 11, delay: 750  },
];

const LOOP_DUR = 1400;

function Blob({ top, left, diameter, delay, paused }: {
  top: number; left: number; diameter: number; delay: number; paused: boolean;
}) {
  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate  = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rotate);
      return;
    }
    const easing = Easing.out(Easing.ease);
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(1,   { duration: LOOP_DUR * 0.25, easing }),
        withTiming(1.1, { duration: LOOP_DUR * 0.50 }),
        withTiming(0,   { duration: LOOP_DUR * 0.25 }),
      ),
      -1,
      false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: LOOP_DUR * 0.20 }),
        withTiming(1, { duration: LOOP_DUR * 0.55 }),
        withTiming(0, { duration: LOOP_DUR * 0.25 }),
      ),
      -1,
      false,
    ));
    // Slight rotation jitter for character
    rotate.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,  { duration: 0 }),
        withTiming(12, { duration: LOOP_DUR * 0.40 }),
        withTiming(-6, { duration: LOOP_DUR * 0.60 }),
      ),
      -1,
      false,
    ));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(rotate);
    };
  }, [paused, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width:        diameter,
          height:       diameter,
          borderRadius: diameter / 2,
          backgroundColor: 'rgba(245,252,250,0.95)',
          borderWidth:  1.5,
          borderColor:  'rgba(180,220,210,0.7)',
        },
        animStyle,
      ]}
    />
  );
}

export function Suds({ size, paused }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top:   size * 0.45,
        right: -(size * 0.08),
        width:  50,
        height: 50,
      }}
    >
      {BLOB_DEFS.map((b, i) => (
        <Blob
          key={i}
          top={b.top}
          left={b.left}
          diameter={b.diameter}
          delay={b.delay}
          paused={paused}
        />
      ))}
    </View>
  );
}
