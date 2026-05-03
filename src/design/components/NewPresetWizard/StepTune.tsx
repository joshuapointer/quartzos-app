import React, { useEffect, useRef } from 'react';
import { PanResponder, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Rect as SvgRect } from 'react-native-svg';
import { computeDisplayedTarget } from '../../../utils/calibration';
import { colors, spacing } from '../../tokens';
import {
  GAUGE_PAD,
  GAUGE_PX_PER_DEG,
  GAUGE_TRACK_Y,
  GAUGE_W,
  PX_PER_DEGREE,
  TEMP_RANGE,
} from './constants';
import { styles } from './styles';
import { tempColorFor } from './utils';
import type { TuneStepProps } from './types';

function ThermalGauge({ offset }: { offset: number }) {
  const cx = GAUGE_W / 2;
  const cursorX = cx + offset * GAUGE_PX_PER_DEG;
  const fillLeft = Math.min(cx, cursorX);
  const fillW = Math.abs(offset) * GAUGE_PX_PER_DEG;
  const isWarm = offset > 0;
  const fillColor = isWarm ? colors.ember : colors.quartz;
  const cursorColor = isWarm
    ? colors.emberBright
    : offset < 0
      ? colors.quartzBright
      : colors.bone35;

  return (
    <Svg width={GAUGE_W} height={28} style={{ marginTop: 12 }}>
      {/* Track */}
      <SvgRect
        x={GAUGE_PAD}
        y={GAUGE_TRACK_Y}
        width={GAUGE_W - GAUGE_PAD * 2}
        height={2}
        rx={1}
        fill={colors.surface5}
      />
      {/* Fill */}
      {fillW > 0.5 && (
        <SvgRect
          x={fillLeft}
          y={GAUGE_TRACK_Y}
          width={fillW}
          height={2}
          rx={1}
          fill={fillColor}
          opacity={0.75}
        />
      )}
      {/* Center marker */}
      <SvgRect
        x={cx - 0.75}
        y={GAUGE_TRACK_Y - 4}
        width={1.5}
        height={10}
        rx={0.75}
        fill={colors.bone35}
      />
      {/* Minor ticks at ±10, ±20 */}
      {[-20, -10, 10, 20].map((d) => (
        <SvgRect
          key={d}
          x={cx + d * GAUGE_PX_PER_DEG - 0.5}
          y={GAUGE_TRACK_Y - 2}
          width={1}
          height={6}
          rx={0.5}
          fill={colors.bone20}
        />
      ))}
      {/* Cursor */}
      <SvgRect
        x={cursorX - 1}
        y={GAUGE_TRACK_Y - 6}
        width={2}
        height={14}
        rx={1}
        fill={cursorColor}
      />
    </Svg>
  );
}

export function StepTune({ calibration, tempOffset, onChangeOffset }: TuneStepProps) {
  const startOffsetRef = useRef(0);
  const lastDegRef = useRef(0);
  const lastHapticBucketRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startOffsetRef.current = lastDegRef.current;
        lastHapticBucketRef.current = Math.floor(Math.abs(lastDegRef.current) / 5);
      },
      onPanResponderMove: (_, gesture) => {
        const delta = -Math.round(gesture.dy / PX_PER_DEGREE);
        const next = Math.max(
          -TEMP_RANGE,
          Math.min(TEMP_RANGE, startOffsetRef.current + delta),
        );
        if (next !== lastDegRef.current) {
          const bucket = Math.floor(Math.abs(next) / 5);
          if (bucket !== lastHapticBucketRef.current) {
            lastHapticBucketRef.current = bucket;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          lastDegRef.current = next;
          onChangeOffset(next);
        }
      },
      onPanResponderRelease: () => {
        startOffsetRef.current = lastDegRef.current;
      },
    }),
  ).current;

  useEffect(() => {
    lastDegRef.current = tempOffset;
    startOffsetRef.current = tempOffset;
  }, [tempOffset]);

  const finalTemp = calibration?.displayedF ?? 0;
  const trace = calibration?.trace ?? [];

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tempBlock} {...panResponder.panHandlers}>
        <Text style={[styles.tempValue, { color: tempColorFor(tempOffset) }]}>
          {finalTemp}°
        </Text>
        <Text style={styles.tempHint}>Drag to fine-tune</Text>
        <ThermalGauge offset={tempOffset} />
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.labelCaps}>Calibration breakdown</Text>
        {trace.length > 0 ? (
          trace.map((line, idx) => (
            <Text key={idx} style={styles.traceLine}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.thermalNote}>
            Pick a banger and concentrate to see the displayed-target math.
          </Text>
        )}
        {calibration && calibration.warnings.length > 0 ? (
          <View style={styles.warningBlock}>
            {calibration.warnings.map((w, idx) => (
              <Text key={idx} style={styles.warningText}>
                ⚠︎ {w}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
