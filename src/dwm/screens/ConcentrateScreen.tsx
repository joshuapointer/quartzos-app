import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Carousel } from '../primitives/Carousel';
import { Pill } from '../primitives/Pill';
import { Stepper } from '../primitives/Stepper';
import { getConcentrateIllustration } from '../illustrations';
import { CONCENTRATES } from '../../data/concentrates';
import type { Concentrate, ConcentrateCategory } from '../../data/concentrates';
import { PHASE_COPY } from '../flow/copy';

const CATEGORY_CHIPS: { id: ConcentrateCategory; label: string }[] = [
  { id: 'solventless', label: 'solventless' },
  { id: 'hydrocarbon', label: 'hydrocarbon' },
];

export interface ConcentrateScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConcentrateScreen({ selectedId, onSelect }: ConcentrateScreenProps) {
  const copy = PHASE_COPY.concentrate;
  const [activeChip, setActiveChip] = useState<string>('solventless');

  const filtered = CONCENTRATES.filter(
    (c) => !c.blocked && (activeChip === '' || c.category === activeChip),
  );

  return (
    <View style={styles.well}>
      <View style={styles.header}>
        <Stepper count={3} current={1} />
        <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
        <Text style={styles.headline}>{copy.headline}</Text>
      </View>

      <Carousel
        items={filtered as Concentrate[]}
        keyExtractor={(c) => c.id}
        onSelect={(c) => onSelect(c.id)}
        chips={CATEGORY_CHIPS.map((ch) => ({ id: ch.id, label: ch.label }))}
        activeChipId={activeChip}
        onChipChange={setActiveChip}
        renderItem={(c, isActive) => {
          const Illo = getConcentrateIllustration(c.id);
          const isSelected = c.id === selectedId;
          const optF = c.surface_temp_optimal_f;
          return (
            <View style={[styles.card, isActive && styles.cardActive, isSelected && styles.cardSelected]}>
              {Illo != null && (
                <View style={styles.illoWrap}>
                  <Illo size={120} accent={palette.accent} />
                </View>
              )}
              <Text style={styles.cardName}>{c.name}</Text>
              <View style={styles.pillRow}>
                <Pill label={c.category} variant={c.category === 'solventless' ? 'mint' : 'butter'} />
                {optF != null && <Pill label={`${optF}°`} variant="neutral" />}
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    flex: 1,
    gap: 12,
  },
  header: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 4,
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
  card: {
    flex: 1,
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  cardActive: {
    backgroundColor: palette.surface,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: palette.accent,
  },
  illoWrap: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontFamily: fontStack.display,
    fontSize: 18,
    letterSpacing: -0.02 * 18,
    color: palette.fg,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardDesc: {
    fontFamily: fontStack.body,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
  },
});
