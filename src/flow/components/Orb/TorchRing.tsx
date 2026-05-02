import React, { memo, useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { THEME, TYPE } from '../../theme';
import { styles } from './styles';
import type { TorchRingProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TorchRingInner({
  size,
  heatProgress,
  heatTotalSeconds,
  reheat,
  label,
}: TorchRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 6;
  const r = size / 2 - stroke;
  const circumference = 2 * Math.PI * r;

  // Animated dashoffset — sweep clockwise from 12 o'clock.
  const progress = useSharedValue(heatProgress);

  useEffect(() => {
    progress.value = withTiming(heatProgress, {
      duration: 200,
      easing: Easing.linear,
    });
  }, [heatProgress, progress]);

  const animatedArcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const secondsLeft = Math.max(
    0,
    Math.ceil((1 - heatProgress) * heatTotalSeconds),
  );

  const gradId = useMemo(() => `torch-${reheat ? 'r' : 'n'}-${size}`, [reheat, size]);

  const ringHi = reheat ? THEME.danger.base : THEME.ember.bright;
  const ringLo = reheat ? THEME.danger.deep : THEME.ember.deep;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Soft halo — ember bloom behind the orb. */}
      <View
        pointerEvents="none"
        style={[
          styles.haloAbs,
          {
            shadowColor: ringHi,
          },
        ]}
      />

      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ringHi} stopOpacity="1" />
            <Stop offset="1" stopColor={ringLo} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* etched track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={THEME.navy[4]}
          strokeWidth={stroke}
          opacity={0.55}
        />

        {/* progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedArcProps}
        />
      </Svg>

      {/* Centered numeric + caption. */}
      <View pointerEvents="none" style={styles.centerStack}>
        <Text
          style={[
            styles.eyebrow,
            { color: ringHi, marginBottom: 6 },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.bigNumber,
            {
              fontSize: Math.round(size * 0.34),
              letterSpacing: -Math.round(size * 0.34) * 0.07,
              color: THEME.bone[100],
            },
          ]}
        >
          {secondsLeft}
        </Text>
        <Text style={[styles.monoCaption, { marginTop: 12 }]}>
          {`${Math.round(heatTotalSeconds)}s HEAT`}
        </Text>
      </View>
    </View>
  );
}

export const TorchRing = memo(TorchRingInner);
