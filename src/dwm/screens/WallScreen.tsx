import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { WallGrid } from '../primitives/WallGrid';
import { Stepper } from '../primitives/Stepper';
import { BackChip } from '../primitives/BackChip';
import { WALL_THICKNESSES } from '../../data/wallThicknesses';
import type { WallThickness } from '../../data/wallThicknesses';
import { PHASE_COPY } from '../flow/copy';
import type { DwmPhase } from '../backgrounds/PhaseBackground';

const STEP_TO_PHASE: ReadonlyArray<DwmPhase> = ['banger', 'concentrate', 'wall', 'review'];

export interface WallScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSetPhase: (phase: DwmPhase) => void;
}

export default function WallScreen({ selectedId, onSelect, onSetPhase }: WallScreenProps) {
  const copy = PHASE_COPY.wall;

  const items = WALL_THICKNESSES.map((w): WallThickness & { id: string; name: string; meta?: string } => ({
    ...w,
    meta: w.thickness_mm_range != null ? `${w.thickness_mm_range} mm` : undefined,
  }));

  const handleTapStep = useCallback(
    (idx: number) => {
      const target = STEP_TO_PHASE[idx];
      if (target != null) onSetPhase(target);
    },
    [onSetPhase],
  );

  const handleBack = useCallback(() => onSetPhase('concentrate'), [onSetPhase]);

  return (
    <View style={styles.well}>
      <Stepper count={4} current={2} onTapStep={handleTapStep} />
      <BackChip onPress={handleBack} />
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}
      <WallGrid
        items={items}
        selectedId={selectedId ?? undefined}
        onSelect={(item) => onSelect(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    gap: 6,
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.035 * 26,
    color: palette.fg,
  },
  sub: {
    fontFamily: fontStack.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
  },
});
