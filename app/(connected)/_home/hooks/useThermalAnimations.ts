import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

export function useThermalAnimations(tempF: number, dabAlarmF: number): {
  thermalPulse: SharedValue<number>;
  thermalHot: SharedValue<number>;
} {
  const thermalPulse = useSharedValue(0);
  const thermalHot = useSharedValue(0);

  useEffect(() => {
    thermalPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(thermalPulse); };
  }, [thermalPulse]);

  useEffect(() => {
    const isNear = tempF >= dabAlarmF - 20 && tempF <= dabAlarmF + 40;
    thermalHot.value = withTiming(isNear ? 1 : 0, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [tempF, dabAlarmF, thermalHot]);

  return { thermalPulse, thermalHot };
}
