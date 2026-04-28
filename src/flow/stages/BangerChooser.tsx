import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
} from 'react-native-reanimated';

import ChooserCard from '../components/ChooserCard';
import { BANGERS, type Banger } from '../data';
import { BANGER_IMAGES } from '../bangerImages';
import { useFlow } from '../store';
import { THEME, TYPE } from '../theme';

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

type FilterKey = 'All' | 'Classic' | 'Slurper' | 'Specialty' | 'Premium';

const FILTERS: FilterKey[] = ['All', 'Classic', 'Slurper', 'Specialty', 'Premium'];

function passesFilter(b: Banger, f: FilterKey): boolean {
  if (f === 'All') return true;
  return b.category.toLowerCase() === f.toLowerCase();
}

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

// ─── Right-side IR offset badge ───────────────────────────────────────────────

function IROffsetBadge({ banger }: { banger: Banger }) {
  if (banger.geometry === 'insert') {
    return <Text style={[styles.irBadge, { color: THEME.bone[50] }]}>INSERT</Text>;
  }
  const isSlurper = banger.geometry === 'slurper';
  const sign = isSlurper ? '+' : '−';
  const color = isSlurper ? THEME.quartz.bright : THEME.bone[50];
  return (
    <Text style={[styles.irBadge, { color }]}>
      {sign}
      {banger.ir_offset_f}
      {'°'}
    </Text>
  );
}

// ─── BangerChooser ────────────────────────────────────────────────────────────

export default function BangerChooser() {
  const bangerId = useFlow((s) => s.bangerId);
  const setBangerId = useFlow((s) => s.setBangerId);

  const [filter, setFilter] = useState<FilterKey>('All');

  const items = useMemo(
    () => BANGERS.filter((b) => passesFilter(b, filter)),
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

      {/* Banger list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {items.map((b, idx) => (
          <Animated.View
            key={b.id}
            entering={FadeInUp.delay(120 + idx * 55).duration(380).easing(STAGGER_EASING)}
          >
            <ChooserCard
              active={bangerId === b.id}
              onPress={() => {
                void Haptics.selectionAsync();
                setBangerId(b.id);
              }}
              title={b.name}
              sub={b.description}
              image={BANGER_IMAGES[b.id]}
              right={<IROffsetBadge banger={b} />}
            />
          </Animated.View>
        ))}
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
  irBadge: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.10 * 11,
    textTransform: 'uppercase',
  } as const,
});
