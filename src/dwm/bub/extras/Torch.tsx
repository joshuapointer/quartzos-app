import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Filter, G, Rect, Path, Line, Circle, Ellipse, LinearGradient, Stop } from 'react-native-svg';
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
}

// SVG viewBox is 0 0 500 550, inner group translate(80,30)
// We render at 56×132 scaled from the original 500×550
const SVG_W = 500;
const SVG_H = 550;
const RENDER_W = 56;
const RENDER_H = 132;

export function Torch({ lit = true, paused = false }: Props) {
  const flameOpacity = useSharedValue(lit ? 1 : 0);
  const bodyTranslateY = useSharedValue(lit ? 0 : 8);
  // Subtle pulse on flame when lit
  const flameScale = useSharedValue(1);

  useEffect(() => {
    flameOpacity.value = withTiming(lit ? 1 : 0, { duration: 240 });
    bodyTranslateY.value = withTiming(lit ? 0 : 8, { duration: 240, easing: Easing.out(Easing.ease) });
  }, [lit]);

  useEffect(() => {
    if (paused || !lit) {
      cancelAnimation(flameScale);
      return;
    }
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 220, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(flameScale);
  }, [paused, lit]);

  const flameAnimStyle = useAnimatedStyle(() => ({
    opacity: flameOpacity.value,
    transform: [{ scale: flameScale.value }],
  }));

  const bodyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyTranslateY.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: -48,
        right: -78,
        width: RENDER_W,
        height: RENDER_H,
        transform: [{ rotate: '-45deg' }],
      }}
    >
      <Animated.View style={[{ width: RENDER_W, height: RENDER_H }, bodyAnimStyle]}>
        <Svg
          width={RENDER_W}
          height={RENDER_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        >
          {/* ── Torch body (no grayscale filter — color render) ── */}
          <G transform="translate(80, 30)">
            {/* Shadow */}
            <Ellipse cx={250} cy={465} rx={100} ry={12} fill="#000000" opacity={0.08} />

            {/* Base foot */}
            <Path d="M 205 420 L 295 420 L 325 450 L 175 450 Z" fill="#2c2c2c" />
            <Rect x={175} y={450} width={150} height={18} rx={5} fill="#1a1a1a" />
            <Rect x={185} y={468} width={130} height={6} rx={2} fill="#0f0f0f" />

            {/* Main barrel */}
            <Rect x={205} y={190} width={90} height={240} rx={8} fill="#222222" />
            <Rect x={215} y={190} width={15} height={240} fill="#ffffff" opacity={0.05} />

            {/* Panel */}
            <Rect x={220} y={220} width={60} height={110} rx={4} fill="#e0e0e0" />
            <Rect x={230} y={235} width={40} height={12} fill="#c62828" />
            <Rect x={230} y={255} width={40} height={6} fill="#424242" />
            <Rect x={230} y={267} width={25} height={4} fill="#424242" />
            <Rect x={230} y={277} width={40} height={4} fill="#999999" />

            {/* Grip rings */}
            <Rect x={220} y={150} width={60} height={45} fill="#333333" />
            <Rect x={220} y={155} width={60} height={6} fill="#151515" />
            <Rect x={220} y={167} width={60} height={6} fill="#151515" />
            <Rect x={220} y={179} width={60} height={6} fill="#151515" />

            {/* Trigger / valve */}
            <Rect x={275} y={155} width={18} height={45} rx={4} fill="#d32f2f" />
            <Rect x={283} y={160} width={5} height={35} fill="#b71c1c" />

            {/* Head housing */}
            <Rect x={205} y={100} width={100} height={60} rx={10} fill="#181818" />
            <Rect x={210} y={105} width={90} height={10} fill="#ffffff" opacity={0.05} />

            {/* Fuel canister (brass color) */}
            <Rect x={295} y={110} width={22} height={40} rx={6} fill="#d32f2f" />
            <Line x1={306} y1={115} x2={306} y2={145} stroke="#9a0000" strokeWidth={3} strokeLinecap="round" />
            <Line x1={312} y1={117} x2={312} y2={143} stroke="#9a0000" strokeWidth={2} strokeLinecap="round" />

            {/* Brass body section */}
            <Rect x={130} y={115} width={80} height={30} fill="#cba135" />
            <Rect x={130} y={118} width={80} height={5} fill="#f4d068" opacity={0.5} />

            {/* Lower brass canister */}
            <Rect x={65} y={105} width={65} height={50} rx={5} fill="#b8860b" />
            <Rect x={65} y={110} width={65} height={6} fill="#eedc82" opacity={0.4} />
            <Circle cx={110} cy={130} r={7} fill="#4a3604" />
            <Circle cx={85}  cy={130} r={7} fill="#4a3604" />

            {/* Nozzle tube */}
            <Rect x={45} y={115} width={20} height={30} rx={3} fill="#8b6508" />
          </G>

          {/* ── Flame cone — animated, controlled by flameOpacity ── */}
          {/* Rendered outside the Animated.View so we can control it separately */}
        </Svg>
      </Animated.View>

      {/* Flame overlay — separate layer so opacity animates independently */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width: RENDER_W, height: RENDER_H },
          flameAnimStyle,
        ]}
      >
        <Svg width={RENDER_W} height={RENDER_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <G transform="translate(80, 30)">
            {/* Blue outer flame */}
            <Path
              d="M 45 115 L -20 130 L 45 145 Z"
              fill="#0288d1"
              opacity={0.8}
            />
            {/* Light-blue mid flame */}
            <Path
              d="M 45 122 L 5 130 L 45 138 Z"
              fill="#4fc3f7"
              opacity={0.9}
            />
            {/* White hot core */}
            <Path
              d="M 45 126 L 15 130 L 45 134 Z"
              fill="#ffffff"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
