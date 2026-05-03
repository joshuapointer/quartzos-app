import React from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import { colors, fonts } from '../design/tokens';
import { useBleStore } from '../state/bleStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatMMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const r = Math.max(0, Math.round(secs % 60));
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VIEWBOX_W = 320;
const VIEWBOX_H = 200;
const CX = 160;
const CY = 100;
const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Animated Circle ─────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Props ───────────────────────────────────────────────────────────────────

export type HeatingOverlayProps = {
  torchSecondsTotal: number;
  torchSecondsLeft: number;
  size?: number;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const HeatingOverlay = React.memo(function HeatingOverlay({
  torchSecondsTotal,
  torchSecondsLeft,
  size = 320,
}: HeatingOverlayProps) {
  const displayTemp = useBleStore((s) => Math.max(0, Math.round(s.liveTempF)));
  const frameW = size;
  const frameH = size * (VIEWBOX_H / VIEWBOX_W); // 0.625 ratio

  // Derive dashoffset from prop: 0 = full ring, CIRCUMFERENCE = empty ring.
  // Ring drains as torchSecondsLeft decreases toward 0.
  const dashOffset = useDerivedValue(() => {
    const ratio = torchSecondsTotal > 0
      ? torchSecondsLeft / torchSecondsTotal
      : 0;
    const clamped = Math.min(1, Math.max(0, ratio));
    return withTiming(
      (1 - clamped) * CIRCUMFERENCE,
      { duration: 400, easing: Easing.out(Easing.quad) },
    );
  }, [torchSecondsLeft, torchSecondsTotal]);

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const isDone = torchSecondsLeft <= 0;

  return (
    <View
      style={{ width: frameW, height: frameH, alignSelf: 'center' }}
      pointerEvents="none"
    >
      {/* SVG ring layer — decorative, hidden from screen reader */}
      <Svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width={frameW}
        height={frameH}
        style={{ position: 'absolute', top: 0, left: 0 }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        <Defs>
          <LinearGradient id="torch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.prismCyan} />
            <Stop offset="50%" stopColor={colors.prismMagenta} />
            <Stop offset="100%" stopColor={colors.prismGold} />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          stroke={colors.glassEdgeFaint}
          strokeWidth={1}
          fill="none"
        />

        {/* Active ring — drains clockwise from 12 o'clock */}
        <AnimatedCircle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          stroke="url(#torch-grad)"
          strokeDasharray={CIRCUMFERENCE}
          transform={`rotate(-90 ${CX} ${CY})`}
          animatedProps={animatedRingProps}
        />
      </Svg>

      {/* Text readout — centered over the SVG */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: frameW,
          height: frameH,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Temperature number + degree symbol */}
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <Text
            style={{
              ...fonts.serifDisplay,
              color: colors.bone100,
            }}
            accessibilityRole="text"
            accessibilityLabel={`${displayTemp} degrees Fahrenheit`}
            accessibilityLiveRegion="polite"
          >
            {displayTemp}
          </Text>
          <Text
            style={{
              fontFamily: 'InstrumentSerif_400Regular_Italic',
              fontStyle: 'italic',
              fontSize: 32,
              lineHeight: 32,
              color: colors.bone60,
              position: 'absolute',
              top: 16,
              left: '65%',
            }}
          >
            {'°F'}
          </Text>
        </View>

        {/* Timer label */}
        <Text
          style={{
            ...fonts.dataLabel,
            fontSize: 10.5,
            letterSpacing: 2.31,
            color: colors.bone40,
            marginTop: 6,
          }}
        >
          {'TORCH · '}
          <Text
            style={{
              color: isDone ? colors.bone40 : colors.bone100,
              ...(isDone
                ? {}
                : {
                    textShadowColor: colors.prismCyan,
                    textShadowOffset: { width: 0.5, height: 0 },
                    textShadowRadius: 0,
                  }),
            }}
          >
            {formatMMSS(torchSecondsLeft)}
          </Text>
          {' LEFT'}
        </Text>
      </View>
    </View>
  );
});
