import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { HintLabel } from '../primitives/HintLabel';
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
      <View style={styles.hint}>
        <HintLabel label="hold me to find your dabrite" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    alignItems: 'center',
    gap: 8,
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
    maxWidth: 280,
  },
  hint: {
    marginTop: 8,
  },
});
