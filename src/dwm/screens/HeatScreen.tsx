import React from 'react';
import { View, StyleSheet } from 'react-native';
import { layout } from '../tokens';
import { Banner } from '../primitives/Banner';
import { PressableButton } from '../primitives/PressableButton';
import { PHASE_COPY } from '../flow/copy';

export interface HeatScreenProps {
  secondsLeft: number;
  secondsTotal: number;
  torchOn: boolean;
  onSkip: () => void;
  showFallback: boolean;
  onForceAdvance: () => void;
}

export default function HeatScreen({
  secondsLeft,
  secondsTotal,
  torchOn,
  showFallback,
  onForceAdvance,
}: HeatScreenProps) {
  const copy = PHASE_COPY.heating;
  const progress = secondsTotal > 0 ? 1 - secondsLeft / secondsTotal : 0;
  const hint = torchOn ? 'torch on' : "spark the torch — i'll start the timer";

  return (
    <View style={styles.well}>
      <Banner
        eyebrow={copy.eyebrow}
        primary={secondsLeft}
        unit="sec"
        progress={progress}
        hint={hint}
        mood="peach"
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
    gap: 12,
  },
  fallback: {
    alignItems: 'center',
  },
});
