import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { Card } from '../primitives/Card';
import { PHASE_COPY } from '../flow/copy';

export interface CompleteScreenProps {
  peakF: number;
  bangerName: string;
  durationLabel: string | null;
  onAgain: () => void;
  onNew: () => void;
}

export default function CompleteScreen({
  peakF,
  bangerName,
  durationLabel,
  onAgain,
  onNew,
}: CompleteScreenProps) {
  const copy = PHASE_COPY.complete;

  return (
    <View style={styles.well}>
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}

      <View style={styles.statsGrid}>
        <Card
          title={`${Math.round(peakF)}°`}
          sub="peak temp"
        />
        <Card
          title={bangerName}
          sub="banger"
        />
        {durationLabel != null && (
          <Card
            title={durationLabel}
            sub="window"
          />
        )}
        <Card
          title="good sesh"
          sub="well done"
        />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionCard}>
          <Card
            title="Again"
            sub="same sesh"
            chevron
            onPress={onAgain}
          />
        </View>
        <View style={styles.actionCard}>
          <Card
            title="New"
            sub="fresh build"
            chevron
            onPress={onNew}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 14,
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
    fontSize: 24,
    letterSpacing: -0.03 * 24,
    color: palette.fg,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fontStack.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    textAlign: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCard: {
    flex: 1,
  },
});
