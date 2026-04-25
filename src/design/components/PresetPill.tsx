import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColors } from '../ThemeContext';
import { animation } from '../tokens';

interface PresetPillProps {
  presetName: string;
  gemColor: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetPill({ presetName, gemColor, onPress, style }: PresetPillProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, animation.pressSpring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.pressSpring);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      style={[animatedStyle, style]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.glassFill, borderColor: colors.glassBorder },
        ]}
      >
        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.borderOverlay, { borderColor: colors.glassBorder }]} pointerEvents="none" />

        {/* Left: gem dot */}
        <View style={[styles.gemDot, { backgroundColor: gemColor }]} />

        {/* Center: label + name stack */}
        <View style={styles.nameStack}>
          <Text style={[styles.presetLabel, { color: colors.onSurfaceVariant }]}>PRESET</Text>
          <Text style={[styles.presetName, { color: colors.onSurface }]} numberOfLines={1}>
            {presetName}
          </Text>
        </View>

        {/* Right: Change + chevron */}
        <View style={styles.changeSection}>
          <Text style={[styles.changeText, { color: colors.outline }]}>Change</Text>
          <MaterialIcons name="chevron-right" size={14} color={colors.outline} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
  },
  gemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  nameStack: {
    flex: 1,
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  changeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  changeText: {
    fontSize: 11,
    marginRight: 2,
  },
});
