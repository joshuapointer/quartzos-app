import React, { useEffect } from 'react';
import { StyleSheet, AccessibilityInfo, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { SCREEN_W, SCREEN_H } from '../tokens';

interface Props {
  children?: React.ReactNode;
}

export function QuartzBackground({ children }: Props) {
  const scale = useSharedValue(1);
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
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = 0.95;
    scale.value = withRepeat(
      withTiming(1.05, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reduceMotion, scale]);

  const blobAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Aura layer — no pointer events */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.blobTopLeft, blobAnimStyle]} />
        <Animated.View style={[styles.blobBottomRight, blobAnimStyle]} />
      </View>
      {children}
    </View>
  );
}

const BLOB_TL_W = SCREEN_W * 0.6;
const BLOB_TL_H = SCREEN_W * 0.6;
const BLOB_BR_W = SCREEN_W * 0.7;
const BLOB_BR_H = SCREEN_W * 0.7;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#120C1F',
    overflow: 'hidden',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -SCREEN_H * 0.1,
    left: -SCREEN_W * 0.1,
    width: BLOB_TL_W,
    height: BLOB_TL_H,
    borderRadius: BLOB_TL_W / 2,
    backgroundColor: 'rgba(100,80,200,0.15)',
    shadowColor: 'rgba(100,80,200,0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -SCREEN_H * 0.1,
    right: -SCREEN_W * 0.1,
    width: BLOB_BR_W,
    height: BLOB_BR_H,
    borderRadius: BLOB_BR_W / 2,
    backgroundColor: 'rgba(90,60,93,0.12)',
    shadowColor: 'rgba(90,60,93,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
});
