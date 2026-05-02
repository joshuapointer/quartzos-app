import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated';

import { colors } from '../../tokens';
import { useBleStore } from '../../../state/bleStore';
import { formatTemp } from '../../../utils/temperature';
import { styles } from './styles';

export function LiveTempBadge({ dabAlarmF, useCelsius }: { dabAlarmF: number; useCelsius: boolean }) {
  const tempF = useBleStore((s) => s.liveTempF) ?? 72;
  const diff = tempF - dabAlarmF;

  const isClose = Math.abs(diff) <= 15;
  const isAtTarget = Math.abs(diff) <= 5;
  const isTooHot = diff > 5;

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isClose) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isClose]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const accentColor = isAtTarget ? colors.success : isClose ? colors.emberBright : isTooHot ? colors.ember : colors.quartzBright;

  return (
    <Animated.View style={[styles.liveTempBadge, { borderColor: accentColor + '44' }, pulseStyle]}>
      <Text style={[styles.liveTempValue, { color: accentColor }]}>
        {formatTemp(tempF, useCelsius)}
      </Text>
      <Text style={styles.liveTempSub}>
        {isAtTarget ? 'AT TARGET' : isClose ? 'NEARLY THERE' : isTooHot ? 'COOLING DOWN' : 'LIVE TEMP'}
      </Text>
    </Animated.View>
  );
}
