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
import Animated from 'react-native-reanimated';
import { colors, radius, shadow } from '../tokens';
import { useThemeColors } from '../ThemeContext';
import { usePressScale } from '../hooks/usePressScale';

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
  const tc = useThemeColors();
  const press = usePressScale();

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

  const dynamicPrimaryStyles = variant === 'primary' ? {
    bg: { backgroundColor: tc.primary + '66' },
    border: { borderColor: tc.primary + '59' },
    shadow: { shadowColor: tc.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  } : null;

  const bgStyle =
    variant === 'primary'
      ? dynamicPrimaryStyles!.bg
      : variant === 'secondary'
        ? styles.bgSecondary
        : styles.bgGhost;

  const borderStyle =
    variant === 'primary'
      ? dynamicPrimaryStyles!.border
      : variant === 'secondary'
        ? styles.borderSecondary
        : styles.borderGhost;

  const shadowStyle =
    variant === 'primary'
      ? dynamicPrimaryStyles!.shadow
      : shadow.button;

  return (
    <Animated.View style={[press.animatedStyle, style]}>
    <Pressable
      onPress={handlePress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.pressable,
        shadowStyle,
        disabled && styles.disabled,
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
          <Text style={[styles.label, { color: tc.onSurface }, labelStyle]}>{label}</Text>
        )}
      </View>
    </Pressable>
    </Animated.View>
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
  borderSecondary: {
    borderColor: 'rgba(255,255,255,0.10)',
  },
  borderGhost: {
    borderColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
