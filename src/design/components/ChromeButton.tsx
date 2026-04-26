import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadow, animation } from '../tokens';

export type ChromeButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ChromeButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChromeButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  labelStyle,
  haptic = true,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, animation.pressSpring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.pressSpring);
  }, [scale]);

  const handlePress = useCallback(
    (_e: GestureResponderEvent) => {
      if (disabled || loading) return;
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onPress();
    },
    [disabled, loading, haptic, onPress],
  );

  const bgStyle =
    variant === 'primary'
      ? styles.bgPrimary
      : variant === 'secondary'
        ? styles.bgSecondary
        : styles.bgGhost;

  const borderStyle =
    variant === 'primary'
      ? styles.borderPrimary
      : variant === 'secondary'
        ? styles.borderSecondary
        : styles.borderGhost;

  const shadowStyle =
    variant === 'primary'
      ? styles.shadowPrimary
      : shadow.button;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.pressable,
        shadowStyle,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {/* Background layer */}
      <View style={[StyleSheet.absoluteFill, styles.bg, bgStyle]} />
      {/* Border overlay */}
      <View style={[StyleSheet.absoluteFill, styles.borderOverlay, borderStyle]} pointerEvents="none" />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.onSurface} />
        ) : (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.md,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  bg: {
    borderRadius: radius.md,
  },
  bgPrimary: {
    backgroundColor: 'rgba(207,193,255,0.3)',
  },
  bgSecondary: {
    backgroundColor: 'rgba(22,16,35,0.6)',
  },
  bgGhost: {
    backgroundColor: 'transparent',
  },
  borderOverlay: {
    borderRadius: radius.md,
    borderWidth: 1,
  },
  borderPrimary: {
    borderColor: 'rgba(204,189,255,0.35)',
  },
  borderSecondary: {
    borderColor: 'rgba(255,255,255,0.10)',
  },
  borderGhost: {
    borderColor: 'rgba(255,255,255,0.15)',
  },
  shadowPrimary: {
    shadowColor: '#b5a1ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
    color: colors.onSurface,
  },
});
