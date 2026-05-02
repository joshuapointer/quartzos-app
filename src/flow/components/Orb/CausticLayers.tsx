import React from 'react';
import type { ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import { THEME } from '../../theme';
import { styles } from './styles';

// ─── CausticLayer1 ────────────────────────────────────────────────────────────

interface CausticLayerProps {
  size: number;
  animStyle: AnimatedStyle<ViewStyle>;
}

export function CausticLayer1({ size, animStyle }: CausticLayerProps) {
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
      style={[styles.causticAbs, animStyle]}
    >
      <Svg width={size * 1.4} height={size * 1.4} viewBox="0 0 400 400">
        <G opacity={0.32}>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <Circle
              key={deg}
              cx={200}
              cy={200}
              r={140 + (i % 2) * 18}
              fill="none"
              stroke={THEME.quartz.bright}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray={i % 2 === 0 ? '40 360' : '24 376'}
              transform={`rotate(${deg} 200 200)`}
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

// ─── CausticLayer2 ────────────────────────────────────────────────────────────

export function CausticLayer2({ size, animStyle }: CausticLayerProps) {
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
      style={[styles.causticAbs, animStyle]}
    >
      <Svg width={size * 1.4} height={size * 1.4} viewBox="0 0 400 400">
        <G opacity={0.18}>
          {[30, 90, 150, 210, 270, 330].map((deg, i) => (
            <Circle
              key={deg}
              cx={200}
              cy={200}
              r={120 + (i % 3) * 12}
              fill="none"
              stroke={THEME.bone[100]}
              strokeOpacity={0.20}
              strokeWidth={1}
              strokeDasharray={i % 2 === 0 ? '20 380' : '8 392'}
              transform={`rotate(${deg} 200 200)`}
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

// ─── SessionArc ───────────────────────────────────────────────────────────────

interface SessionArcProps {
  size: number;
  animStyle: AnimatedStyle<ViewStyle>;
}

export function SessionArc({ size, animStyle }: SessionArcProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
      style={[styles.sessionArcAbs, animStyle]}
    >
      <Svg width={size} height={size} pointerEvents="none">
        <Circle
          cx={cx}
          cy={cy}
          r={r - 2}
          fill="none"
          stroke={THEME.quartz.bright}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
          // Short arc segment — ~14% of the circumference, gap covers rest.
          strokeDasharray={`${2 * Math.PI * (r - 2) * 0.14} ${2 * Math.PI * (r - 2)}`}
        />
      </Svg>
    </Animated.View>
  );
}
