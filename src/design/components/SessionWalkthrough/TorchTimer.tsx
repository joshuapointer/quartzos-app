import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { colors } from '../../tokens';
import { RING_RADIUS, RING_STROKE, RING_CIRCUMFERENCE } from './constants';
import { FlameIcon } from './StepIcons';
import { styles } from './styles';
import type { TorchTimerProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

export function TorchTimer({ durationSeconds, onComplete, onElapsedChange }: TorchTimerProps) {
  const progress = useSharedValue(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);
  const onElapsedChangeRef = useRef(onElapsedChange);
  onElapsedChangeRef.current = onElapsedChange;

  const advanceStep = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    startedAt.current = Date.now();

    progress.value = withTiming(1, {
      duration: durationSeconds * 1000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(advanceStep)();
      }
    });

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const rem = Math.max(0, Math.ceil(durationSeconds - elapsed));
      setRemaining(rem);
      onElapsedChangeRef.current?.(elapsed);
      if (rem === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 250);

    return () => {
      cancelAnimation(progress);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animatedRingProps = useAnimatedProps(() => {
    const offset = RING_CIRCUMFERENCE * (1 - progress.value);
    return { strokeDashoffset: offset };
  });

  const ringColorStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + progress.value * 0.4,
  }));

  const secondsDisplay = remaining;
  const minsDisplay = Math.floor(secondsDisplay / 60);
  const secsDisplay = secondsDisplay % 60;
  const timeLabel = minsDisplay > 0
    ? `${minsDisplay}:${String(secsDisplay).padStart(2, '0')}`
    : `${secsDisplay}`;

  return (
    <View style={styles.timerContainer}>
      {/* Background ring glow */}
      <Animated.View style={[styles.timerGlow, ringColorStyle]} />

      <Svg width={RING_RADIUS * 2 + 40} height={RING_RADIUS * 2 + 40} style={styles.timerSvg}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.emberBright} stopOpacity={0.3} />
            <Stop offset="50%" stopColor={colors.emberBright} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={colors.ember} stopOpacity={0.05} />
          </SvgGradient>
          <SvgGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.emberBright} />
            <Stop offset="100%" stopColor={colors.emberBright} />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <SvgCircle
          cx={RING_RADIUS + 20}
          cy={RING_RADIUS + 20}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.bone100 + '0F'}
          strokeWidth={RING_STROKE}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={RING_RADIUS + 20}
          cy={RING_RADIUS + 20}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.emberBright}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeLinecap="round"
          animatedProps={animatedRingProps}
          transform={`rotate(-90, ${RING_RADIUS + 20}, ${RING_RADIUS + 20})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.timerCenter}>
        <FlameIcon size={52} />
        <Text style={styles.timerCountdown}>{timeLabel}</Text>
        <Text style={styles.timerLabel}>SECONDS</Text>
      </View>
    </View>
  );
}
