import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Rect, Path, Line, Circle, Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  lit?: boolean;
  paused?: boolean;
  /** Pixel width of the parent Bub. Torch scales relative to 220px reference. */
  bubSize?: number;
}

// Reference: prototype torch is 230×253 next to a 220px Bub, positioned
// right:-78 bottom:-86, rotated -45deg so flame points NW into Bub.
const REF_BUB = 220;
const REF_W = 230;
const REF_H = 253;
const REF_RIGHT = -78;
const REF_BOTTOM = -86;

const SVG_W = 500;
const SVG_H = 550;

export function Torch({ lit = true, paused = false, bubSize = REF_BUB }: Props) {
  const flameOpacity = useSharedValue(lit ? 1 : 0);
  const bodyTranslateY = useSharedValue(lit ? 0 : 8);
  const flameScale = useSharedValue(1);
  const flameRotate = useSharedValue(0);
  // Fast flicker overlay opacity — gives a SMIL-like "alive" feel without SMIL
  const flickerOp = useSharedValue(1);

  useEffect(() => {
    flameOpacity.value = withTiming(lit ? 1 : 0, { duration: 240 });
    bodyTranslateY.value = withTiming(lit ? 0 : 8, { duration: 240, easing: Easing.out(Easing.ease) });
  }, [lit]);

  useEffect(() => {
    if (paused || !lit) {
      cancelAnimation(flameScale);
      cancelAnimation(flameRotate);
      cancelAnimation(flickerOp);
      return;
    }
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.10, { duration: 140, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: 160, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    flameRotate.value = withRepeat(
      withSequence(
        withTiming( 4, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        withTiming(-4, { duration: 180, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // High-frequency flicker — 60-80ms steps to suggest the SMIL morph
    flickerOp.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 70 }),
        withTiming(1.0,  { duration: 60 }),
        withTiming(0.85, { duration: 80 }),
        withTiming(1.0,  { duration: 60 }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(flameScale);
      cancelAnimation(flameRotate);
      cancelAnimation(flickerOp);
    };
  }, [paused, lit]);

  const flameAnimStyle = useAnimatedStyle(() => ({
    opacity: flameOpacity.value * flickerOp.value,
    transform: [{ scale: flameScale.value }, { rotate: `${flameRotate.value}deg` }],
  }));

  const bodyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyTranslateY.value }],
  }));

  // Scale the torch to match Bub size proportionally to the 220px reference
  const scale = bubSize / REF_BUB;
  const renderW = REF_W * scale;
  const renderH = REF_H * scale;
  const right = REF_RIGHT * scale;
  const bottom = REF_BOTTOM * scale;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom,
        right,
        width: renderW,
        height: renderH,
        transform: [{ rotate: '-45deg' }],
      }}
    >
      <Animated.View style={[{ width: renderW, height: renderH }, bodyAnimStyle]}>
        <Svg
          width={renderW}
          height={renderH}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        >
          <G transform="translate(80, 30)">
            <Ellipse cx={250} cy={465} rx={100} ry={12} fill="#000000" opacity={0.08} />
            <Path d="M 205 420 L 295 420 L 325 450 L 175 450 Z" fill="#2c2c2c" />
            <Rect x={175} y={450} width={150} height={18} rx={5} fill="#1a1a1a" />
            <Rect x={185} y={468} width={130} height={6} rx={2} fill="#0f0f0f" />
            <Rect x={205} y={190} width={90} height={240} rx={8} fill="#222222" />
            <Rect x={215} y={190} width={15} height={240} fill="#ffffff" opacity={0.05} />
            <Rect x={220} y={220} width={60} height={110} rx={4} fill="#e0e0e0" />
            <Rect x={230} y={235} width={40} height={12} fill="#c62828" />
            <Rect x={230} y={255} width={40} height={6} fill="#424242" />
            <Rect x={230} y={267} width={25} height={4} fill="#424242" />
            <Rect x={230} y={277} width={40} height={4} fill="#999999" />
            <Rect x={220} y={150} width={60} height={45} fill="#333333" />
            <Rect x={220} y={155} width={60} height={6} fill="#151515" />
            <Rect x={220} y={167} width={60} height={6} fill="#151515" />
            <Rect x={220} y={179} width={60} height={6} fill="#151515" />
            <Rect x={275} y={155} width={18} height={45} rx={4} fill="#d32f2f" />
            <Rect x={283} y={160} width={5} height={35} fill="#b71c1c" />
            <Rect x={205} y={100} width={100} height={60} rx={10} fill="#181818" />
            <Rect x={210} y={105} width={90} height={10} fill="#ffffff" opacity={0.05} />
            <Rect x={295} y={110} width={22} height={40} rx={6} fill="#d32f2f" />
            <Line x1={306} y1={115} x2={306} y2={145} stroke="#9a0000" strokeWidth={3} strokeLinecap="round" />
            <Line x1={312} y1={117} x2={312} y2={143} stroke="#9a0000" strokeWidth={2} strokeLinecap="round" />
            <Rect x={130} y={115} width={80} height={30} fill="#cba135" />
            <Rect x={130} y={118} width={80} height={5} fill="#f4d068" opacity={0.5} />
            <Rect x={65} y={105} width={65} height={50} rx={5} fill="#b8860b" />
            <Rect x={65} y={110} width={65} height={6} fill="#eedc82" opacity={0.4} />
            <Circle cx={110} cy={130} r={7} fill="#4a3604" />
            <Circle cx={85}  cy={130} r={7} fill="#4a3604" />
            <Rect x={45} y={115} width={20} height={30} rx={3} fill="#8b6508" />
          </G>
        </Svg>
      </Animated.View>

      {/* Flame overlay — separate animated layer (opacity + scale + flicker) */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width: renderW, height: renderH },
          flameAnimStyle,
        ]}
      >
        <Svg width={renderW} height={renderH} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <G transform="translate(80, 30)">
            <Path d="M 45 115 L -20 130 L 45 145 Z" fill="#0288d1" opacity={0.8} />
            <Path d="M 45 122 L 5 130 L 45 138 Z"   fill="#4fc3f7" opacity={0.9} />
            <Path d="M 45 126 L 15 130 L 45 134 Z"  fill="#ffffff" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
