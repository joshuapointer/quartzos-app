import React, { useCallback } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { palette, springs, fontStack } from '../tokens';

interface Props {
  label?: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BackChip({ label = 'back', onPress }: Props) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springs.squish);
  }, []);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.squish);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -2 * pressed.value },
      { scaleY: 1 - pressed.value * 0.15 },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.row, animStyle]}
      hitSlop={10}
    >
      <View style={styles.icon}>
        <Svg width={10} height={10} viewBox="0 0 12 12">
          <Path
            d="M7.5 2L4 6l3.5 4"
            stroke={palette.muted}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 4,
    marginBottom: 6,
  },
  icon: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.18 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
});
