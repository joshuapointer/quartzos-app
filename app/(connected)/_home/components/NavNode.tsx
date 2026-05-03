import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle as SvgCircle,
  Polyline,
  Line as SvgLine,
} from 'react-native-svg';
import { colors } from '../../../../src/design/tokens';
import { NAV_LABELS } from '../constants';
import type { SceneId } from '../types';

// ─── Nav Node Icon ────────────────────────────────────────────────────────────

function NavNodeIcon({ sceneId, active }: { sceneId: SceneId; active: boolean }) {
  const c = active ? colors.emberBright : colors.bone50;

  if (sceneId === 'presets') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M10 2 L18 10 L10 18 L2 10 Z" stroke={c} strokeWidth={1.3} fill="none" />
        <Path d="M10 6 L14 10 L10 14 L6 10 Z" stroke={c} strokeWidth={0.7} fill="none" opacity={0.5} />
        <SvgCircle cx={10} cy={10} r={1.5} fill={c} opacity={0.7} />
      </Svg>
    );
  }

  if (sceneId === 'history') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Polyline
          points="1,10 4,10 6,14 9,4 12,12 14,8 16,10 19,10"
          stroke={c}
          strokeWidth={1.4}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // configure
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <SvgLine x1={3} y1={6} x2={17} y2={6} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgLine x1={3} y1={10} x2={17} y2={10} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgLine x1={3} y1={14} x2={17} y2={14} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgCircle cx={7} cy={6} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
      <SvgCircle cx={13} cy={10} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
      <SvgCircle cx={8} cy={14} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
    </Svg>
  );
}

// ─── Nav Node ─────────────────────────────────────────────────────────────────

export function NavNode({ sceneId, active, onPress }: { sceneId: SceneId; active: boolean; onPress: () => void }) {
  const glow = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    glow.value = withSpring(active ? 1 : 0, { damping: 22, stiffness: 180 });
  }, [active]);

  const iconAnim = useAnimatedStyle(() => ({
    opacity: 0.22 + glow.value * 0.72,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const label = NAV_LABELS[sceneId] ?? sceneId.toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={styles.navNodeTouch}
      hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
    >
      <Animated.View style={[iconAnim, styles.navNodeInner]}>
        <NavNodeIcon sceneId={sceneId} active={active} />
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  navNodeTouch: {
    width: 56,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navNodeInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.4,
    color: colors.bone35,
  },
  navLabelActive: {
    color: colors.bone100,
  },
});
