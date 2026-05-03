import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { Circle, G } from 'react-native-svg';
import { colors } from '../../../tokens';
import { MoltenPhase } from './STATES';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SPARK_COUNT = 8;
const SPARK_COLORS = [colors.prismCyan, colors.prismMagenta, colors.prismGold];

interface SparkProps {
  cx: number;
  cy: number;
  orbR: SharedValue<number>;
  particleIndex: number;
}

function Spark({ cx, cy, orbR, particleIndex }: SparkProps): React.ReactElement {
  const angle = (particleIndex / SPARK_COUNT) * Math.PI * 2;
  const flightFraction = 0.3 + (((particleIndex * 7) % 5) / 5) * 0.2; // 0.30–0.50 of orbR
  const staggerMs = (particleIndex / SPARK_COUNT) * 1200;
  const color = SPARK_COLORS[particleIndex % SPARK_COLORS.length];
  const r = 2 + (particleIndex % 2);

  const sparkX = useSharedValue(cx);
  const sparkY = useSharedValue(cy);
  const sparkOpacity = useSharedValue(0);

  // Spark is only mounted while phase === 'heating' (gated by Sparks parent),
  // so we always emit; no inactive branch is needed.
  useEffect(() => {
    const dx = Math.cos(angle) * orbR.value * flightFraction;
    const dy = Math.sin(angle) * orbR.value * flightFraction;
    const dur = 1200;

    sparkX.value = withDelay(
      staggerMs,
      withRepeat(
        withSequence(
          withTiming(cx + dx, { duration: dur }),
          withTiming(cx, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    sparkY.value = withDelay(
      staggerMs,
      withRepeat(
        withSequence(
          withTiming(cy + dy, { duration: dur }),
          withTiming(cy, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    sparkOpacity.value = withDelay(
      staggerMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur * 0.1 }),
          withTiming(0, { duration: dur * 0.9 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animProps = useAnimatedProps(() => ({
    cx: sparkX.value,
    cy: sparkY.value,
    opacity: sparkOpacity.value,
  }));

  return <AnimatedCircle animatedProps={animProps} r={r} fill={color} />;
}

interface SparksProps {
  cx: number;
  cy: number;
  orbR: SharedValue<number>;
  phase: MoltenPhase;
}

export default function Sparks({ cx, cy, orbR, phase }: SparksProps): React.ReactElement | null {
  if (phase !== 'heating') return null;
  return (
    <G>
      {Array.from({ length: SPARK_COUNT }, (_, i) => (
        <Spark
          key={`spark-${i}`}
          cx={cx}
          cy={cy}
          orbR={orbR}
          particleIndex={i}
        />
      ))}
    </G>
  );
}
