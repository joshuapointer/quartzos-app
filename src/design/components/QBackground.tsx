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

  // White radial — peaks at ~10% opacity, never higher
  const whiteStyle = useAnimatedStyle(() => ({
    opacity: 0.04 + breathe.value * 0.06,
  }));

  // Cyan radial — peaks at ~8% opacity, opposite phase
  const cyanStyle = useAnimatedStyle(() => ({
    opacity: 0.03 + (1 - breathe.value) * 0.05,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.voidObsidian }]} />
      <Animated.View style={[StyleSheet.absoluteFill, whiteStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, cyanStyle]}>
        <LinearGradient
          colors={['rgba(0,168,255,0.45)', 'transparent']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
