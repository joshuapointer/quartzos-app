import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout, radii } from '../tokens';
import { Stepper } from '../primitives/Stepper';
import { BackChip } from '../primitives/BackChip';
import { getBangerIllustration, getConcentrateIllustration } from '../illustrations';
import { PHASE_COPY, torchDurationFor } from '../flow/copy';
import type { DwmPhase } from '../backgrounds/PhaseBackground';
import type { Banger } from '../../data/bangers';
import type { Concentrate } from '../../data/concentrates';
import type { WallThickness } from '../../data/wallThicknesses';

const STEP_TO_PHASE: ReadonlyArray<DwmPhase> = ['banger', 'concentrate', 'wall', 'review'];

export interface ReviewScreenProps {
  banger: Banger;
  concentrate: Concentrate;
  wall: WallThickness;
  onHoldComplete: () => void;
  onSetPhase: (phase: DwmPhase) => void;
}

export default function ReviewScreen({
  banger,
  concentrate,
  wall,
  onSetPhase,
}: ReviewScreenProps) {
  const copy = PHASE_COPY.review;
  const dabF = concentrate.surface_temp_optimal_f ?? 480;
  // Same heuristic as the prototype: dunk ≈ 45% of dab°
  const dunkF = Math.round(dabF * 0.45);
  const torchS = torchDurationFor(banger.id);

  const BangerIllo = getBangerIllustration(banger.id);
  const ConcentrateIllo = getConcentrateIllustration(concentrate.id);

  const handleTapStep = useCallback(
    (idx: number) => {
      const target = STEP_TO_PHASE[idx];
      if (target != null) onSetPhase(target);
    },
    [onSetPhase],
  );

  const handleBack = useCallback(() => onSetPhase('wall'), [onSetPhase]);

  return (
    <View style={styles.well}>
      <Stepper count={4} current={3} onTapStep={handleTapStep} />
      <BackChip onPress={handleBack} />
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.lede}>{copy.sub}</Text>

      <View style={styles.pair}>
        <View style={styles.pairCell}>
          <View style={styles.pairIllo}>
            {BangerIllo != null && <BangerIllo size={64} accent={palette.accent} />}
          </View>
          <Text style={styles.pairName} numberOfLines={1}>{banger.name}</Text>
          <Text style={styles.pairMeta} numberOfLines={1}>{banger.category}</Text>
        </View>
        <Text style={styles.pairPlus}>{'+'}</Text>
        <View style={styles.pairCell}>
          <View style={styles.pairIllo}>
            {ConcentrateIllo != null && <ConcentrateIllo size={64} accent={palette.mint} />}
          </View>
          <Text style={styles.pairName} numberOfLines={1}>{concentrate.name}</Text>
          <Text style={styles.pairMeta} numberOfLines={1}>
            {wall.thickness_mm_range != null ? `${wall.thickness_mm_range} mm wall` : wall.name}
          </Text>
        </View>
      </View>

      <View style={styles.tempsRow}>
        <View style={styles.tempCell}>
          <Text style={styles.tempNum}>{`${dabF}°`}</Text>
          <Text style={styles.tempLbl}>DAB @</Text>
        </View>
        <View style={styles.tempCell}>
          <Text style={styles.tempNum}>{`${dunkF}°`}</Text>
          <Text style={styles.tempLbl}>DUNK @</Text>
        </View>
        <View style={styles.tempCell}>
          <Text style={styles.tempNum}>{`${torchS}s`}</Text>
          <Text style={styles.tempLbl}>TORCH</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 8,
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
  lede: {
    fontFamily: fontStack.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    maxWidth: 320,
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pairCell: {
    flex: 1,
    alignItems: 'center',
  },
  pairIllo: {
    width: 64,
    height: 64,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairName: {
    fontFamily: fontStack.display,
    fontSize: 13,
    color: palette.fg,
    letterSpacing: -0.01 * 13,
    textAlign: 'center',
  },
  pairMeta: {
    fontFamily: fontStack.mono,
    fontSize: 9,
    color: palette.muted,
    marginTop: 3,
    letterSpacing: 0.16 * 9,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pairPlus: {
    fontFamily: fontStack.display,
    fontSize: 28,
    color: palette.accent,
    paddingHorizontal: 4,
  },
  tempsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  tempCell: {
    flex: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tempNum: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 22,
    color: palette.fg,
    letterSpacing: -0.03 * 22,
    lineHeight: 24,
  },
  tempLbl: {
    fontFamily: fontStack.mono,
    fontSize: 9,
    color: palette.muted,
    marginTop: 4,
    letterSpacing: 0.16 * 9,
  },
});
