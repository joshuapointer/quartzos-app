import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { palette } from '../../tokens';

interface Props {
  size: number;
  paused: boolean;
}

// 4-pointed star path centered at origin
function starPath(r: number): string {
  const inner = r * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    const x = (radius * Math.cos(angle)).toFixed(2);
    const y = (radius * Math.sin(angle)).toFixed(2);
    pts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
  }
  return pts.join(' ') + ' Z';
}

// Positions relative to bub center (as fraction of size, can be negative = outside)
const POSITIONS = [
  { topFrac: -0.10, leftFrac: -0.08, r: 7,  delay: 0    },
  { topFrac: -0.15, leftFrac:  0.86, r: 6,  delay: 600  },
  { topFrac:  0.72, leftFrac: -0.12, r: 5,  delay: 1200 },
  { topFrac:  0.78, leftFrac:  0.82, r: 8,  delay: 1800 },
];

const LOOP_DUR = 3000;

function Sparkle({ top, left, r, delay, paused }: {
  top: number; left: number; r: number; delay: number; paused: boolean;
}) {
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.4);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(translateY);
      return;
    }
    const easing = Easing.inOut(Easing.ease);
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(1,   { duration: LOOP_DUR * 0.30, easing }),
        withTiming(1,   { duration: LOOP_DUR * 0.20 }),
        withTiming(0,   { duration: LOOP_DUR * 0.50, easing }),
      ),
      -1,
      false,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(1.0, { duration: LOOP_DUR * 0.30, easing }),
        withTiming(1.0, { duration: LOOP_DUR * 0.20 }),
        withTiming(0.4, { duration: LOOP_DUR * 0.50, easing }),
      ),
      -1,
      false,
    ));
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(-10, { duration: LOOP_DUR * 0.50, easing }),
        withTiming(0,   { duration: LOOP_DUR * 0.50, easing }),
      ),
      -1,
      false,
    ));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(translateY);
    };
  }, [paused, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const boxSize = r * 2 + 4;
  const path = starPath(r);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          width:  boxSize,
          height: boxSize,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animStyle,
      ]}
    >
      <Svg width={boxSize} height={boxSize} viewBox={`${-r - 2} ${-r - 2} ${boxSize} ${boxSize}`}>
        <Path d={path} fill={palette.accent} />
      </Svg>
    </Animated.View>
  );
}

export function Sparkles({ size, paused }: Props) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top:    -size * 0.18,
        left:   -size * 0.18,
        width:   size * 1.36,
        height:  size * 1.36,
      }}
    >
      {POSITIONS.map((p, i) => (
        <Sparkle
          key={i}
          top={size * 1.36 * (p.topFrac  + 0.18) / 1.36 * 1.36}
          left={size * 1.36 * (p.leftFrac + 0.18) / 1.36 * 1.36}
          r={p.r}
          delay={p.delay}
          paused={paused}
        />
      ))}
    </View>
  );
}
