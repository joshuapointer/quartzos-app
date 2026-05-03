import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useFlow } from '../store';
import { SCREEN, THEME } from '../theme';
import { reanimatedEasing } from '@/design/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { useStaggerEntrance } from '../components/useStaggerEntrance';

const EASE_EXPO = reanimatedEasing.easeOut;

function PulseDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: EASE_EXPO }),
        withTiming(0.4, { duration: 1100, easing: EASE_EXPO }),
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
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
  },
});

function GhostButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

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

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Searching for Dab Rite"
        accessibilityState={{ busy: true, disabled: true }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={btnStyles.ghost}
      >
        <PulseDot />
        <Text style={btnStyles.ghostText}>SCANNING</Text>
      </Pressable>
    </Animated.View>
  );
}

function ConnectButton({
  searching,
  onPress,
}: {
  searching: boolean;
  onPress: () => void;
}) {
  const locked = useRef(false);

  function handlePress() {
    if (locked.current) return;
    locked.current = true;
    setTimeout(() => { locked.current = false; }, 250);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  if (searching) {
    return <GhostButton onPress={handlePress} />;
  }

  return (
    <PrimaryButton
      label="CONNECT"
      onPress={handlePress}
      accessibilityLabel="Connect Dab Rite"
    />
  );
}

const btnStyles = StyleSheet.create({
  ghost: {
    paddingVertical: 16,
    paddingHorizontal: SCREEN.HPAD,
    borderRadius: SCREEN.PILL_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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

const SCAN_TIMEOUT_MS = 25000;


export default function ConnectStage() {
  const connect = useFlow((s) => s.connect);
  const searching = useFlow((s) => s.searching);
  const enterTimedMode = useFlow((s) => s.enterTimedMode);

  // Surface a recovery state if a scan runs for too long without finding the
  // Dab Rite. Without it, a first-timer with the device powered off is
  // stranded on a pulsing "SEARCHING…" with no feedback.
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!searching) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), SCAN_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [searching]);

  function handleConnect() {
    setTimedOut(false);
    connect();
  }

  function handleTimedMode() {
    void Haptics.selectionAsync();
    enterTimedMode();
  }

  // While timed out, present the button as ready-to-retry (not searching),
  // even though the store's searching flag is still true under the hood.
  const buttonSearching = searching && !timedOut;

  const s0 = useStaggerEntrance(0);
  const s1 = useStaggerEntrance(1);
  const s2 = useStaggerEntrance(2);
  const s3 = useStaggerEntrance(3);

  const footerText = timedOut
    ? 'DAB RITE NOT RESPONDING'
    : searching
      ? 'SCANNING FOR DAB RITE'
      : 'POWER ON TO PAIR';

  return (
    <View style={st.container}>

      <Animated.View style={[st.headlineWrapper, s0]}>
        {timedOut ? (
          <Text style={st.headline}>
            {'Find your\nDab Rite.'}
          </Text>
        ) : (
          <Text style={st.awaitingSignal}>CHOOSE A SESSION</Text>
        )}
      </Animated.View>

      <View style={st.spacer} />

      <Animated.View style={[s1, st.btnWrap]}>
        <ConnectButton searching={buttonSearching} onPress={handleConnect} />
      </Animated.View>

      <Animated.View style={[s2, st.btnWrap]}>
        <PrimaryButton
          label="USE TIMER"
          onPress={handleTimedMode}
          accessibilityLabel="Start a timed session without a Dab Rite"
        />
      </Animated.View>

      <Animated.View style={s3}>
        <Text style={st.footer}>{footerText}</Text>
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
    paddingHorizontal: SCREEN.HPAD,
    paddingBottom: 0,
  },
  headlineWrapper: {
    marginBottom: 8,
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 32,
    letterSpacing: -1.52,
    color: THEME.bone[70],
    lineHeight: 42,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.18)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  awaitingSignal: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 11,
    letterSpacing: 1.2,
    color: THEME.bone[35],
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 32,
  },
  btnWrap: {
    marginBottom: 14,
  },
  footer: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 11,
    letterSpacing: 1.7,
    color: THEME.bone[35],
    marginTop: 14,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
