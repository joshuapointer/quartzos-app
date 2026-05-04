import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette, wordmark, fontStack, radii } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

interface Props {
  size?: 'header' | 'display';
  connectionLabel?: string;
  isOnline?: boolean;
  onLongPressBrand?: () => void;
}

function OnlineDot({ reduced }: { reduced: boolean }) {
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [reduced]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: palette.mint,
          shadowColor: palette.mint,
          shadowOpacity: 0.7,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        animStyle,
      ]}
    />
  );
}

export function Wordmark({
  size = 'header',
  connectionLabel = 'online',
  isOnline = true,
  onLongPressBrand,
}: Props) {
  const reduced = useReducedMotion();
  const tokens = wordmark[size];

  return (
    <View style={styles.row}>
      <Pressable onLongPress={onLongPressBrand} accessibilityRole="header">
        <Text style={[styles.brand, { fontSize: tokens.size, letterSpacing: tokens.letterSpacing }]}>
          <Text style={{ color: palette.fg }}>{'dabwith'}</Text>
          <Text style={styles.dot}>{'.'}</Text>
          <Text style={styles.me}>{'me'}</Text>
        </Text>
      </Pressable>

      <View style={styles.chip}>
        {isOnline ? (
          <OnlineDot reduced={reduced} />
        ) : (
          <View style={styles.offlineDot} />
        )}
        <Text style={styles.chipLabel}>{connectionLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    flexShrink: 0,
  },
  brand: {
    fontFamily: fontStack.display,
    color: palette.fg,
  },
  dot: {
    color: palette.accent,
    fontFamily: fontStack.displayHeavy,
  },
  me: {
    color: palette.accent,
    fontFamily: fontStack.displayHeavy,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(251,241,244,0.7)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipLabel: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    letterSpacing: 0.16 * 9.5,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCC4CC',
  },
});
