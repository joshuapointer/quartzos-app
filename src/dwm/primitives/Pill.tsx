import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { palette, fontStack, radii } from '../tokens';

type Variant = 'peach' | 'mint' | 'butter' | 'lilac' | 'neutral';

interface Props {
  label: string;
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, { bg: string; fg: string }> = {
  peach:   { bg: '#FDE8DF', fg: palette.accentDeep },
  mint:    { bg: '#D9F4E8', fg: '#2D7A52' },
  butter:  { bg: '#FAF0C0', fg: '#7A6020' },
  lilac:   { bg: '#EDE0F5', fg: '#6B3FA0' },
  neutral: { bg: '#F2EBF4', fg: palette.muted },
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
    borderRadius: radii.pill,
  },
  text: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.06 * 10,
  },
});
