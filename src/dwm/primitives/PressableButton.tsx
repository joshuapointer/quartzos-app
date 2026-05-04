import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, springs, fontStack, radii } from '../tokens';

type Variant = 'primary' | 'ghost';

interface Props {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableButton({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  showArrow = false,
  fullWidth = true,
}: Props) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springs.squish);
  }, []);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.squish);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 - pressed.value * 0.12 },
      { scaleX: 1 + pressed.value * 0.04 },
    ],
    opacity: disabled ? 0.55 : 1,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pressed.value * 3 }],
  }));

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        animStyle,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[palette.accent, palette.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.pill }]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.ghostFill]} />
      )}
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
        {label}
      </Text>
      {showArrow && (
        <Animated.Text style={[styles.arrow, isPrimary ? styles.labelPrimary : styles.labelGhost, arrowStyle]}>
          {'›'}
        </Animated.Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: palette.shadowDeep,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  ghostFill: {
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: {
    fontFamily: fontStack.display,
    fontSize: 15,
    letterSpacing: -0.005 * 15,
  },
  labelPrimary: {
    color: '#FDF8F6',
    textShadowColor: `${palette.accentInk}59`,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  labelGhost: {
    color: palette.fg,
  },
  arrow: {
    fontSize: 18,
  },
});
