/**
 * src/flow/stages/ConcChooser.tsx
 *
 * Step 2: What are you dabbing?
 * Layout:
 *   – Category filter chips (All / Solventless / Hash / Hydrocarbon / Distillate / Novel)
 *     with per-category item counts
 *   – 2-column grid of large thumbnail cards with full-bleed image, gradient overlay,
 *     title, optional temp badge; selected card gets ember ring + check badge
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { CONCENTRATES, type Concentrate, type ConcentrateCat } from '../data';
import { CONCENTRATE_IMAGES } from '../concentrateImages';
import { useFlow } from '../store';
import { THEME, TYPE } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD = 22;
const GRID_GAP = 10;
// Two columns; each col = (screen - 2*side - 1 gap) / 2
const TILE_W = (SCREEN_W - SIDE_PAD * 2 - GRID_GAP) / 2;
const TILE_H = TILE_W * 0.88; // slightly wider than tall

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// ─── Filter types ──────────────────────────────────────────────────────────────

type FilterKey = 'All' | ConcentrateCat;

const ALL_CATS: ConcentrateCat[] = ['Solventless', 'Hash', 'Hydrocarbon', 'Distillate', 'Novel'];

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'All',         label: 'All',         count: CONCENTRATES.length },
  ...ALL_CATS.map(cat => ({
    key:   cat as FilterKey,
    label: cat,
    count: CONCENTRATES.filter(c => c.cat === cat).length,
  })),
];

// ─── Filter chip ───────────────────────────────────────────────────────────────

type FilterChipProps = {
  item: (typeof FILTERS)[number];
  active: boolean;
  onPress: () => void;
};

function FilterChip({ item, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${item.label}`}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {item.label}
      </Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>
        {item.count}
      </Text>
    </Pressable>
  );
}

// ─── Check badge ───────────────────────────────────────────────────────────────

function CheckBadge() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={9.5} fill={THEME.ember.base} />
      <Path
        d="M5.5 10l3.5 3.5L14.5 7"
        stroke="#1a1208"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Tile card ─────────────────────────────────────────────────────────────────

type TileProps = {
  conc: Concentrate;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
};

function ConcTile({ conc, active, disabled, onPress }: TileProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }
  function handlePress() {
    if (disabled) return;
    void Haptics.selectionAsync();
    onPress();
  }

  const image = CONCENTRATE_IMAGES[conc.id];

  const ringColor = active
    ? 'rgba(227, 128, 31, 0.75)'
    : disabled
      ? 'rgba(132, 76, 71, 0.35)'
      : 'rgba(180, 200, 230, 0.09)';

  // Gradient palette — warm glows for selected, cooler neutrals otherwise
  const gradColors: [string, string] = active
    ? ['rgba(18,10,1,0.20)', 'rgba(10,6,0,0.82)']
    : ['rgba(10,6,0,0.30)', 'rgba(8,12,24,0.88)'];

  return (
    <Animated.View style={[styles.tileWrap, animStyle, active && styles.tileShadow, disabled && styles.tileDisabled]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.tile}
        accessibilityRole="button"
        accessibilityLabel={conc.name}
        accessibilityState={{ disabled, selected: active }}
      >
        {/* Full-card image — contain shows the complete photo */}
        {image ? (
          <Image
            source={image}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        ) : (
          // Fallback warm tint
          <LinearGradient
            colors={['#1a0e04', '#0c1220']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Thin scrim only over the bottom label zone */}
        <LinearGradient
          colors={['transparent', active ? 'rgba(12,6,0,0.95)' : 'rgba(6,10,20,0.95)']}
          start={{ x: 0.5, y: 0.62 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ring */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.ring, { borderColor: ringColor }]}
        />

        {/* Check badge */}
        {active && (
          <View style={styles.checkBadge}>
            <CheckBadge />
          </View>
        )}

        {/* BLOCKED badge */}
        {disabled && (
          <View style={styles.blockedBadge}>
            <Text style={styles.blockedText}>BLOCKED</Text>
          </View>
        )}

        {/* Bottom metadata */}
        <View style={styles.tileBottom}>
          <Text style={[styles.tileName, disabled && styles.tileDim]} numberOfLines={2}>
            {conc.name}
          </Text>
          <View style={styles.tileMeta}>
            <Text style={[styles.tileCat, disabled && styles.tileDim]}>{conc.cat.toUpperCase()}</Text>
            {conc.surface_optimal != null && !disabled && (
              <Text style={styles.tileTemp}>{conc.surface_optimal}°F</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── ConcChooser ──────────────────────────────────────────────────────────────

export default function ConcChooser() {
  const concId    = useFlow((s) => s.concId);
  const setConcId = useFlow((s) => s.setConcId);

  const [filter, setFilter] = useState<FilterKey>('All');

  const items = useMemo(
    () => CONCENTRATES.filter((c) => filter === 'All' || c.cat === filter),
    [filter],
  );

  // Group into rows of 2 for the grid
  const rows = useMemo(() => {
    const pairs: Concentrate[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push(items.slice(i, i + 2));
    }
    return pairs;
  }, [items]);

  function handleFilterPress(next: FilterKey) {
    if (next === filter) return;
    void Haptics.selectionAsync();
    setFilter(next);
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(380).easing(STAGGER_EASING)}
    >
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTERS.map((item) => (
          <FilterChip
            key={item.key}
            item={item}
            active={filter === item.key}
            onPress={() => handleFilterPress(item.key)}
          />
        ))}
      </ScrollView>

      {/* 2-col grid via FlatList of row-pairs */}
      <FlatList
        data={rows}
        keyExtractor={(_, idx) => String(idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((c) => {
              const isBlocked = !!c.blocked;
              return (
                <ConcTile
                  key={c.id}
                  conc={c}
                  active={!isBlocked && concId === c.id}
                  disabled={isBlocked}
                  onPress={() => setConcId(c.id)}
                />
              );
            })}
            {/* Fill empty cell when odd count */}
            {row.length < 2 && <View style={styles.tileEmpty} />}
          </View>
        )}
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: -SIDE_PAD,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: SIDE_PAD,
    paddingRight: SIDE_PAD + 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    backgroundColor: 'rgba(180, 200, 230, 0.04)',
  },
  chipActive: {
    backgroundColor: 'rgba(227, 128, 31, 0.14)',
    borderColor: 'rgba(227, 128, 31, 0.50)',
  },
  chipLabel: {
    ...(TYPE.mono as object),
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,
  chipLabelActive: {
    color: THEME.bone[90],
  },
  chipCount: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.10 * 9,
    color: THEME.bone[35],
    textTransform: 'uppercase',
  } as const,
  chipCountActive: {
    color: THEME.ember.bright,
  },

  // Grid
  grid: {
    gap: GRID_GAP,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },

  // Tile
  tileWrap: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#080c18',
  },
  tileShadow: {
    shadowColor: THEME.ember.base,
    shadowRadius: 22,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  tileDisabled: {
    opacity: 0.60,
  },
  tileEmpty: {
    width: TILE_W,
    height: TILE_H,
  },

  tile: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  ring: {
    borderRadius: 16,
    borderWidth: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
  },
  blockedBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: 'rgba(60, 20, 20, 0.80)',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 0.5,
    borderColor: 'rgba(200, 80, 70, 0.40)',
  },
  blockedText: {
    ...(TYPE.mono as object),
    fontSize: 8,
    letterSpacing: 0.16 * 8,
    color: '#bd7a6f',
    textTransform: 'uppercase',
  } as const,
  tileBottom: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 8,
    gap: 3,
  },
  tileName: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: THEME.bone[100],
    letterSpacing: -0.2,
    lineHeight: 13 * 1.15,
  },
  tileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  tileCat: {
    ...(TYPE.mono as object),
    fontSize: 8.5,
    letterSpacing: 0.14 * 8.5,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    flex: 1,
  } as const,
  tileTemp: {
    ...(TYPE.mono as object),
    fontSize: 10,
    letterSpacing: 0.10 * 10,
    color: THEME.bone[70],
    textTransform: 'uppercase',
    flexShrink: 0,
  } as const,
  tileDim: {
    color: THEME.bone[35],
  },
});
