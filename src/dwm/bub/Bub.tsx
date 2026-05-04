import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { BubBody }  from './BubBody';
import { BubFace }  from './BubFace';
import { BubHalo }  from './BubHalo';
import { Flames }   from './extras/Flames';
import { Torch }    from './extras/Torch';
import { Bubbles }  from './extras/Bubbles';
import { Wave }     from './extras/Wave';
import { Suds }     from './extras/Suds';
import { Sparkles } from './extras/Sparkles';
import { Sweat }    from './extras/Sweat';

import type { BubProps } from './types';
import { BUB_SIZE_PX }   from './types';

// Eyes that suppress the autonomous blink (they have fixed shape treatment)
const NO_BLINK_EYES = new Set(['concentrating', 'happy', 'starry', 'tidy']);

export function Bub({
  mood     = 'idle',
  eye      = 'open',
  size     = 'lg',
  coreOverride,
  edgeOverride,
  extras   = [],
  torchLit = false,
  squish   = false,
  onPress,
  paused   = false,
}: BubProps) {
  const px = BUB_SIZE_PX[size];

  const wobbleRot    = useSharedValue(-2.5);
  const breatheOp    = useSharedValue(1);
  const squishScaleY = useSharedValue(1);
  const squishScaleX = useSharedValue(1);

  // Wobble + breathe loop
  useEffect(() => {
    if (paused) {
      cancelAnimation(wobbleRot);
      cancelAnimation(breatheOp);
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    wobbleRot.value = withRepeat(
      withSequence(
        withTiming( 2.5, { duration: 2250, easing: ease }),
        withTiming(-2.5, { duration: 2250, easing: ease }),
      ),
      -1,
      false,
    );
    breatheOp.value = withRepeat(
      withSequence(
        withTiming(0.96, { duration: 1600, easing: ease }),
        withTiming(1,    { duration: 1600, easing: ease }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(wobbleRot);
      cancelAnimation(breatheOp);
    };
  }, [paused]);

  // Squish — fires when the prop flips to true
  const prevSquish = useRef(false);
  useEffect(() => {
    if (squish && !prevSquish.current) {
      const bez = Easing.bezier(0.34, 1.56, 0.64, 1);
      squishScaleY.value = withSequence(
        withTiming(0.86, { duration: 168, easing: bez }),
        withTiming(1.05, { duration: 168, easing: bez }),
        withTiming(1,    { duration: 144, easing: bez }),
      );
      squishScaleX.value = withSequence(
        withTiming(1.10, { duration: 168, easing: bez }),
        withTiming(0.96, { duration: 168, easing: bez }),
        withTiming(1,    { duration: 144, easing: bez }),
      );
    }
    prevSquish.current = squish;
  }, [squish]);

  // Spontaneous blink — plain setTimeout, drives React state for BubFace
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused || NO_BLINK_EYES.has(eye)) {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      setIsBlinking(false);
      return;
    }
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 2000;
      blinkTimer.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 80);
      }, delay);
    }
    scheduleBlink();
    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      setIsBlinking(false);
    };
  }, [paused, eye]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity:   breatheOp.value,
    transform: [{ rotate: `${wobbleRot.value}deg` }],
  }));

  const squishStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: squishScaleY.value },
      { scaleX: squishScaleX.value },
    ],
  }));

  const hasFlames   = extras.includes('flames');
  const hasTorch    = extras.includes('torch');
  const hasBubbles  = extras.includes('bubbles');
  const hasWave     = extras.includes('wave');
  const hasSuds     = extras.includes('suds');
  const hasSparkles = extras.includes('sparkles');
  const hasSweat    = extras.includes('sweat');

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={{ width: px, height: px }}
    >
      <BubHalo size={px} mood={mood} paused={paused} />

      {hasFlames && <Flames size={px} paused={paused} />}

      {/* transform-origin 50% 60% approximated by nesting; Reanimated v4 supports
          the transformOrigin style key on web but on native we accept 50% 50% — close enough
          for a -2.5° / +2.5° rotation. */}
      <Animated.View style={[StyleSheet.absoluteFill, wrapStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, squishStyle]}>
          <BubBody
            size={px}
            mood={mood}
            coreOverride={coreOverride}
            edgeOverride={edgeOverride}
          />
          <BubFace size={px} eye={eye} paused={paused} blinking={isBlinking} />
          {hasBubbles && <Bubbles size={px} paused={paused} />}
          {hasWave    && <Wave    size={px} paused={paused} />}
          {hasSweat   && <Sweat   size={px} paused={paused} />}
        </Animated.View>
      </Animated.View>

      {hasSuds     && <Suds     size={px} paused={paused} />}
      {hasSparkles && <Sparkles size={px} paused={paused} />}
      {hasTorch    && <Torch    lit={torchLit} paused={paused} />}
    </Pressable>
  );
}
