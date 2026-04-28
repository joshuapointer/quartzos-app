import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useFlow } from '../store';
import { THEME } from '../theme';

const EASE_EXPO = Easing.bezier(0.22, 1, 0.36, 1);

function useStaggerEntrance(idx: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = idx * 75;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: EASE_EXPO }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: EASE_EXPO }));
  }, [idx, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function PulseDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: EASE_EXPO }),
        withTiming(0.4, { duration: 700, easing: EASE_EXPO }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[dotStyle.dot, animStyle]} />;
}

const dotStyle = StyleSheet.create({
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(28, 17, 10, 0.55)',
  },
});

function ConnectButton({
  searching,
  onPress,
}: {
  searching: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const locked = useRef(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    translateY.value = withSpring(-1, { damping: 20, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
  }

  function handlePress() {
    if (locked.current) return;
    locked.current = true;
    setTimeout(() => { locked.current = false; }, 250);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  if (searching) {
    return (
      <Animated.View style={animStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Searching for Dab Rite"
          accessibilityState={{ busy: true, disabled: true }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={btnStyles.ghost}
        >
          <PulseDot />
          <Text style={btnStyles.ghostText}>SEARCHING…</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[btnStyles.shadowWrapper, animStyle]}>
      <LinearGradient
        colors={['#ff8a14', '#ff7a00']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={btnStyles.gradient}
      >
        <View style={btnStyles.highlight} />
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={btnStyles.pressable}
          accessibilityRole="button"
          accessibilityLabel="Connect Dab Rite"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={btnStyles.text}>CONNECT DAB RITE</Text>
          <Text style={btnStyles.arrow}>→</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: 9999,
    shadowColor: '#ff7a00',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 32,
    shadowOpacity: 0.55,
    elevation: 10,
  },
  gradient: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    zIndex: 1,
  },
  pressable: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  text: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.8,
    color: '#1c110a',
    textTransform: 'uppercase',
  },
  arrow: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 13,
    color: '#1c110a',
    opacity: 0.85,
  },
  ghost: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 9999,
    backgroundColor: 'rgba(246, 222, 210, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(246, 222, 210, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ghostText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.8,
    color: THEME.bone[70],
    textTransform: 'uppercase',
  },
});

export default function ConnectStage() {
  const connect = useFlow((s) => s.connect);
  const searching = useFlow((s) => s.searching);

  const s0 = useStaggerEntrance(0);
  const s1 = useStaggerEntrance(1);
  const s2 = useStaggerEntrance(2);

  return (
    <View style={st.container}>

      <Animated.View style={[st.headlineWrapper, s0]}>
        <Text style={st.headline}>
          {'Connect your\nDab Rite to begin.'}
        </Text>
      </Animated.View>

      <View style={st.spacer} />

      <Animated.View style={s1}>
        <ConnectButton searching={searching} onPress={connect} />
      </Animated.View>

      <Animated.View style={s2}>
        <Text style={st.footer}>
          {searching ? 'SCANNING FOR DEVICE' : 'POWER ON THE DAB RITE TO PAIR'}
        </Text>
      </Animated.View>

    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  headlineWrapper: {
    marginBottom: 8,
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 38,
    letterSpacing: -1.52,
    color: THEME.bone[100],
    lineHeight: 42,
    textAlign: 'center',
    textShadowColor: 'rgba(246, 222, 210, 0.18)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  spacer: {
    flex: 1,
    minHeight: 32,
  },
  footer: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9.5,
    letterSpacing: 1.7,
    color: THEME.bone[35],
    marginTop: 28,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
