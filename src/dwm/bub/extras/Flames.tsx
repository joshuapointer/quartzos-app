import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  size: number;
  paused: boolean;
}

const TONGUE_CONFIGS = [
  { dur: 1450, scaleYLo: 0.82, scaleYHi: 1.08, scaleXLo: 0.88, scaleXHi: 1.06, rotateLo: -3, rotateHi: 3 },
  { dur: 920,  scaleYLo: 0.78, scaleYHi: 1.12, scaleXLo: 0.90, scaleXHi: 1.04, rotateLo: -5, rotateHi: 4 },
  { dur: 620,  scaleYLo: 0.75, scaleYHi: 1.15, scaleXLo: 0.92, scaleXHi: 1.02, rotateLo: -4, rotateHi: 6 },
  { dur: 460,  scaleYLo: 0.70, scaleYHi: 1.18, scaleXLo: 0.94, scaleXHi: 1.03, rotateLo: -6, rotateHi: 5 },
  { dur: 380,  scaleYLo: 0.65, scaleYHi: 1.22, scaleXLo: 0.96, scaleXHi: 1.01, rotateLo: -7, rotateHi: 7 },
];

const EMBERS = [
  { x: 0.45, delay: 0,    dur: 1200, driftX: -6 },
  { x: 0.55, delay: 300,  dur: 1600, driftX: 8  },
  { x: 0.40, delay: 600,  dur: 1000, driftX: -10 },
  { x: 0.60, delay: 900,  dur: 1400, driftX: 12 },
  { x: 0.50, delay: 150,  dur: 1100, driftX: -4 },
  { x: 0.42, delay: 750,  dur: 1300, driftX: 6  },
  { x: 0.58, delay: 450,  dur: 900,  driftX: -8 },
];

function FlameLayer({
  width,
  height,
  gradId,
  pathD,
  dur,
  scaleYLo,
  scaleYHi,
  scaleXLo,
  scaleXHi,
  rotateLo,
  rotateHi,
  paused,
  delay,
}: {
  width: number;
  height: number;
  gradId: string;
  pathD: string;
  dur: number;
  scaleYLo: number;
  scaleYHi: number;
  scaleXLo: number;
  scaleXHi: number;
  rotateLo: number;
  rotateHi: number;
  paused: boolean;
  delay: number;
}) {
  const scaleY = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(scaleY);
      cancelAnimation(scaleX);
      cancelAnimation(rotate);
      return;
    }
    const easing = Easing.inOut(Easing.ease);
    scaleY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(scaleYHi, { duration: dur * 0.4, easing }),
        withTiming(scaleYLo, { duration: dur * 0.3, easing }),
        withTiming(1.0,      { duration: dur * 0.3, easing }),
      ), -1, false,
    ));
    scaleX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(scaleXHi, { duration: dur * 0.35, easing }),
        withTiming(scaleXLo, { duration: dur * 0.35, easing }),
        withTiming(1.0,       { duration: dur * 0.3,  easing }),
      ), -1, false,
    ));
    rotate.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(rotateHi, { duration: dur * 0.5, easing }),
        withTiming(rotateLo, { duration: dur * 0.5, easing }),
      ), -1, false,
    ));
    return () => {
      cancelAnimation(scaleY);
      cancelAnimation(scaleX);
      cancelAnimation(rotate);
    };
  }, [paused, dur, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: scaleY.value },
      { scaleX: scaleX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%"   stopColor="#C62828" stopOpacity="1"   />
            <Stop offset="30%"  stopColor="#F57C00" stopOpacity="0.95" />
            <Stop offset="65%"  stopColor="#FFD740" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6"  />
          </LinearGradient>
        </Defs>
        <Path d={pathD} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

function Ember({
  x, delay, dur, driftX, containerW, containerH, paused,
}: {
  x: number; delay: number; dur: number; driftX: number;
  containerW: number; containerH: number; paused: boolean;
}) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      return;
    }
    const easing = Easing.out(Easing.quad);
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-containerH * 0.6, { duration: dur, easing }),
        withTiming(0, { duration: 0 }),
      ), -1, false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0,   { duration: 0 }),
        withTiming(0.9, { duration: dur * 0.2 }),
        withTiming(0.7, { duration: dur * 0.5 }),
        withTiming(0,   { duration: dur * 0.3 }),
      ), -1, false,
    ));
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [paused, dur, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: containerH * 0.05,
          left: containerW * x + driftX,
          width: 3,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#FFD740',
        },
        animStyle,
      ]}
    />
  );
}

export function Flames({ size, paused }: Props) {
  const flameW    = size * 0.78;
  const flameH    = size * 0.55;
  const containerH = flameH + size * 0.12;
  const offsetX   = (size - flameW) / 2;

  const tongueWidths = [0.78, 0.60, 0.44, 0.30, 0.18];
  const baseY = flameH;

  const paths = tongueWidths.map((wFrac) => {
    const hw = (flameW * wFrac) / 2;
    const cx = flameW / 2;
    return (
      `M ${cx - hw} ${baseY} ` +
      `C ${cx - hw * 0.6} ${baseY * 0.5}, ${cx - hw * 0.2} ${flameH * 0.15}, ${cx} 0 ` +
      `C ${cx + hw * 0.2} ${flameH * 0.15}, ${cx + hw * 0.6} ${baseY * 0.5}, ${cx + hw} ${baseY} Z`
    );
  });

  const gradIds = ['fg0', 'fg1', 'fg2', 'fg3', 'fg4'];

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -(containerH - size * 0.05),
        left: 0,
        width: size,
        height: containerH,
      }}
    >
      {/* Anchoring glow ellipse at base */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
        <Svg width={flameW} height={20}>
          <Defs>
            <RadialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#FF6D00" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#FF6D00" stopOpacity="0"   />
            </RadialGradient>
          </Defs>
          <Ellipse cx={flameW / 2} cy={10} rx={flameW / 2} ry={10} fill="url(#baseGlow)" />
        </Svg>
      </View>

      {/* Tongue layers */}
      <View style={{ position: 'absolute', bottom: size * 0.04, left: offsetX, width: flameW, height: flameH }}>
        {TONGUE_CONFIGS.map((cfg, i) => (
          <FlameLayer
            key={i}
            width={flameW}
            height={flameH}
            gradId={gradIds[i]}
            pathD={paths[i]}
            dur={cfg.dur}
            scaleYLo={cfg.scaleYLo}
            scaleYHi={cfg.scaleYHi}
            scaleXLo={cfg.scaleXLo}
            scaleXHi={cfg.scaleXHi}
            rotateLo={cfg.rotateLo}
            rotateHi={cfg.rotateHi}
            paused={paused}
            delay={i * 80}
          />
        ))}
      </View>

      {/* Ember sparks */}
      {EMBERS.map((e, i) => (
        <Ember
          key={i}
          x={e.x}
          delay={e.delay}
          dur={e.dur}
          driftX={e.driftX}
          containerW={size}
          containerH={containerH}
          paused={paused}
        />
      ))}
    </View>
  );
}
