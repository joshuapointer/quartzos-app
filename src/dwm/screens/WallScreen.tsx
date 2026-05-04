import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { WallGrid } from '../primitives/WallGrid';
import { Stepper } from '../primitives/Stepper';
import { WALL_THICKNESSES } from '../../data/wallThicknesses';
import type { WallThickness } from '../../data/wallThicknesses';
import { PHASE_COPY } from '../flow/copy';

export interface WallScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function WallScreen({ selectedId, onSelect }: WallScreenProps) {
  const copy = PHASE_COPY.wall;

  const items = WALL_THICKNESSES.map((w): WallThickness & { id: string; name: string; meta?: string } => ({
    ...w,
    meta: w.thickness_mm_range != null ? `${w.thickness_mm_range} mm` : undefined,
  }));

  return (
    <View style={styles.well}>
      <Stepper count={3} current={2} />
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
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
    color: palette.accentDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.display,
    fontSize: 20,
    letterSpacing: -0.03 * 20,
    color: palette.fg,
  },
});
