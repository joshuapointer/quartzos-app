import React, { useEffect } from 'react';
import { StyleSheet, AccessibilityInfo, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, gradients, animation, SCREEN_W, SCREEN_H } from '../tokens';

interface Props {
  children?: React.ReactNode;
}

export function QuartzBackground({ children }: Props) {
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: animation.shimmerDurationMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [reduceMotion, progress]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-SCREEN_W, SCREEN_W]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.07, 0]);
    return {
      transform: [{ translateX }, { rotate: '18deg' }],
      opacity,
    };
  });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <LinearGradient
        colors={gradients.background}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.9)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.idleDeep,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: -SCREEN_H * 0.2,
    left: 0,
    width: SCREEN_W * 0.6,
    height: SCREEN_H * 1.4,
  },
});
