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
 * Implementation note: Reanimated cannot animate react-native-svg `Stop`
 * elements via `useAnimatedProps` (they are virtual nodes with no host
 * instance). Instead we stack a second quartz-tinted SVG on top of the base
 * ember SVG and crossfade the *outer* Animated.View opacity, which Reanimated
 * targets natively.
 *
 * pointerEvents="none" on the SVG so it never intercepts touches.
 */
import React, { memo, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useReducedMotion } from './components/useReducedMotion';
import { THEME } from './theme';
import { reanimatedEasing } from '@/design/tokens';

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

  // 0 = ember (quartz layer hidden), 1 = quartz (quartz layer fully shown).
  const blend = useSharedValue(mode === 'quartz' ? 1 : 0);

  useEffect(() => {
    const target = mode === 'quartz' ? 1 : 0;
    if (reduced) {
      blend.value = target;
      return;
    }
    blend.value = withTiming(target, {
      duration: 380,
      easing: reanimatedEasing.easeOut,
    });
  }, [mode, blend, reduced]);

  const quartzLayerStyle = useAnimatedStyle(() => ({
    opacity: blend.value,
  }));

  return (
    <View style={styles.root}>
      {/* Base layer — ember bright-left bloom (always rendered) */}
      <Svg
        style={StyleSheet.absoluteFill}
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient
            id="rg-navy-top"
            cx="50%"
            cy="-10%"
            rx="50%"
            ry="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={THEME.navy[3]} stopOpacity="0.35" />
            <Stop offset="1" stopColor={THEME.navy[3]} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient
            id="rg-navy-bottom"
            cx="50%"
            cy="110%"
            rx="50%"
            ry="62%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={THEME.navy[1]} stopOpacity="0.40" />
            <Stop offset="1" stopColor={THEME.navy[1]} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient
            id="rg-ember-deep"
            cx="82%"
            cy="72%"
            rx="52%"
            ry="52%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={THEME.ember.deep} stopOpacity="0.18" />
            <Stop offset="1" stopColor={THEME.ember.deep} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient
            id="rg-ember-bright"
            cx="22%"
            cy="28%"
            rx="55%"
            ry="55%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={THEME.ember.base} stopOpacity="0.22" />
            <Stop offset="1" stopColor={THEME.ember.base} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill={THEME.navy[0]} />
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-navy-top)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-navy-bottom)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-ember-deep)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#rg-ember-bright)" />
      </Svg>

      {/* Quartz overlay — only the bright-left bloom in quartz hue, opacity
          driven by `blend`. Sits above the ember layer; when blend=0 it is
          invisible, when blend=1 it fully replaces the ember bloom in that
          region. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, quartzLayerStyle]}
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient
              id="rg-quartz-bright"
              cx="22%"
              cy="28%"
              rx="55%"
              ry="55%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={THEME.quartz.base} stopOpacity="0.22" />
              <Stop offset="1" stopColor={THEME.quartz.base} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#rg-quartz-bright)" />
        </Svg>
      </Animated.View>

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
