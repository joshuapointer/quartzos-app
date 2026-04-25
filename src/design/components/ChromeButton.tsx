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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients, radius, shadow, animation } from '../tokens';

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

  const fillColors =
    variant === 'primary'
      ? gradients.amber
      : variant === 'secondary'
        ? gradients.chrome
        : (['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const);

  const bezelColors =
    variant === 'ghost'
      ? (['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)'] as const)
      : ([colors.bezelLight, colors.bezelDark] as const);

  const textColor =
    variant === 'primary'
      ? colors.idleDeep
      : variant === 'secondary'
        ? colors.bezelDark
        : colors.textPrimary;

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
        shadow.button,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {/* Bezel layer */}
      <LinearGradient
        colors={bezelColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bezel}
      />
      {/* Fill layer */}
      <LinearGradient
        colors={fillColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fill}
      />
      {/* Top gloss layer */}
      <LinearGradient
        colors={gradients.gloss}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gloss}
      />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.label, { color: textColor }, labelStyle]}>{label}</Text>
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
  bezel: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
  },
  fill: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: radius.md - 1,
  },
  gloss: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    height: '50%',
    borderTopLeftRadius: radius.md - 1,
    borderTopRightRadius: radius.md - 1,
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
  },
});
