import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Carousel } from '../primitives/Carousel';
import { Pill } from '../primitives/Pill';
import { Stepper } from '../primitives/Stepper';
import { getBangerIllustration } from '../illustrations';
import { BANGERS } from '../../data/bangers';
import type { Banger, BangerCategory } from '../../data/bangers';
import { PHASE_COPY } from '../flow/copy';

const CATEGORY_CHIPS: { id: BangerCategory; label: string }[] = [
  { id: 'classic',   label: 'classic' },
  { id: 'slurper',   label: 'slurper' },
  { id: 'specialty', label: 'specialty' },
  { id: 'premium',   label: 'premium' },
];

export interface BangerScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function BangerScreen({ selectedId, onSelect }: BangerScreenProps) {
  const copy = PHASE_COPY.banger;
  const [activeChip, setActiveChip] = useState<string>('classic');

  const filtered = activeChip
    ? BANGERS.filter((b) => b.category === activeChip)
    : BANGERS;

  return (
    <View style={styles.well}>
      <View style={styles.header}>
        <Stepper count={3} current={0} />
        <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
        <Text style={styles.headline}>{copy.headline}</Text>
      </View>

      <Carousel
        items={filtered as Banger[]}
        keyExtractor={(b) => b.id}
        onSelect={(b) => onSelect(b.id)}
        chips={CATEGORY_CHIPS.map((c) => ({ id: c.id, label: c.label }))}
        activeChipId={activeChip}
        onChipChange={setActiveChip}
        renderItem={(b, isActive) => {
          const Illo = getBangerIllustration(b.id);
          const isSelected = b.id === selectedId;
          return (
            <View style={[styles.card, isActive && styles.cardActive, isSelected && styles.cardSelected]}>
              {Illo != null && (
                <View style={styles.illoWrap}>
                  <Illo size={120} accent={palette.accent} />
                </View>
              )}
              <Text style={styles.cardName}>{b.name}</Text>
              <Pill label={b.category} variant="neutral" />
              <Text style={styles.cardDesc} numberOfLines={2}>{b.description}</Text>
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
  cardDesc: {
    fontFamily: fontStack.body,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
  },
});
