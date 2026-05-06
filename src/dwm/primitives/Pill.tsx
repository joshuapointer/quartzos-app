import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { palette, fontStack, radii } from '../tokens';

// Variant API preserved for back-compat. In the shatterbox register all
// non-amber variants collapse to the same engraved-chip styling — the
// single-accent rule means only `peach` (now amber) carries colour.
type Variant = 'peach' | 'mint' | 'butter' | 'lilac' | 'neutral';

interface Props {
  label: string;
  variant?: Variant;
}

const NEUTRAL_CHIP = { bg: palette.surface, fg: palette.muted } as const;
const ACCENT_CHIP  = { bg: palette.surface, fg: palette.accent } as const;

const VARIANT_STYLES: Record<Variant, { bg: string; fg: string }> = {
  peach:   ACCENT_CHIP,
  mint:    NEUTRAL_CHIP,
  butter:  NEUTRAL_CHIP,
  lilac:   NEUTRAL_CHIP,
  neutral: NEUTRAL_CHIP,
};

export function Pill({ label, variant = 'neutral' }: Props) {
  const { bg, fg } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: palette.border,
  },
  text: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.06 * 10,
  },
});
