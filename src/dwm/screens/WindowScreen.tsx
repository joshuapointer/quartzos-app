import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { layout, palette, fontStack, radii } from '../tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableButton } from '../primitives/PressableButton';
import { PhaseStrip } from '../primitives/PhaseStrip';
import { PHASE_COPY } from '../flow/copy';

export interface WindowScreenProps {
  liveTempF: number;
  targetF: number;
  useCelsius: boolean;
  showStuckFallback: boolean;
  onForceAdvance: () => void;
  dwellPct: number; // 0..1 — how long we've held inside ±15F of target
  sessionElapsedS: number;
}

function toC(f: number): number {
  return Math.round((f - 32) * 5 / 9);
}

function fmtSession(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function WindowScreen({
  liveTempF,
  targetF,
  useCelsius,
  showStuckFallback,
  onForceAdvance,
  dwellPct,
  sessionElapsedS,
}: WindowScreenProps) {
  const copy = PHASE_COPY.window;
  const inWindow = Math.abs(liveTempF - targetF) <= 15;
  const lifted = dwellPct >= 1;
  const displayTemp = useCelsius ? toC(liveTempF) : Math.round(liveTempF);
  const unit = useCelsius ? '°C' : '°F';

  const lblText = lifted ? 'LIFTED' : inWindow ? "LIFT NOW — I'LL CATCH IT" : liveTempF > targetF ? 'COOLING' : 'TOO COLD';
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;

  const borderColor = lifted ? palette.accent : inWindow ? palette.mint : palette.border;
  const bgColor = lifted ? '#FCEEEA' : inWindow ? '#EEFAF3' : palette.surface;
  const fillGradient: [string, string] = lifted
    ? [palette.accent, palette.accentDeep]
    : [palette.mint, '#5EC491'];
  const fillPct = lifted ? 1 : inWindow ? Math.max(dwellPct, 0.05) : 0;

  return (
    <View style={styles.well}>
      <PhaseStrip current={1} />

      <View style={[styles.tempBanner, { borderColor, backgroundColor: bgColor }]}>
        <View style={styles.tempNumRow}>
          <Text style={styles.tempNumValue}>{displayTemp}</Text>
          <Text style={styles.tempNumUnit}>{unit}</Text>
        </View>
        <View style={styles.tempSep} />
        <Text
          style={[
            styles.tempLbl,
            inWindow && styles.tempLblWindow,
            lifted && styles.tempLblLifted,
          ]}
        >
          {lblText}
        </Text>
        <View style={styles.tempFillTrack}>
          <View style={[styles.tempFillBar, { width: `${fillPct * 100}%` }]}>
            <LinearGradient
              colors={fillGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>

      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>{copy.headline}</Text>
      {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}

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
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.035 * 24,
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
  tempBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tempNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tempNumValue: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 30,
    color: palette.fg,
    letterSpacing: -0.04 * 30,
    lineHeight: 32,
  },
  tempNumUnit: {
    fontFamily: fontStack.bodyMedium,
    fontSize: 16,
    color: palette.muted,
    marginLeft: 1,
    letterSpacing: -0.02 * 16,
  },
  tempSep: {
    width: 1,
    height: 22,
    backgroundColor: palette.border,
  },
  tempLbl: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    color: palette.muted,
    letterSpacing: 0.18 * 10,
  },
  tempLblWindow: {
    color: '#2D7A52',
    fontWeight: '700',
  },
  tempLblLifted: {
    color: palette.accentDeep,
    fontWeight: '700',
  },
  tempFillTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${palette.border}88`,
    overflow: 'hidden',
    marginLeft: 4,
  },
  tempFillBar: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 3,
  },
  fallback: {
    alignItems: 'center',
    marginTop: 4,
  },
});
