import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/design/hooks/usePressScale';
import { THEME } from '../theme';

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
  const press = usePressScale();
  const isLg = size === 'lg';

  return (
    <Animated.View
      style={[
        st.shadowWrapper,
        press.animatedStyle,
        disabled && st.disabled,
      ]}
    >
      <View style={st.fill}>
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={disabled ? undefined : press.onPressIn}
          onPressOut={disabled ? undefined : press.onPressOut}
          style={[st.pressable, isLg ? st.pressableLg : st.pressableMd]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID={testID}
        >
          {leadingGlyph}
          <Text style={st.label}>{label}</Text>
          {trailingGlyph}
        </Pressable>
      </View>
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
  disabled: {
    opacity: 0.5,
  },
  fill: {
    borderRadius: 9999,
    backgroundColor: THEME.ember.base,
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pressableLg: {
    height: 56,
    paddingHorizontal: 40,
  },
  pressableMd: {
    height: 44,
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: THEME.navy[1],
  },
});
