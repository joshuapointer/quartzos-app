import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../../src/design/tokens';

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const translateX = useSharedValue(value ? 16 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 16 : 0, { damping: 22, stiffness: 200, mass: 1 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
      activeOpacity={0.8}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <Animated.View style={[styles.toggleThumbWrap, thumbStyle]}>
        <LinearGradient
          colors={value ? [colors.bone100, '#ecceb9'] : ['#35271f', colors.surface3]}
          style={styles.toggleThumb}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleTrack: {
    width: 42,
    height: 25,
    borderRadius: 100,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: colors.firedAmber + '33',
    borderColor: colors.firedAmber + '4D',
  },
  toggleThumbWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
