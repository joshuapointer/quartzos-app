import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
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

// Per-mood wobble + breathe durations. Prototype lines 568-587 + 1486-1488
// + 1741-1747: default `bub-wobble 4.5s` / `bub-breathe 3.2s`; mood-heat speeds
// up to 3.6s wobble + 1.4s breathe; mood-dunk uses a `bub-swim` keyframe with
// translation in addition to rotation (impl approximates with bigger swing
// and translation).
type MoodAnimSpec = {
  wobbleMs: number;
  breatheMs: number;
  rotMin: number;
  rotMax: number;
  // optional translation for swimming
  translateX?: number;
  translateY?: number;
};

const ANIM_SPECS: Record<string, MoodAnimSpec> = {
  default: { wobbleMs: 4500, breatheMs: 3200, rotMin: -2.5, rotMax: 2.5 },
  heat:    { wobbleMs: 3600, breatheMs: 1400, rotMin: -2.5, rotMax: 2.5 },
  // 'dunk' mood = phase position 4 (impl 'swab') after the parity swap. Bub
  // is in water, swimming side-to-side.
  dunk:    { wobbleMs: 2600, breatheMs: 3200, rotMin: -7, rotMax: 7, translateX: 4, translateY: 2 },
};

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
  const spec = ANIM_SPECS[mood] ?? ANIM_SPECS.default;

  const wobbleRot    = useSharedValue(spec.rotMin);
  const breatheOp    = useSharedValue(1);
  const swimX        = useSharedValue(0);
  const swimY        = useSharedValue(0);
  const squishScaleY = useSharedValue(1);
  const squishScaleX = useSharedValue(1);

  // Wobble + breathe loop (duration & swing derived from mood spec)
  useEffect(() => {
    if (paused) {
      cancelAnimation(wobbleRot);
      cancelAnimation(breatheOp);
      cancelAnimation(swimX);
      cancelAnimation(swimY);
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    const halfWobble = spec.wobbleMs / 2;
    const halfBreathe = spec.breatheMs / 2;

    wobbleRot.value = withRepeat(
      withSequence(
        withTiming(spec.rotMax, { duration: halfWobble, easing: ease }),
        withTiming(spec.rotMin, { duration: halfWobble, easing: ease }),
      ),
      -1,
      false,
    );
    breatheOp.value = withRepeat(
      withSequence(
        withTiming(0.96, { duration: halfBreathe, easing: ease }),
        withTiming(1,    { duration: halfBreathe, easing: ease }),
      ),
      -1,
      false,
    );
    if (spec.translateX != null) {
      swimX.value = withRepeat(
        withSequence(
          withTiming( spec.translateX, { duration: halfWobble, easing: ease }),
          withTiming(-spec.translateX, { duration: halfWobble, easing: ease }),
        ),
        -1,
        false,
      );
    } else {
      swimX.value = withTiming(0, { duration: 200 });
    }
    if (spec.translateY != null) {
      swimY.value = withRepeat(
        withSequence(
          withTiming(-spec.translateY, { duration: halfWobble, easing: ease }),
          withTiming( spec.translateY, { duration: halfWobble, easing: ease }),
        ),
        -1,
        false,
      );
    } else {
      swimY.value = withTiming(0, { duration: 200 });
    }
    return () => {
      cancelAnimation(wobbleRot);
      cancelAnimation(breatheOp);
      cancelAnimation(swimX);
      cancelAnimation(swimY);
    };
  }, [paused, spec.wobbleMs, spec.breatheMs, spec.rotMin, spec.rotMax, spec.translateX, spec.translateY]);

  // External squish prop — flips → run squish curve once
  const prevSquish = useRef(false);
  const fireSquish = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (squish && !prevSquish.current) {
      fireSquish();
    }
    prevSquish.current = squish;
  }, [squish, fireSquish]);

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
    transform: [
      { translateX: swimX.value },
      { translateY: swimY.value },
      { rotate: `${wobbleRot.value}deg` },
    ],
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

  const inner = (
    <>
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
      {hasTorch    && <Torch    bubSize={px} lit={torchLit} paused={paused} />}
    </>
  );

  // Tap-to-squish fires the squish curve every press, then forwards to onPress.
  // Mirrors prototype `elBub.click` lines 2361-2365.
  const handlePress = useCallback(() => {
    fireSquish();
    onPress?.();
  }, [fireSquish, onPress]);

  if (onPress != null) {
    return (
      <Pressable onPress={handlePress} hitSlop={12} style={{ width: px, height: px }}>
        {inner}
      </Pressable>
    );
  }
  return <View style={{ width: px, height: px }}>{inner}</View>;
}
