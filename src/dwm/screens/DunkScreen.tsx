import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fontStack, layout } from '../tokens';
import { PhaseStrip } from '../primitives/PhaseStrip';
import { PressableButton } from '../primitives/PressableButton';
import { PHASE_COPY } from '../flow/copy';
import { PeekIn } from '../primitives/PeekIn';

interface Props {
  sessionElapsedS: number;
  onForceAdvance: () => void;
}

function fmtSession(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Phase 5 (`dunk`) renders prototype's `clean` phase content per parity audit
// — see PHASE_COPY.dunk and BUB_BY_PHASE.dunk.
export default function DunkScreen({ sessionElapsedS, onForceAdvance }: Props) {
  const copy = PHASE_COPY.dunk;
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;
  return (
    <View style={styles.well}>
      <PeekIn delay={0}><PhaseStrip current={4} /></PeekIn>
      <PeekIn delay={80}><Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text></PeekIn>
      <PeekIn delay={140}><Text style={styles.headline}>{copy.headline}</Text></PeekIn>
      {copy.sub.length > 0 && <PeekIn delay={200}><Text style={styles.sub}>{copy.sub}</Text></PeekIn>}
      <PeekIn delay={260}>
        <View style={styles.fallback}>
          <PressableButton
            label="all done"
            variant="ghost"
            fullWidth={false}
            onPress={onForceAdvance}
          />
        </View>
      </PeekIn>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 6,
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
    fontSize: 14,
    lineHeight: 19,
    color: palette.muted,
    letterSpacing: -0.01 * 14,
    marginTop: 2,
  },
  fallback: {
    alignItems: 'center',
    marginTop: 10,
  },
});
