import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Half the screen width — used for the center bloom circle radius
const BLOOM_RADIUS = SCREEN_W / 2;

type MoltenBackgroundProps = {
  children?: React.ReactNode;
  /** 0–1 multiplier for haze opacity (default 1) */
  intensity?: number;
};

export function MoltenBackground({ children, intensity = 1 }: MoltenBackgroundProps) {
  // Slow drift shared value: 0 → 1 → 0 over ~30 seconds, gives a "breathing" quality
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  // Top-left cyan haze drifts ±20pt
  const cyanHazeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -20 + drift.value * 20 },
      { translateY: -20 + drift.value * 20 },
      { scale: 1.4 },
    ],
    opacity: intensity,
  }));

  // Bottom-right magenta haze drifts in opposite direction
  const magentaHazeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 20 - drift.value * 20 },
      { translateY: 20 - drift.value * 20 },
      { scale: 1.4 },
    ],
    opacity: intensity,
  }));

  // Center bloom has a gentle pulse
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: (0.6 + drift.value * 0.4) * intensity,
  }));

  return (
    <View style={styles.root}>
      {/* Base fill */}
      <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none" />

      {/* Center bloom — behind the hazes */}
      <Animated.View
        style={[styles.bloomContainer, bloomStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            // surfaceContainer 30% alpha → transparent
            'rgba(16,19,27,0.30)',
            'rgba(16,19,27,0)',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.bloomGradient}
        />
      </Animated.View>

      {/* Top-left cyan haze */}
      <Animated.View
        style={[styles.cyanHaze, cyanHazeStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            // prismCyan 5% alpha → transparent
            'rgba(58,205,240,0.05)',
            'rgba(58,205,240,0)',
          ]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bottom-right magenta haze */}
      <Animated.View
        style={[styles.magentaHaze, magentaHazeStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            // prismMagenta 5% alpha → transparent
            'rgba(227,112,211,0.05)',
            'rgba(227,112,211,0)',
          ]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Children layer */}
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background, // #060507
  },
  base: {
    backgroundColor: colors.background,
    zIndex: 0,
  },
  // Center bloom: a circle whose radius equals half the screen width
  bloomContainer: {
    position: 'absolute',
    width: BLOOM_RADIUS * 2,
    height: BLOOM_RADIUS * 2,
    borderRadius: 9999,
    top: SCREEN_H / 2 - BLOOM_RADIUS,
    left: SCREEN_W / 2 - BLOOM_RADIUS,
    overflow: 'hidden',
    zIndex: 1,
  },
  bloomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Top-left cyan haze: ~50% width × 35% height, top -5%, left -10%
  cyanHaze: {
    position: 'absolute',
    width: SCREEN_W * 0.5,
    height: SCREEN_H * 0.35,
    borderRadius: 9999,
    top: SCREEN_H * -0.05,
    left: SCREEN_W * -0.1,
    overflow: 'hidden',
    zIndex: 2,
  },
  // Bottom-right magenta haze: ~50% width × 35% height, bottom -5%, right -10%
  magentaHaze: {
    position: 'absolute',
    width: SCREEN_W * 0.5,
    height: SCREEN_H * 0.35,
    borderRadius: 9999,
    bottom: SCREEN_H * -0.05,
    right: SCREEN_W * -0.1,
    overflow: 'hidden',
    zIndex: 2,
  },
  children: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
});
