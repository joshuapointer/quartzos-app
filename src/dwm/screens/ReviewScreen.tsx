import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Card } from '../primitives/Card';
import { Pill } from '../primitives/Pill';
import { HintLabel } from '../primitives/HintLabel';
import { getBangerIllustration, getConcentrateIllustration } from '../illustrations';
import { PHASE_COPY } from '../flow/copy';
import type { Banger } from '../../data/bangers';
import type { Concentrate } from '../../data/concentrates';
import type { WallThickness } from '../../data/wallThicknesses';

export interface ReviewScreenProps {
  banger: Banger;
  concentrate: Concentrate;
  wall: WallThickness;
  onHoldComplete: () => void;
}

export default function ReviewScreen({ banger, concentrate, wall }: ReviewScreenProps) {
  const copy = PHASE_COPY.review;
  const optF = concentrate.surface_temp_optimal_f;

  const BangerIllo = getBangerIllustration(banger.id);
  const ConcentrateIllo = getConcentrateIllustration(concentrate.id);

  return (
    <View style={styles.well}>
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>

      <View style={styles.cards}>
        <Card
          glyph={BangerIllo != null
            ? { tint: 'peach', icon: <BangerIllo size={28} accent={palette.accent} /> }
            : undefined}
          title={banger.name}
          sub={<Pill label={banger.category} variant="neutral" />}
        />
        <Card
          glyph={ConcentrateIllo != null
            ? { tint: 'mint', icon: <ConcentrateIllo size={28} accent={palette.mint} /> }
            : undefined}
          title={concentrate.name}
          sub={
            <View style={styles.pillRow}>
              <Pill label={concentrate.category} variant={concentrate.category === 'solventless' ? 'mint' : 'butter'} />
              {optF != null && <Pill label={`${optF}°`} variant="peach" />}
            </View>
          }
        />
        <Card
          title={wall.name}
          sub={wall.description}
        />
      </View>

      <View style={styles.hintRow}>
        <HintLabel label={copy.sub} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 10,
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.accentDeep,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headline: {
    fontFamily: fontStack.display,
    fontSize: 22,
    letterSpacing: -0.03 * 22,
    color: palette.fg,
    textAlign: 'center',
  },
  cards: {
    gap: 8,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  hintRow: {
    alignItems: 'center',
    marginTop: 4,
  },
});
