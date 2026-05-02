import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { THEME } from '../theme';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  leadingGlyph?: ReactNode;
  trailingGlyph?: ReactNode;
  size?: 'lg' | 'md';
  testID?: string;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  leadingGlyph,
  trailingGlyph,
  size = 'lg',
  testID,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  function handlePressIn() {
    if (disabled || reducedMotion) return;
    scale.value = withSpring(0.97, { damping: 28, stiffness: 300 });
  }

  function handlePressOut() {
    if (disabled || reducedMotion) return;
    scale.value = withSpring(1.0, { damping: 28, stiffness: 300 });
  }

  const isLg = size === 'lg';

  return (
    <Animated.View style={[st.shadowWrapper, animStyle]}>
      <LinearGradient
        colors={[THEME.ember.bright, THEME.ember.deep]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={st.gradient}
      >
        <View style={st.highlight} />
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            st.pressable,
            isLg ? st.pressableLg : st.pressableMd,
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID={testID}
        >
          {leadingGlyph}
          <Text style={[st.label, isLg ? st.labelLg : st.labelMd]}>
            {label}
          </Text>
          {trailingGlyph}
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  shadowWrapper: {
    borderRadius: 9999,
    shadowColor: THEME.ember.base,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 32,
    shadowOpacity: 0.55,
    elevation: 10,
  },
  gradient: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    zIndex: 1,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pressableLg: {
    height: 56,
    paddingHorizontal: 48,
  },
  pressableMd: {
    height: 44,
    paddingHorizontal: 32,
  },
  label: {
    fontFamily: 'Geist_400Regular',
    color: THEME.navy[1],
    letterSpacing: 0.2,
  },
  labelLg: {
    fontSize: 14,
  },
  labelMd: {
    fontSize: 12,
  },
});
