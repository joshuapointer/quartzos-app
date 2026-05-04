import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { PhaseStrip } from '../primitives/PhaseStrip';
import { PHASE_COPY } from '../flow/copy';

interface Props {
  sessionElapsedS: number;
}

function fmtSession(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Phase 5 (`dunk`) renders prototype's `clean` phase content per parity audit
// — see PHASE_COPY.dunk and BUB_BY_PHASE.dunk.
export default function DunkScreen({ sessionElapsedS }: Props) {
  const copy = PHASE_COPY.dunk;
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;
  return (
    <View style={styles.well}>
      <PhaseStrip current={4} />
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}
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
    color: palette.muted,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.035 * 26,
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
});
