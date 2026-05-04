import React from 'react';
import { View, StyleSheet } from 'react-native';
import { layout } from '../tokens';
import { Banner } from '../primitives/Banner';
import { PressableButton } from '../primitives/PressableButton';
import { PHASE_COPY } from '../flow/copy';

export interface WindowScreenProps {
  liveTempF: number;
  targetF: number;
  useCelsius: boolean;
  showStuckFallback: boolean;
  onForceAdvance: () => void;
}

function toC(f: number): number {
  return Math.round((f - 32) * 5 / 9);
}

export default function WindowScreen({
  liveTempF,
  targetF,
  useCelsius,
  showStuckFallback,
  onForceAdvance,
}: WindowScreenProps) {
  const copy = PHASE_COPY.window;
  const withinWindow = Math.abs(liveTempF - targetF) <= 15;
  const mood = withinWindow ? 'mint' : 'lilac';
  const displayTemp = useCelsius ? toC(liveTempF) : Math.round(liveTempF);
  const unit = useCelsius ? '°C' : '°F';
  const hint = withinWindow ? "in the window — lift now" : "lift when i go green";

  return (
    <View style={styles.well}>
      <Banner
        eyebrow={copy.eyebrow}
        primary={displayTemp}
        unit={unit}
        hint={hint}
        mood={mood}
      />
      {showStuckFallback && (
        <View style={styles.fallback}>
          <PressableButton
            label="tap to dab now"
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
