import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors, gradients, radius, animation } from '../tokens';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (v: number) => void;
  label?: string;
  unit?: string;
  hapticStep?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary';
}

const THUMB = 32;
const TRACK_H = 14;

export function SkeuSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  label,
  unit,
  hapticStep,
  disabled = false,
  style,
  accessibilityLabel,
  variant = 'primary',
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const position = useSharedValue(0);
  const startPosition = useSharedValue(0);
  const lastHapticUnit = useSharedValue(Math.floor(value / (hapticStep ?? step)));

  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max]);

  const valueToPosition = useCallback(
    (v: number, w: number) => {
      if (max === min || w === 0) return 0;
      return ((clamp(v) - min) / (max - min)) * w;
    },
    [min, max, clamp],
  );

  const positionToValue = useCallback(
    (p: number, w: number) => {
      if (w === 0) return min;
      const raw = min + (p / w) * (max - min);
      const stepped = Math.round(raw / step) * step;
      return clamp(stepped);
    },
    [min, max, step, clamp],
  );

  useEffect(() => {
    if (trackWidth > 0) {
      position.value = withSpring(valueToPosition(value, trackWidth), animation.thumbSpring);
    }
  }, [value, trackWidth, position, valueToPosition]);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
  }, []);

  const commitValue = useCallback(
    (p: number) => {
      const v = positionToValue(p, trackWidth);
      onValueChange(v);
    },
    [positionToValue, trackWidth, onValueChange],
  );

  const tickHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const hapticGran = hapticStep ?? step;

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      startPosition.value = position.value;
    })
    .onUpdate((e) => {
      if (trackWidth === 0) return;
      const next = Math.max(0, Math.min(trackWidth, startPosition.value + e.translationX));
      position.value = next;
      const v = min + (next / trackWidth) * (max - min);
      const unitIdx = Math.floor(v / hapticGran);
      if (unitIdx !== lastHapticUnit.value) {
        lastHapticUnit.value = unitIdx;
        runOnJS(tickHaptic)();
      }
    })
    .onEnd(() => {
      runOnJS(commitValue)(position.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: position.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value - THUMB / 2 }],
  }));

  const fillColors = variant === 'secondary' ? gradients.secondary : gradients.primary;

  return (
    <View style={[styles.root, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>
            {Math.round(value)}
            {unit ? unit : ''}
          </Text>
        </View>
      )}
      <GestureDetector gesture={pan}>
        <View
          style={styles.trackWrap}
          onLayout={onTrackLayout}
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityValue={{ min, max, now: value }}
        >
          {/* Recessed groove */}
          <View style={styles.groove}>
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Inner shadow (top) */}
            <View style={styles.innerShadowTop} pointerEvents="none" />
            {/* Inner shadow (bottom highlight) */}
            <View style={styles.innerShadowBottom} pointerEvents="none" />
          </View>
          {/* Fill */}
          <Animated.View style={[styles.fillWrap, fillStyle]} pointerEvents="none">
            <LinearGradient
              colors={fillColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <LinearGradient
              colors={['#e7deff', '#b5a1ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.thumbFill}
            />
            <View style={styles.thumbSpec} pointerEvents="none" />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  value: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trackWrap: {
    height: THUMB + 8,
    justifyContent: 'center',
  },
  groove: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_H,
    top: (THUMB + 8 - TRACK_H) / 2,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: '#05030A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  innerShadowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  innerShadowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fillWrap: {
    position: 'absolute',
    left: 0,
    top: (THUMB + 8 - TRACK_H) / 2,
    height: TRACK_H,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 6,
  },
  thumbFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: THUMB / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  thumbSpec: {
    position: 'absolute',
    top: 4,
    left: 7,
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
