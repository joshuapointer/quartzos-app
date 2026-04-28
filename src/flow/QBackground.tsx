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
 * pointerEvents="none" on the SVG so it never intercepts touches.
 */
import React, { memo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

interface Props {
  children?: React.ReactNode;
}

function QBackground({ children }: Props) {
  const { width, height } = useWindowDimensions();

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

          {/* Layer 4: ember bright-left at 22% 28% */}
          <RadialGradient
            id="rg-ember-bright"
            cx="22%"
            cy="28%"
            rx="55%"
            ry="55%"
            gradientUnits="userSpaceOnUse"
          >
            {/* primary-container ember base at 22% */}
            <Stop offset="0" stopColor="#ff7a00" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#ff7a00" stopOpacity="0" />
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
        {/* Ember bright left */}
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
