import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette, springs, wordmark, fontStack, radii } from '../tokens';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';

interface Props {
  size?: 'header' | 'display';
  connectionLabel?: string;
  isOnline?: boolean;
  onLongPressBrand?: () => void;
  onDisconnect?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
          // Single accent — amber dot replaces the legacy mint pulse
          backgroundColor: palette.accent,
          shadowColor: palette.accent,
          shadowOpacity: 0.7,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        animStyle,
      ]}
    />
  );
}

function DisconnectChip({ reduced, onPress }: { reduced: boolean; onPress: () => void }) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springs.squish);
  }, []);
  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.squish);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 - pressed.value * 0.1 }, { scaleX: 1 + pressed.value * 0.02 }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel="disconnect"
      style={[styles.chip, animStyle]}
    >
      <OnlineDot reduced={reduced} />
      <Text style={styles.chipLabel}>{'DISCONNECT'}</Text>
    </AnimatedPressable>
  );
}

export function Wordmark({
  size = 'header',
  connectionLabel = 'online',
  isOnline = true,
  onLongPressBrand,
  onDisconnect,
}: Props) {
  const reduced = useReducedMotion();
  const tokens = wordmark[size];

  return (
    <View style={styles.row}>
      <Pressable onLongPress={onLongPressBrand} accessibilityRole="header">
        <Text style={[styles.brand, { fontSize: tokens.size, letterSpacing: tokens.letterSpacing }]}>
          <Text style={{ color: palette.fg }}>{'DABWITH'}</Text>
          <Text style={styles.dot}>{'.'}</Text>
          <Text style={styles.me}>{'ME'}</Text>
        </Text>
      </Pressable>

      {isOnline && onDisconnect != null ? (
        <DisconnectChip reduced={reduced} onPress={onDisconnect} />
      ) : (
        <View style={styles.chip}>
          {isOnline ? (
            <OnlineDot reduced={reduced} />
          ) : (
            <View style={styles.offlineDot} />
          )}
          <Text style={styles.chipLabel}>{connectionLabel.toUpperCase()}</Text>
        </View>
      )}
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
  // The .ME suffix and the kerning dot are the two amber stops in the
  // wordmark — single-accent budget per spec.
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
    borderRadius: radii.chip,
    backgroundColor: palette.surface,
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
    backgroundColor: palette.muted,
  },
});
