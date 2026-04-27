/**
 * Compact diagram + caption explaining where to point your sensor.
 *
 * For IR sensors: renders a small `BangerAnatomy` thumbnail with an animated
 * crosshair pulsing at the location described by `banger.ir_aim_location`.
 * Other sensor methods get a single caption tuned to that workflow.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { Banger } from '../../data/bangers';
import type { Sensor } from '../../data/sensors';
import { colors, fonts, radius, spacing } from '../tokens';

import { BangerAnatomy } from './BangerAnatomy';

interface Props {
  readonly banger: Banger;
  readonly sensor: Sensor;
}

type AimPosition =
  | 'top-center'
  | 'bottom-center'
  | 'bottom-side'
  | 'mid-side'
  | 'pid';

/** Map keywords in `ir_aim_location` to a positional anchor. */
function classifyAim(text: string): AimPosition {
  const t = text.toLowerCase();
  if (t.includes('pid set point') || t.includes('no ir')) return 'pid';
  if (t.includes('outer of dome') || t.includes('outside of dome')) return 'top-center';
  if (
    t.includes('center underside') ||
    t.includes('lowest curve') ||
    t.includes('inner bucket floor') ||
    t.includes('host banger bottom') ||
    t.includes('center of opaque')
  ) {
    return 'bottom-center';
  }
  if (t.includes('outer base') || t.includes('outer bottom')) {
    return 'bottom-side';
  }
  if (
    t.includes('side of cup') ||
    t.includes('side of bucket') ||
    t.includes('side of column') ||
    t.includes('side of chamber') ||
    t.includes('side of the tower') ||
    t.includes('side of the chamber') ||
    t.includes('side of the cup') ||
    t.includes('mid-height')
  ) {
    return 'mid-side';
  }
  return 'mid-side';
}

const THUMB_VB_W = 100;
const THUMB_VB_H = 120;

function aimCoords(pos: AimPosition): { cx: number; cy: number } {
  switch (pos) {
    case 'top-center':
      return { cx: 50, cy: 52 };
    case 'bottom-center':
      return { cx: 50, cy: 100 };
    case 'bottom-side':
      return { cx: 14, cy: 96 };
    case 'mid-side':
      return { cx: 14, cy: 78 };
    case 'pid':
      return { cx: 50, cy: 78 };
  }
}

interface CrosshairProps {
  readonly size: number;
  readonly position: AimPosition;
}

function CrosshairOverlay({ size, position }: CrosshairProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 1 + pulse.value * 0.18 }],
  }));

  const { cx, cy } = aimCoords(position);
  const height = size * (THUMB_VB_H / THUMB_VB_W);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { width: size, height }, animatedStyle]}
    >
      <Svg width={size} height={height} viewBox={`0 0 ${THUMB_VB_W} ${THUMB_VB_H}`}>
        <Circle cx={cx} cy={cy} r={6} fill="none" stroke={colors.emberBright} strokeWidth={1.6} />
        <Circle cx={cx} cy={cy} r={1.6} fill={colors.emberBright} />
        <Line x1={cx - 10} x2={cx - 7} y1={cy} y2={cy} stroke={colors.emberBright} strokeWidth={1.4} />
        <Line x1={cx + 7} x2={cx + 10} y1={cy} y2={cy} stroke={colors.emberBright} strokeWidth={1.4} />
        <Line x1={cx} x2={cx} y1={cy - 10} y2={cy - 7} stroke={colors.emberBright} strokeWidth={1.4} />
        <Line x1={cx} x2={cx} y1={cy + 7} y2={cy + 10} stroke={colors.emberBright} strokeWidth={1.4} />
      </Svg>
    </Animated.View>
  );
}

export function IrAimHint({ banger, sensor }: Props) {
  if (sensor.method === 'contact') {
    return (
      <View style={styles.captionOnly}>
        <Text style={styles.label}>PROBE</Text>
        <Text style={styles.caption}>Probe surface — reading IS the temp.</Text>
      </View>
    );
  }

  if (sensor.method === 'enail') {
    return (
      <View style={styles.captionOnly}>
        <Text style={styles.label}>E-NAIL</Text>
        <Text style={styles.caption}>PID set point — no aim needed.</Text>
      </View>
    );
  }

  if (sensor.method === 'visual') {
    return (
      <View style={styles.captionOnly}>
        <Text style={styles.label}>VISUAL</Text>
        <Text style={styles.caption}>{banger.visual_cue}</Text>
      </View>
    );
  }

  // IR
  const size = 80;
  const position = classifyAim(banger.ir_aim_location);
  return (
    <View style={styles.row}>
      <View style={[styles.thumbWrap, { width: size, height: size * (THUMB_VB_H / THUMB_VB_W) }]}>
        <BangerAnatomy banger={banger} size={size} />
        <CrosshairOverlay size={size} position={position} />
      </View>
      <View style={styles.captionWrap}>
        <Text style={styles.label}>IR AIM</Text>
        <Text style={styles.caption}>{banger.ir_aim_location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  thumbWrap: {
    position: 'relative',
  },
  captionWrap: {
    flex: 1,
  },
  captionOnly: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  label: {
    ...fonts.labelCaps,
    color: colors.emberBright,
    marginBottom: spacing.xs,
  },
  caption: {
    ...fonts.body,
    color: colors.bone90,
  },
});

export default IrAimHint;
