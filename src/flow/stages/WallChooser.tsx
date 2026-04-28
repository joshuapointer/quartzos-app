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
import Svg, { Circle } from 'react-native-svg';

import ChooserCard from '../components/ChooserCard';
import { WALLS, type Wall } from '../data';
import { useFlow } from '../store';
import { THEME, TYPE } from '../theme';

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

type FilterKey = 'All' | 'Thin' | 'Standard' | 'Thick';

const FILTERS: FilterKey[] = ['All', 'Thin', 'Standard', 'Thick'];

function passesFilter(w: Wall, f: FilterKey): boolean {
  if (f === 'All') return true;
  return w.id === f.toLowerCase();
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

// ─── Wall cross-section SVG glyph ────────────────────────────────────────────

function WallGlyph({ wall }: { wall: Wall }) {
  type InnerSpec = { r: number; stroke: string; strokeWidth: number; strokeDasharray?: string; fill: string };
  const innerMap: Record<Wall['id'], InnerSpec> = {
    thin:     { r: 18, stroke: THEME.bone[50], strokeWidth: 1, fill: THEME.navy[0] },
    standard: { r: 14, stroke: THEME.bone[50], strokeWidth: 1, fill: THEME.navy[0] },
    thick:    { r: 9,  stroke: THEME.bone[50], strokeWidth: 1, fill: THEME.navy[0] },
    unknown:  { r: 14, stroke: THEME.bone[35], strokeWidth: 1, strokeDasharray: '2 3', fill: THEME.navy[0] },
  };
  const inner = innerMap[wall.id];
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={22} stroke={THEME.bone[35]} strokeWidth={1} fill={THEME.navy[2]} />
      <Circle
        cx={24}
        cy={24}
        r={inner.r}
        stroke={inner.stroke}
        strokeWidth={inner.strokeWidth}
        strokeDasharray={inner.strokeDasharray}
        fill={inner.fill}
      />
    </Svg>
  );
}

// ─── Right-side IR offset badge ───────────────────────────────────────────────

function WallBadge({ wall }: { wall: Wall }) {
  if (wall.mod === 0) {
    return <Text style={[styles.irBadge, { color: THEME.bone[50] }]}>0°F</Text>;
  }
  if (wall.mod > 0) {
    return <Text style={[styles.irBadge, { color: THEME.warn }]}>+{wall.mod}°F</Text>;
  }
  // mod < 0 — use U+2212 minus sign
  return <Text style={[styles.irBadge, { color: THEME.quartz.bright }]}>−{Math.abs(wall.mod)}°F</Text>;
}

// ─── WallChooser ──────────────────────────────────────────────────────────────

export default function WallChooser() {
  const wallId = useFlow((s) => s.wallId);
  const setWallId = useFlow((s) => s.setWallId);

  const [filter, setFilter] = useState<FilterKey>('All');

  const items = useMemo(
    () => WALLS.filter((w) => {
      // 'Don't know' shows under 'All' only
      if (w.id === 'unknown') return filter === 'All';
      return passesFilter(w, filter);
    }),
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

      {/* Wall list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {items.map((w, idx) => {
          const adjText = w.mod === 0
            ? '0°F'
            : w.mod > 0
              ? `+${w.mod}°F`
              : `−${Math.abs(w.mod)}°F`;
          const sub = `${adjText} adjustment · ${w.description}`;
          return (
            <Animated.View
              key={w.id}
              entering={FadeInUp.delay(120 + idx * 55).duration(380).easing(STAGGER_EASING)}
            >
              <ChooserCard
                active={wallId === w.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setWallId(w.id);
                }}
                title={`${w.name} · ${w.thickness}`}
                sub={sub}
                glyph={<WallGlyph wall={w} />}
                right={<WallBadge wall={w} />}
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
    alignItems: 'center',
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
    paddingBottom: 20,
  },
  irBadge: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.10 * 11,
    textTransform: 'uppercase',
  } as const,
});
