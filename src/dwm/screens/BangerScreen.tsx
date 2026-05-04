import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Carousel } from '../primitives/Carousel';
import { Pill } from '../primitives/Pill';
import { Stepper } from '../primitives/Stepper';
import { BackChip } from '../primitives/BackChip';
import { getBangerIllustration } from '../illustrations';
import { BANGERS } from '../../data/bangers';
import type { Banger, BangerCategory } from '../../data/bangers';
import { PHASE_COPY } from '../flow/copy';
import type { DwmPhase } from '../backgrounds/PhaseBackground';

const CATEGORY_CHIPS: { id: BangerCategory; label: string }[] = [
  { id: 'classic',   label: 'classic' },
  { id: 'slurper',   label: 'slurper' },
  { id: 'specialty', label: 'specialty' },
  { id: 'premium',   label: 'premium' },
];

const STEP_TO_PHASE: ReadonlyArray<DwmPhase> = ['banger', 'concentrate', 'wall', 'review'];

export interface BangerScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSetPhase: (phase: DwmPhase) => void;
}

export default function BangerScreen({ selectedId, onSelect, onSetPhase }: BangerScreenProps) {
  const copy = PHASE_COPY.banger;
  const [activeChip, setActiveChip] = useState<string>('classic');

  const filtered = activeChip
    ? BANGERS.filter((b) => b.category === activeChip)
    : BANGERS;

  const handleTapStep = useCallback(
    (idx: number) => {
      const target = STEP_TO_PHASE[idx];
      if (target != null) onSetPhase(target);
    },
    [onSetPhase],
  );

  const handleBack = useCallback(() => onSetPhase('presets'), [onSetPhase]);

  return (
    <View style={styles.well}>
      <View style={styles.header}>
        <Stepper count={4} current={0} onTapStep={handleTapStep} />
        <BackChip label="home" onPress={handleBack} />
        <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
        <Text style={styles.headline}>{copy.headline}</Text>
        {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}
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
