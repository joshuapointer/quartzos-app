import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

import { colors } from '../../tokens';
import { formatTemp } from '../../../utils/temperature';
import { BangerAnatomy } from '../BangerAnatomy';
import { IrAimHint } from '../IrAimHint';
import { StageTimer } from '../StageTimer';
import { CoolIcon, DabIcon, DunkIcon, CompleteIcon } from './StepIcons';
import { TorchTimer } from './TorchTimer';
import { LiveTempBadge } from './LiveTempBadge';
import { activeStageFromElapsed } from './utils';
import { styles } from './styles';
import type { StepBodyProps } from './types';

export function StepBody({
  step,
  stepIndex,
  torchDuration,
  onTorchComplete,
  onCta,
  dabAlarmF,
  dunkAlarmF,
  useCelsius,
  peakF,
  walkthroughStartedAt,
  banger,
  concentrate,
  sensor,
}: StepBodyProps) {
  const [elapsed, setElapsed] = useState(0);
  const [heatElapsed, setHeatElapsed] = useState(0);

  useEffect(() => {
    if (step.id !== 'complete') return;
    setElapsed(Math.floor((Date.now() - walkthroughStartedAt) / 1000));
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - walkthroughStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [step.id, walkthroughStartedAt]);

  const elapsedLabel =
    elapsed > 0
      ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
      : '0:00';

  if (step.id === 'prepare') {
    return (
      <View style={styles.stepCenterIcon}>
        <BangerAnatomy banger={banger} size={140} />
      </View>
    );
  }

  if (step.id === 'heat' || step.id === 'cold-heat') {
    const breakdown = banger.heat_time_breakdown;
    const hasBreakdown =
      step.id === 'heat' && breakdown != null && breakdown.length > 0;
    const activeStageIdx =
      hasBreakdown && breakdown
        ? activeStageFromElapsed(breakdown, heatElapsed)
        : undefined;

    return (
      <View style={styles.stepCenterIcon}>
        <View style={styles.heatRow}>
          <TorchTimer
            key={stepIndex}
            durationSeconds={torchDuration}
            onComplete={onTorchComplete}
            onElapsedChange={hasBreakdown ? setHeatElapsed : undefined}
          />
          {step.id === 'heat' ? (
            <View style={styles.bangerSlot}>
              <BangerAnatomy
                banger={banger}
                size={120}
                showZones
                activeZoneIdx={activeStageIdx}
              />
            </View>
          ) : null}
        </View>
        {hasBreakdown && breakdown ? (
          <View style={styles.stageTimerSlot}>
            <StageTimer
              breakdown={breakdown}
              activeStageIdx={activeStageIdx ?? 0}
              elapsedSec={heatElapsed}
            />
          </View>
        ) : null}
        {step.id === 'heat' ? (
          <Text style={styles.visualCue}>Stop when: {banger.visual_cue}</Text>
        ) : null}
      </View>
    );
  }

  if (step.id === 'cold-load') {
    return (
      <View style={styles.stepCenterIcon}>
        <BangerAnatomy banger={banger} size={140} />
      </View>
    );
  }

  if (step.id === 'cool') {
    return (
      <View style={styles.stepCenterIcon}>
        <CoolIcon size={64} />
        <View style={{ height: 18 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={styles.targetPill}>
          <Text style={styles.targetPillText}>TARGET  {formatTemp(dabAlarmF, useCelsius)}</Text>
        </View>
        <View style={{ height: 16 }} />
        <View style={styles.aimHintSlot}>
          <IrAimHint banger={banger} sensor={sensor} />
        </View>
      </View>
    );
  }

  if (step.id === 'dab') {
    return (
      <View style={styles.stepCenterIcon}>
        <DabIcon size={64} />
        <View style={{ height: 18 }} />
        <LiveTempBadge dabAlarmF={dabAlarmF} useCelsius={useCelsius} />
        <View style={{ height: 12 }} />
        <View style={[styles.targetPill, { borderColor: colors.quartz + '44' }]}>
          <Text style={[styles.targetPillText, { color: colors.quartz }]}>DUNK AT  {formatTemp(dunkAlarmF, useCelsius)}</Text>
        </View>
        {concentrate.notes[0] ? (
          <Text style={styles.visualCue}>{concentrate.notes[0]}</Text>
        ) : null}
      </View>
    );
  }

  if (step.id === 'dunk') {
    return (
      <View style={styles.stepCenterIcon}>
        <DunkIcon size={72} />
      </View>
    );
  }

  if (step.id === 'complete') {
    return (
      <View style={styles.stepCenterIcon}>
        <CompleteIcon size={72} />
        <View style={{ height: 28 }} />
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{formatTemp(peakF, useCelsius)}</Text>
            <Text style={styles.statLabel}>PEAK TEMP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{elapsedLabel}</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}
