import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface Props {
  connected?: boolean;
}

export function QWordmark({ connected = true }: Props) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (connected) {
      pulseScale.value = 1;
      pulseOpacity.value = 0.55;
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(2.8, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(0.55, { duration: 0 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [connected]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const dotColor = connected ? '#E89240' : '#6d6050';

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>quartzie</Text>
      <View style={styles.statusRow}>
        <View style={styles.dotWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: dotColor },
              pulseStyle,
            ]}
          />
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        </View>
        <Text style={styles.statusText}>{connected ? 'CONNECTED' : 'OFFLINE'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 4,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 22,
    color: '#e8dfd2',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotWrap: {
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#E89240',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
  },
  pulseRing: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#9e907e',
    fontFamily: 'Menlo',
  },
});
