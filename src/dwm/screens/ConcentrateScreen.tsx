import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Carousel } from '../primitives/Carousel';
import { Pill } from '../primitives/Pill';
import { Stepper } from '../primitives/Stepper';
import { BackChip } from '../primitives/BackChip';
import { getConcentrateIllustration } from '../illustrations';
import { CONCENTRATES } from '../../data/concentrates';
import type { Concentrate, ConcentrateCategory } from '../../data/concentrates';
import { PHASE_COPY } from '../flow/copy';
import type { DwmPhase } from '../backgrounds/PhaseBackground';

const CATEGORY_CHIPS: { id: ConcentrateCategory; label: string }[] = [
  { id: 'solventless', label: 'solventless' },
  { id: 'hydrocarbon', label: 'hydrocarbon' },
];

const STEP_TO_PHASE: ReadonlyArray<DwmPhase> = ['banger', 'concentrate', 'wall', 'review'];

export interface ConcentrateScreenProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSetPhase: (phase: DwmPhase) => void;
}

export default function ConcentrateScreen({ selectedId, onSelect, onSetPhase }: ConcentrateScreenProps) {
  const copy = PHASE_COPY.concentrate;
  const [activeChip, setActiveChip] = useState<string>('solventless');

  const filtered = CONCENTRATES.filter(
    (c) => !c.blocked && (activeChip === '' || c.category === activeChip),
  );

  const handleTapStep = useCallback(
    (idx: number) => {
      const target = STEP_TO_PHASE[idx];
      if (target != null) onSetPhase(target);
    },
    [onSetPhase],
  );

  const handleBack = useCallback(() => onSetPhase('banger'), [onSetPhase]);

  return (
    <View style={styles.well}>
      <View style={styles.header}>
        <Stepper count={4} current={1} onTapStep={handleTapStep} />
        <BackChip onPress={handleBack} />
        <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
        <Text style={styles.headline}>{copy.headline}</Text>
        {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}
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
    fontSize: 22,
    letterSpacing: -0.035 * 22,
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
