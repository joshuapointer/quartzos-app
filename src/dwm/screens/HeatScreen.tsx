import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, palette, fontStack, radii } from '../tokens';
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
  torchOn,
  showFallback,
  onForceAdvance,
  sessionElapsedS,
}: HeatScreenProps) {
  const copy = PHASE_COPY.heating;
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;
  const pillLabel = torchOn ? 'torch on' : 'listening';
  const pillSub = torchOn ? 'low · even · sweep' : "spark the torch — i'll start the timer";
  const dotColor = torchOn ? palette.accent : palette.lilac;
  const pillBg = torchOn ? '#FDF3EE' : '#F5EDFB';
  const pillBorder = torchOn ? `${palette.accent}55` : `${palette.lilac}66`;

  return (
    <View style={styles.well}>
      <PhaseStrip current={0} />
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.sub}>{copy.sub}</Text>

      <View style={styles.spacer} />

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

      <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
        <View style={styles.pillLeft}>
          <View style={styles.pillLabelRow}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.pillLabel}>{pillLabel}</Text>
          </View>
          <Text style={styles.pillSub}>{pillSub.toUpperCase()}</Text>
        </View>
        <View style={styles.pillRight}>
          <Text style={styles.secondsValue}>{secondsLeft}</Text>
          <Text style={styles.secondsUnit}>SEC</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    flex: 1,
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
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  fallback: {
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pillLeft: {
    flex: 1,
    gap: 4,
  },
  pillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillLabel: {
    fontFamily: fontStack.bodyMedium,
    fontSize: 15,
    color: palette.fg,
    letterSpacing: -0.01 * 15,
    fontWeight: '700',
  },
  pillSub: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    color: palette.muted,
    letterSpacing: 0.18 * 9.5,
  },
  pillRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  secondsValue: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    color: palette.fg,
    letterSpacing: -0.04 * 26,
    lineHeight: 28,
  },
  secondsUnit: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    color: palette.muted,
    letterSpacing: 0.18 * 10,
  },
});
