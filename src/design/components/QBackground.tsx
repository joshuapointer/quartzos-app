import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../tokens';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function QBackground() {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const warmStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + breathe.value * 0.2,
  }));

  const coolStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + (1 - breathe.value) * 0.18,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.voidObsidian }]} />
      <Animated.View style={[StyleSheet.absoluteFill, warmStyle]}>
        <LinearGradient
          colors={['rgba(42,22,6,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, coolStyle]}>
        <LinearGradient
          colors={['rgba(14,26,40,0.45)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
