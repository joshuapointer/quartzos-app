import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  size: number;
  paused: boolean;
}

// Build a sine-wave SVG path for a given width/height/amplitude/frequency
function sinePath(w: number, h: number, amp: number, freq: number): string {
  const points: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = h * 0.5 + Math.sin((i / steps) * freq * Math.PI * 2) * amp;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  // Close down to bottom
  points.push(`L${w},${h} L0,${h} Z`);
  return points.join(' ');
}

export function Wave({ size, paused }: Props) {
  const waveH = size * 0.30;
  const svgW  = size * 1.2; // slightly wider than container so translateX doesn't expose edge

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(translateX);
      return;
    }
    const shift = size * 0.10;
    const easing = Easing.inOut(Easing.ease);
    translateX.value = withRepeat(
      withSequence(
        withTiming(-shift, { duration: 3000, easing }),
        withTiming(shift,  { duration: 3000, easing }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, [paused, size]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const path = sinePath(svgW, waveH, waveH * 0.25, 1.5);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: -(size * 0.1),
        width: size * 1.2,
        height: waveH,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ width: svgW, height: waveH }, animStyle]}>
        <Svg width={svgW} height={waveH} viewBox={`0 0 ${svgW} ${waveH}`}>
          <Defs>
            <LinearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%"   stopColor="#9BCFDC" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#9BCFDC" stopOpacity="0.20" />
            </LinearGradient>
          </Defs>
          <Path d={path} fill="url(#waveFill)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
