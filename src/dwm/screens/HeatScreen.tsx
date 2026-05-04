import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, palette, fontStack } from '../tokens';
import { Banner } from '../primitives/Banner';
import { PressableButton } from '../primitives/PressableButton';
import { PhaseStrip } from '../primitives/PhaseStrip';
import { PHASE_COPY } from '../flow/copy';

export interface HeatScreenProps {
  secondsLeft: number;
  secondsTotal: number;
  torchOn: boolean;
  onSkip: () => void;
  showFallback: boolean;
  onForceAdvance: () => void;
  sessionElapsedS: number;
}

function fmtSession(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function HeatScreen({
  secondsLeft,
  secondsTotal,
  torchOn,
  showFallback,
  onForceAdvance,
  sessionElapsedS,
}: HeatScreenProps) {
  const copy = PHASE_COPY.heating;
  const progress = secondsTotal > 0 ? 1 - secondsLeft / secondsTotal : 0;
  const hint = torchOn ? 'low · even · sweep' : "spark the torch — i'll start the timer";
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;
  const bannerLabel = torchOn ? 'TORCH ON' : 'LISTENING';

  return (
    <View style={styles.well}>
      <PhaseStrip current={0} />
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Banner
        eyebrow={bannerLabel}
        primary={secondsLeft}
        unit="sec"
        progress={progress}
        hint={hint}
        mood={torchOn ? 'peach' : 'lilac'}
      />
      {showFallback && (
        <View style={styles.fallback}>
          <PressableButton
            label="tap if it's hot enough"
            variant="ghost"
            fullWidth={false}
            onPress={onForceAdvance}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 8,
  },
  headline: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.035 * 26,
    color: palette.fg,
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  fallback: {
    alignItems: 'center',
  },
});
