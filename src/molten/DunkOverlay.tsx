import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts } from '../design/tokens';
import { PrismEdge } from '../design/components/molten/PrismEdge';

// ─────────────────────────────────────────────────────────────────────────────

export type DunkOverlayProps = {
  tempF: number;
};

// ─── ChromaDot ────────────────────────────────────────────────────────────────
// A 6×6 white dot with cyan/magenta double shadow approximation via two
// stacked Views (RN supports one shadow per view, so we layer two).

function ChromaDot() {
  return (
    <View style={styles.dotOuter}>
      <View style={styles.dotCyan} />
      <View style={styles.dotMagenta} />
      <View style={styles.dotCore} />
    </View>
  );
}

// ─── DunkOverlay ─────────────────────────────────────────────────────────────

export const DunkOverlay = React.memo(function DunkOverlay({
  tempF,
}: DunkOverlayProps) {
  const displayTemp = Math.round(Math.max(0, tempF));

  return (
    <View style={styles.container}>
      {/* Big temp number row */}
      <View style={styles.numbersRow}>
        <Text style={styles.tempNumber} allowFontScaling={false}>
          {displayTemp}
        </Text>
        <Text style={styles.degSuffix} allowFontScaling={false}>
          °F
        </Text>
      </View>

      {/* Dunk safe stamp pill */}
      <View style={styles.stampWrap}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glassFill]} pointerEvents="none" />
        <PrismEdge radius={100} strokeWidth={0.75} />

        <View style={styles.stampInner}>
          <ChromaDot />
          <Text style={styles.stampText} allowFontScaling={false}>
            Dunk safe
          </Text>
          <ChromaDot />
        </View>
      </View>

      {/* Body copy */}
      <Text style={styles.bodyCopy}>
        Cool enough to submerge in iso. Cap, drop, swirl.
      </Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempNumber: {
    ...fonts.serifDisplay,
    fontSize: 88,
    lineHeight: 88,
    letterSpacing: -3.52, // -0.04em * 88
    color: colors.bone100,
    fontVariant: ['tabular-nums'],
  },
  degSuffix: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 32,
    color: colors.bone60,
    lineHeight: 32,
    marginTop: 12,
  },
  stampWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 4,
    position: 'relative',
  },
  glassFill: {
    backgroundColor: colors.glassPane,
    borderRadius: 100,
  },
  stampInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  stampText: {
    ...fonts.dataLabel,
    fontSize: 11,
    letterSpacing: 3.52, // 0.32em * 11
    color: colors.bone100,
    textShadowColor: colors.prismCyan,
    textShadowOffset: { width: 0.6, height: 0 },
    textShadowRadius: 0,
  },
  // ChromaDot styles — layered views for double chromatic shadow
  dotOuter: {
    width: 6,
    height: 6,
    position: 'relative',
  },
  dotCyan: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bone100,
    shadowColor: colors.prismCyan,
    shadowOffset: { width: -1.5, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 0,
  },
  dotMagenta: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    shadowColor: colors.prismMagenta,
    shadowOffset: { width: 1.5, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 0,
  },
  dotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bone100,
  },
  bodyCopy: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.bone60,
    maxWidth: 220,
    textAlign: 'center',
    marginTop: 14,
  },
});
