/**
 * StageTimer — slurper-class three-segment progress bar driven by elapsed
 * seconds. Pure presentational: parent owns the elapsed clock.
 *
 * One segment per stage in `breakdown`. The segment for `activeStageIdx` fills
 * smoothly from 0 to 1 across that stage's duration. Earlier segments are
 * solid; later segments are empty.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { HeatTimeStage } from '../../data/bangers';
import { colors, fonts, radius, spacing } from '../tokens';

/** Re-exported alias matching the public prop-type contract. */
export type HeatTimeBreakdownStage = HeatTimeStage;

interface Props {
  readonly breakdown: readonly HeatTimeBreakdownStage[];
  readonly activeStageIdx: number;
  readonly elapsedSec: number;
}

interface SegmentProps {
  readonly status: 'past' | 'active' | 'future';
  readonly fillProgress: number;
}

function Segment({ status, fillProgress }: SegmentProps) {
  const fillStyle = useAnimatedStyle(() => {
    if (status === 'past') return { width: '100%' as const };
    if (status === 'future') return { width: '0%' as const };
    const pct = Math.max(0, Math.min(1, fillProgress)) * 100;
    return { width: withTiming(`${pct}%`, { duration: 250 }) };
  }, [status, fillProgress]);

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fillStyle]} />
    </View>
  );
}

export function StageTimer({ breakdown, activeStageIdx, elapsedSec }: Props) {
  const activeStage = breakdown[activeStageIdx];

  const stageElapsed = useMemo(() => {
    let consumed = 0;
    for (let i = 0; i < activeStageIdx && i < breakdown.length; i += 1) {
      consumed += breakdown[i].duration_seconds;
    }
    return Math.max(0, elapsedSec - consumed);
  }, [breakdown, activeStageIdx, elapsedSec]);

  const activeProgress = useMemo(() => {
    if (!activeStage || activeStage.duration_seconds === 0) return 0;
    return Math.max(0, Math.min(1, stageElapsed / activeStage.duration_seconds));
  }, [activeStage, stageElapsed]);

  const remainingSec = activeStage
    ? Math.max(0, Math.ceil(activeStage.duration_seconds - stageElapsed))
    : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.barRow}>
        {breakdown.map((stage, idx) => {
          const status: SegmentProps['status'] =
            idx < activeStageIdx ? 'past' : idx === activeStageIdx ? 'active' : 'future';
          return (
            <Segment
              key={`${stage.stage}-${idx}`}
              status={status}
              fillProgress={status === 'active' ? activeProgress : 0}
            />
          );
        })}
      </View>
      <View style={styles.captionRow}>
        <Text style={styles.stageLabel}>
          {activeStage ? activeStage.stage.replace(/_/g, ' ').toUpperCase() : ''}
        </Text>
        <Text style={styles.timer}>{remainingSec}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 8,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: colors.emberBright,
    borderRadius: radius.full,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stageLabel: {
    ...fonts.labelCaps,
    color: colors.bone90,
  },
  timer: {
    ...fonts.body,
    color: colors.emberBright,
    fontVariant: ['tabular-nums'],
  },
});

export default StageTimer;
