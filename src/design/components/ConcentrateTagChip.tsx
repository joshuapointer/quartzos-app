/**
 * Concentrate tag chip — small pill rendering a tag in lowercase Title Case
 * with category-specific tint. Unknown tags fall back to a neutral surface.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../tokens';

interface Props {
  readonly tag: string;
}

interface ChipStyle {
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
}

function tagStyle(tag: string): ChipStyle {
  switch (tag) {
    case 'COLD_START':
      return { bg: 'rgba(155,189,216,0.18)', fg: colors.quartzBright, border: colors.quartzDeep };
    case 'NOT_FOR_DAB':
    case 'NOT_IDEAL':
    case 'SMOKE_ONLY':
    case 'ORAL_TOPICAL':
      return { bg: 'rgba(224,112,112,0.14)', fg: colors.error, border: colors.error };
    case 'PREMIUM':
    case '2026_DOMINANT':
    case 'POPULAR':
    case 'TRENDING':
      return { bg: colors.firedAmber + '2E', fg: colors.emberBright, border: colors.ember };
    case 'LEGACY':
      return { bg: 'rgba(65,56,48,0.45)', fg: colors.bone50, border: colors.bone20 };
    default:
      return { bg: colors.surface3, fg: colors.bone70, border: colors.bone20 };
  }
}

function formatLabel(tag: string): string {
  return tag
    .toLowerCase()
    .split('_')
    .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

export function ConcentrateTagChip({ tag }: Props) {
  const { bg, fg, border } = tagStyle(tag);
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: fg }]}>{formatLabel(tag)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...fonts.caption,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default ConcentrateTagChip;
