/**
 * src/flow/stages/ConcChooser.tsx
 *
 * Step 1 of the builder — pick the concentrate.
 * Filter chip row + list of ChooserCards. Blocked items render disabled.
 *
 * Tokens: src/flow/theme.ts
 * Reference: /tmp/quartzie-prototype/src/flow-build.jsx ConcChooser
 */

import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import ChooserCard from '../components/ChooserCard';
import { CONCENTRATES, type Concentrate, type ConcentrateCat } from '../data';
import { CONCENTRATE_IMAGES } from '../concentrateImages';
import { useFlow } from '../store';
import { THEME, TYPE } from '../theme';

// ─── Filter definitions ───────────────────────────────────────────────────────

type FilterKey = 'All' | ConcentrateCat;

const FILTERS: FilterKey[] = [
  'All',
  'Solventless',
  'Hash',
  'Hydrocarbon',
  'Distillate',
  'Novel',
];

// ─── Filter Chip ──────────────────────────────────────────────────────────────

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Surface temp badge ───────────────────────────────────────────────────────

function SurfaceBadge({ c }: { c: Concentrate }) {
  if (c.surface_optimal == null) return null;
  return (
    <Text style={styles.surfaceBadge}>
      {c.surface_optimal}
      {'°F'}
    </Text>
  );
}

// ─── ConcChooser ──────────────────────────────────────────────────────────────

export default function ConcChooser() {
  const concId = useFlow((s) => s.concId);
  const setConcId = useFlow((s) => s.setConcId);

  const [filter, setFilter] = useState<FilterKey>('All');

  const items = useMemo(
    () =>
      CONCENTRATES.filter((c) => filter === 'All' || c.cat === filter),
    [filter],
  );

  function handleFilterPress(next: FilterKey) {
    if (next === filter) return;
    void Haptics.selectionAsync();
    setFilter(next);
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTERS.map((f) => (
          <FilterChip
            key={f}
            label={f}
            active={filter === f}
            onPress={() => handleFilterPress(f)}
          />
        ))}
      </ScrollView>

      {/* Concentrate list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {items.map((c, idx) => {
          const isBlocked = !!c.blocked;
          const sub = isBlocked
            ? undefined
            : c.warning
              ? c.warning
              : c.description;
          const subColor = !isBlocked && c.warning ? THEME.warn : undefined;
          const right = isBlocked ? undefined : <SurfaceBadge c={c} />;
          return (
            <Animated.View
              key={c.id}
              entering={FadeInUp.delay(120 + idx * 55).duration(380)}
            >
              <ChooserCard
                active={!isBlocked && concId === c.id}
                disabled={isBlocked}
                onPress={() => {
                  if (isBlocked) return;
                  setConcId(c.id);
                }}
                title={c.name}
                sub={sub}
                subColor={subColor}
                blockedReason={isBlocked ? c.blocked : undefined}
                image={CONCENTRATE_IMAGES[c.id]}
                right={right}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
    paddingRight: 22,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: THEME.ember.base,
    borderColor: THEME.ember.base,
  },
  chipText: {
    ...(TYPE.mono as object),
    fontSize: 10,
    letterSpacing: 0.14 * 10,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,
  chipTextActive: {
    color: THEME.bone[100],
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
  surfaceBadge: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.10 * 11,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,
});
