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
    const delay = idx * 55;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: EASE_EXPO }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: EASE_EXPO }));
  }, [idx, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function StatusDot({ searching }: { searching: boolean }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (searching) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1.0, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [searching, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const dotColor = searching ? THEME.ember.bright : THEME.bone[35];

  return (
    <Animated.View
      style={[
        dotStyle.dot,
        animStyle,
        {
          backgroundColor: dotColor,
          shadowColor: dotColor,
          shadowRadius: searching ? 8 : 0,
          shadowOpacity: searching ? 0.7 : 0,
        },
      ]}
    />
  );
}

const dotStyle = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
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
  // Guard against double-tap; lock for 250ms after each press.
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
          <Text style={btnStyles.ghostText}>Searching for Dab Rite...</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[btnStyles.shadowWrapper, animStyle]}>
      <LinearGradient
        colors={['#e3801f', '#a85e1a']}
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
          <Text style={btnStyles.text}>Connect Dab Rite</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: 100,
    shadowColor: '#e3801f',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 28,
    shadowOpacity: 0.55,
    elevation: 8,
  },
  gradient: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 240, 220, 0.45)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    zIndex: 1,
  },
  pressable: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.52,
    color: '#fff5e8',
  },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 100,
    backgroundColor: 'rgba(8, 14, 26, 0.55)',
    alignItems: 'center',
  },
  ghostText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.52,
    color: THEME.bone[90],
  },
});

export default function ConnectStage() {
  const connect = useFlow((s) => s.connect);
  const searching = useFlow((s) => s.searching);

  const s0 = useStaggerEntrance(0);
  const s1 = useStaggerEntrance(1);
  const s2 = useStaggerEntrance(2);
  const s3 = useStaggerEntrance(3);
  const s4 = useStaggerEntrance(4);
  const s5 = useStaggerEntrance(5);

  return (
    <View style={st.container}>

      <Animated.View style={s0}>
        <Text style={st.eyebrow}>DEVICE NOT FOUND</Text>
      </Animated.View>

      <Animated.View style={s1}>
        <View style={st.headlineWrapper}>
          <Text style={st.headline}>
            {'Connect your\n'}
            <Text style={st.accentAmber}>Dab Rite</Text>
            {' to begin.'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={s2}>
        <Text style={st.subCopy}>
          Quartzie pairs with your IR thermometer over Bluetooth. Power it on
          and we'll find it automatically.
        </Text>
      </Animated.View>

      {/* accessibilityLiveRegion so screen readers announce scan state changes */}
      <Animated.View style={s3}>
        <View
          style={st.statusPill}
          accessibilityLiveRegion="polite"
          accessibilityLabel={searching ? 'Scanning for device' : 'Awaiting device'}
        >
          <StatusDot searching={searching} />
          <Text style={[st.statusText, { color: searching ? THEME.bone[90] : THEME.bone[50] }]}>
            {searching ? 'SCANNING...' : 'AWAITING DEVICE'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View style={s4}>
        <ConnectButton searching={searching} onPress={connect} />
      </Animated.View>

      <Animated.View style={s5}>
        <Text style={st.footer}>NO ADVANCE WITHOUT A DEVICE</Text>
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
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: 130,
  },
  headlineWrapper: {
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.88,
    textTransform: 'uppercase',
    color: THEME.bone[50],
    marginBottom: 12,
    textAlign: 'center',
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 32,
    letterSpacing: -1.12,
    color: THEME.bone[100],
    lineHeight: 32,
    textAlign: 'center',
  },
  accentAmber: {
    color: '#ffae5a',
    textShadowColor: 'rgba(255, 174, 90, 0.6)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  subCopy: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13.5,
    color: THEME.bone[50],
    lineHeight: 13.5 * 1.5,
    maxWidth: 280,
    textAlign: 'center',
    marginBottom: 30,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 240, 220, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 240, 220, 0.08)',
    marginBottom: 24,
  },
  statusText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.16 * 10,
    textTransform: 'uppercase',
  },
  footer: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9.5,
    letterSpacing: 0.18 * 9.5,
    color: THEME.bone[35],
    marginTop: 22,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
