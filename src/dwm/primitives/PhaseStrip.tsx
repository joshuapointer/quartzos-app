import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../tokens';

// Mirrors the prototype `.phase-strip` (5-step indicator across heat / cool /
// dab / dunk / clean). Renders as 5 thin rounded bars with done/current/upcoming
// states. Always 5 steps — matches the prototype exactly.
interface Props {
  current: number; // 0..4
}

const COUNT = 5;

export function PhaseStrip({ current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: COUNT }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;

        if (isCurrent) {
          // Half-fill gradient: accent on left, border on right
          return (
            <View key={i} style={styles.cell}>
              <LinearGradient
                colors={[palette.accent, palette.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bar}
              />
            </View>
          );
        }
        return (
          <View
            key={i}
            style={[styles.bar, isDone ? styles.barDone : styles.barUpcoming]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  cell: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  barDone: {
    backgroundColor: palette.accent,
  },
  barUpcoming: {
    backgroundColor: palette.border,
  },
});
