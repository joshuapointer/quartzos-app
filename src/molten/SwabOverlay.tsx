import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient as SvgLinearGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { colors, fonts } from '../design/tokens';
import { PrismEdge } from '../design/components/molten/PrismEdge';
import { useBleStore } from '../state/bleStore';

// ─────────────────────────────────────────────────────────────────────────────

export type SwabOverlayProps = {
  bandLowF?: number;
  bandHighF?: number;
};

// ─── Animated G for the swinging Q-tip ───────────────────────────────────────

const AnimatedG = Animated.createAnimatedComponent(G);

const QtipSvg = React.memo(function QtipSvg() {
  const rotation = useSharedValue(-14);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 1200 }),
        withTiming(-14, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [rotation]);

  // SVG transform string: translate pivot to origin, rotate, translate back
  const animatedProps = useAnimatedProps(() => ({
    transform: `translate(28,6) rotate(${rotation.value}) translate(-28,-6)`,
  }));

  return (
    <View style={styles.qtipContainer}>
      <Svg viewBox="0 0 56 64" width={56} height={64}>
        <Defs>
          {/* Stick gradient: warm bone top to bone60 bottom */}
          <SvgLinearGradient id="stickGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.bone100} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.bone60} stopOpacity="1" />
          </SvgLinearGradient>
          {/* Bud gradient: radial approximation */}
          <SvgLinearGradient id="budGrad" x1="0.3" y1="0.2" x2="0.8" y2="1">
            <Stop offset="0%" stopColor={colors.bone100} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.bone60} stopOpacity="1" />
          </SvgLinearGradient>
          {/* Puddle gradient */}
          <SvgLinearGradient id="puddleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.prismCyan} stopOpacity="0.75" />
            <Stop offset="50%" stopColor={colors.prismMagenta} stopOpacity="0.75" />
            <Stop offset="100%" stopColor={colors.prismGold} stopOpacity="0.75" />
          </SvgLinearGradient>
        </Defs>

        {/* Animated swing group — pivot at top of stick (28, 6) */}
        <AnimatedG
          animatedProps={animatedProps}
        >
          {/* Stick */}
          <Rect
            x={26.5}
            y={6}
            width={3}
            height={42}
            rx={1.5}
            fill="url(#stickGrad)"
          />
          {/* Cotton bud ellipse */}
          <Ellipse
            cx={28}
            cy={50}
            rx={7.5}
            ry={9}
            fill="url(#budGrad)"
          />
        </AnimatedG>

        {/* Puddle — static at bottom center, not swinging */}
        <Rect
          x={13}
          y={60}
          width={30}
          height={2}
          rx={1}
          fill="url(#puddleGrad)"
          opacity={0.75}
        />
      </Svg>
    </View>
  );
});

// ─── SwabOverlay ──────────────────────────────────────────────────────────────

export const SwabOverlay = React.memo(function SwabOverlay({
  bandLowF = 250,
  bandHighF = 300,
}: SwabOverlayProps) {
  const displayTemp = useBleStore((s) => Math.max(0, Math.round(s.liveTempF)));

  return (
    <View style={styles.container}>
      {/* Big temp number row */}
      <View style={styles.numbersRow}>
        <Text
          style={styles.tempNumber}
          allowFontScaling={false}
          accessibilityRole="text"
          accessibilityLabel={`${displayTemp} degrees Fahrenheit`}
          accessibilityLiveRegion="polite"
        >
          {displayTemp}
        </Text>
        <Text style={styles.degSuffix} allowFontScaling={false}>
          °F
        </Text>
      </View>

      {/* Q-tip callout pill */}
      <View style={styles.calloutWrap}>
        <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassFill]} pointerEvents="none" />
        <PrismEdge radius={22} strokeWidth={0.75} />

        <View style={styles.calloutInner}>
          {/* Left: animated Q-tip SVG */}
          <QtipSvg />

          {/* Right: copy stack */}
          <View style={styles.copyStack}>
            <Text style={styles.copyTitle} allowFontScaling={false}>
              Q-tip now
            </Text>
            <Text style={styles.copySub} allowFontScaling={false}>
              <Text style={styles.copySubCyan}>{bandLowF}–{bandHighF}°F</Text>
              <Text style={styles.copySubMuted}> · safe to swab</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempNumber: {
    ...fonts.serifDisplay,
    fontSize: 88,
    lineHeight: 88,
    letterSpacing: -3.52, // -0.04em * 88
    color: colors.bone100,
    fontVariant: ['tabular-nums'],
  },
  degSuffix: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 32,
    color: colors.bone60,
    lineHeight: 32,
    marginTop: 12,
  },
  calloutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 6,
    position: 'relative',
  },
  glassFill: {
    backgroundColor: colors.glassPane,
    borderRadius: 22,
  },
  calloutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 22,
  },
  qtipContainer: {
    width: 56,
    height: 64,
    flexShrink: 0,
  },
  copyStack: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-start',
  },
  copyTitle: {
    ...fonts.serifHeadline,
    fontSize: 24,
    lineHeight: 24,
    color: colors.bone100,
  },
  copySub: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 1.98, // 0.22em * 9
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  copySubCyan: {
    color: colors.prismCyan,
  },
  copySubMuted: {
    color: colors.bone60,
  },
});
