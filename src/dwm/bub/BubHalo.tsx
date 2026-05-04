import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { Mood } from './types';

interface Props {
  size: number;
  // `mood` preserved on the API for back-compat. Halo colour is unified
  // amber-glass per shatterbox spec — the orb does not modulate per phase.
  mood: Mood;
  paused: boolean;
}

const OUTSET = 28;
const HALO_HEX = '#f5a44a';
const HALO_ALPHA = 0.55;

export function BubHalo({ size, paused }: Props) {
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    if (paused) {
      cancelAnimation(opacity);
      return;
    }
    const dur = 4500; // matches body wobble per spec
    const easing = Easing.inOut(Easing.ease);
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: dur / 2, easing }),
        withTiming(0.7, { duration: dur / 2, easing }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [paused]);

  const haloSize = size + OUTSET * 2;
  const cx = haloSize / 2;
  const cy = haloSize / 2;

  // Spec: no scaling on the orb. Halo only modulates opacity.
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: haloSize,
          height: haloSize,
          marginLeft: -OUTSET,
          marginTop: -OUTSET,
        },
        animStyle,
      ]}
    >
      <View pointerEvents="none" style={{ width: haloSize, height: haloSize }}>
        <Svg width={haloSize} height={haloSize}>
          <Defs>
            <RadialGradient id="bubHaloGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor={HALO_HEX} stopOpacity={HALO_ALPHA} />
              <Stop offset="100%" stopColor={HALO_HEX} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill="url(#bubHaloGrad)" />
        </Svg>
      </View>
    </Animated.View>
  );
}
