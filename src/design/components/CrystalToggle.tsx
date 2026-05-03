import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, gradients, radius, animation } from '../tokens';
import { useThemeColors } from '../ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const TRACK_W = 56;
const TRACK_H = 32;
const THUMB_SIZE = 26;
const PADDING = 3;

export function CrystalToggle({ value, onValueChange, disabled = false, style, accessibilityLabel }: Props) {
  const tc = useThemeColors();
  const progress = useSharedValue(value ? 1 : 0);
  const pressScale = useSharedValue(1);
  const pressScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, animation.toggleSpring);
  }, [value, progress]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onValueChange(!value);
  }, [disabled, onValueChange, value]);

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * (TRACK_W - THUMB_SIZE - PADDING * 2);
    return {
      transform: [{ translateX }],
    };
  });

  const trackTintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value * 0.65, { duration: 220 }),
  }));

  const thumbGlowStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [tc.glassBorder, tc.primaryContainer + 'A6'],
    ),
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { pressScale.value = withSpring(0.97, animation.pressSpring); }}
      onPressOut={() => { pressScale.value = withSpring(1, animation.pressSpring); }}
      disabled={disabled}
      style={[styles.wrap, disabled && styles.disabled, pressScaleStyle, style]}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={styles.track}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Base glass tint */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tc.glassFill }]} />
        {/* Amethyst tint overlay when active */}
        <Animated.View style={[StyleSheet.absoluteFill, trackTintStyle]}>
          <LinearGradient
            colors={[tc.primary + '80', tc.primaryContainer + '4D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        {/* Top gloss */}
        <LinearGradient
          colors={gradients.gloss}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { height: '55%' }]}
        />
        {/* Border */}
        <Animated.View style={[styles.trackBorder, borderStyle]} pointerEvents="none" />
      </View>
      {/* Thumb */}
      <Animated.View style={[styles.thumb, thumbStyle]}>
        {/* Amethyst glow halo when on */}
        <Animated.View style={[styles.glow, { backgroundColor: tc.primaryContainer }, thumbGlowStyle]} pointerEvents="none" />
        <LinearGradient
          colors={[tc.primaryContainer, tc.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.thumbFill}
        />
        {/* Specular highlight */}
        <View style={styles.spec} pointerEvents="none" />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: TRACK_W,
    height: TRACK_H,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  trackBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    overflow: 'visible',
    shadowColor: 'rgba(5,4,3,0.9)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  thumbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '99',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: (THUMB_SIZE + 8) / 2,
    shadowColor: colors.firedAmber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  spec: {
    position: 'absolute',
    top: 3,
    left: 5,
    width: 10,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.bone100 + 'D9',
  },
});
