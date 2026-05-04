import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { PHASE_COPY } from '../flow/copy';

export interface ConnectScreenProps {
  onHoldComplete: () => void;
}

export default function ConnectScreen(_props: ConnectScreenProps) {
  const copy = PHASE_COPY.cold;
  return (
    <View style={styles.well}>
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.sub}>{copy.sub}</Text>
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
  sub: {
    fontFamily: fontStack.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.muted,
    maxWidth: 320,
  },
});
