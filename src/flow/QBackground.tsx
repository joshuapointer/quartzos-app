/**
 * src/flow/QBackground.tsx
 * Full-bleed deep navy + ember radial vignette background.
 *
 * Layer order (back → front):
 *   1. base fill  — near-black navy
 *   2. top-edge navy bloom
 *   3. bottom-edge navy
 *   4. ember deep-right warm vignette
 *   5. ember bright-left warm vignette
 *
 * Modes:
 *   - 'ember' (default): ember-tinted bloom, the ambient warm body of the app.
 *   - 'quartz' (Bold #3): tertiary-container quartz bloom for the in-window
 *     climax moment — QFlowShell flips to 'quartz' for ~2s when the orb enters
 *     'cool-in-window', then back to 'ember'.
 *
 * pointerEvents="none" on the SVG so it never intercepts touches.
 */
import React, { memo, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useReducedMotion } from './components/useReducedMotion';

const AnimatedStop = Animated.createAnimatedComponent(Stop);

interface Props {
  children?: React.ReactNode;
  /**
   * Bloom hue for the bright-left radial. 'ember' is the default warm body.
   * 'quartz' switches to a tertiary-container cool bloom for the in-window
   * climax beat, then the parent toggles back. Reduced-motion honors the swap
   * but skips the cross-fade transition.
   */
  mode?: 'ember' | 'quartz';
}

function QBackground({ children, mode = 'ember' }: Props) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();

  // 0 = ember, 1 = quartz. Cross-fades between the two bloom hues without
  // tearing down the SVG (would re-trigger the gradient defs).
  const blend = useSharedValue(mode === 'quartz' ? 1 : 0);

  useEffect(() => {
    const target = mode === 'quartz' ? 1 : 0;
    if (reduced) {
      blend.value = target;
      return;
    }
    blend.value = withTiming(target, {
      duration: 380,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [mode, blend, reduced]);

  // Quartz tertiary-container hex (#00a8ff) ↔ ember primary-container (#ff7a00).
  // We feed both gradients identically alpha-shaped; only the stopColor swaps.
  const animatedBrightStopProps = useAnimatedProps(() => {
    'worklet';
    const t = blend.value;
    // Linear interpolate r,g,b between #ff7a00 and #00a8ff.
    const r = Math.round(0xff * (1 - t) + 0x00 * t);
    const g = Math.round(0x7a * (1 - t) + 0xa8 * t);
    const b = Math.round(0x00 * (1 - t) + 0xff * t);
    const hex = `rgb(${r}, ${g}, ${b})`;
    return { stopColor: hex };
  });

  return (
    <View style={styles.root}>
      <Svg
        style={StyleSheet.absoluteFill}
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Defs>
          {/* Base fill — near-black warm obsidian */}
          {/* Layer 1: top-edge warm obsidian bloom at 50% -10% */}
          <RadialGradient
            id="rg-navy-top"
            cx="50%"
            cy="-10%"
            rx="50%"
            ry="50%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(0 0) scale(1 1)"
          >
            <Stop offset="0" stopColor="#291d16" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#291d16" stopOpacity="0" />
          </RadialGradient>

          {/* Layer 2: bottom-edge warm obsidian at 50% 110% */}
          <RadialGradient
            id="rg-navy-bottom"
            cx="50%"
            cy="110%"
            rx="50%"
            ry="62%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#1c110a" stopOpacity="0.40" />
            <Stop offset="1" stopColor="#1c110a" stopOpacity="0" />
          </RadialGradient>

          {/* Layer 3: ember deep-right at 82% 72% */}
          <RadialGradient
            id="rg-ember-deep"
            cx="82%"
            cy="72%"
            rx="52%"
            ry="52%"
            gradientUnits="userSpaceOnUse"
          >
            {/* on-primary-container ember deep at 18% */}
            <Stop offset="0" stopColor="#5c2800" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#5c2800" stopOpacity="0" />
          </RadialGradient>

          {/* Layer 4: ember/quartz bright-left at 22% 28%. Animated stop swaps
              between primary-container ember (#ff7a00) and tertiary-container
              quartz (#00a8ff) when mode toggles. */}
          <RadialGradient
            id="rg-ember-bright"
            cx="22%"
            cy="28%"
            rx="55%"
            ry="55%"
            gradientUnits="userSpaceOnUse"
          >
            <AnimatedStop
              offset="0"
              stopOpacity="0.22"
              animatedProps={animatedBrightStopProps}
            />
            <AnimatedStop
              offset="1"
              stopOpacity="0"
              animatedProps={animatedBrightStopProps}
            />
          </RadialGradient>
        </Defs>

        {/* Base fill */}
        <Rect x="0" y="0" width="100" height="100" fill="#160c06" />
        {/* Navy top bloom */}
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-navy-top)" />
        {/* Navy bottom edge */}
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-navy-bottom)" />
        {/* Ember deep right */}
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-ember-deep)" />
        {/* Ember/quartz bright left (mode-driven) */}
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-ember-bright)" />
      </Svg>

      {/* Content stacked above background */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export default memo(QBackground);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
