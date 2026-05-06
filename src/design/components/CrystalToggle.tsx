import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, radius, animation } from '../tokens';
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
    opacity: withTiming(progress.value, { duration: 120 }),
  }));

  const thumbGlowStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [tc.glassBorder, colors.firedAmber],
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
        {/* Matte base — no BlurView in shatterbox register */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tc.glassFill }]} />
        {/* Solid amber tint when active — replaces the dual-stop chromatic gradient */}
        <Animated.View style={[StyleSheet.absoluteFill, trackTintStyle, { backgroundColor: colors.primaryContainer }]} />
        {/* Border */}
        <Animated.View style={[styles.trackBorder, borderStyle]} pointerEvents="none" />
      </View>
      {/* Thumb */}
      <Animated.View style={[styles.thumb, thumbStyle]}>
        {/* Amber glow halo when on — single accent, replaces the prism halo */}
        <Animated.View style={[styles.glow, { backgroundColor: colors.firedAmber }, thumbGlowStyle]} pointerEvents="none" />
        <View style={[styles.thumbFill, { backgroundColor: colors.firedAmber }]} />
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
  // Engraved geometry — chip 2px, not the legacy 999px pill
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  thumbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 0.5,
    borderColor: colors.bone20,
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
});
