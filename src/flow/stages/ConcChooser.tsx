/**
 * src/flow/stages/ConcChooser.tsx
 *
 * Step 2: What are you dabbing?
 * Layout:
 *   – Category cards (All / Solventless / Hash / Hydrocarbon / Distillate / Novel)
 *     each with a representative gradient orb + count
 *   – 2-column grid of thumbnail tiles; selected tile gets ember ring + check badge
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { CONCENTRATES, type Concentrate, type ConcentrateCat } from '../data';
import { CONCENTRATE_IMAGES } from '../concentrateImages';
import { useStaggerEntrance } from '../components/useStaggerEntrance';
import { useReducedMotion } from '../components/useReducedMotion';
import { useFlow } from '../store';
import { SCREEN, SPACE, THEME, TYPE } from '../theme';
import { usePressScale } from '../../design';
import { motion, reanimatedEasing } from '../../design/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 5;
// Two columns; each col = (screen - 2*side - 1 gap) / 2
const TILE_W = (SCREEN_W - SCREEN.HPAD * 2 - GRID_GAP) / 2;

// Category card sizing — fixed width so 4ish cards fit with the next peeking
const CAT_CARD_W = 82;
const CAT_CARD_H = 112;
const CAT_GAP = 10;

// ─── Filter types ──────────────────────────────────────────────────────────────

type FilterKey = 'All' | ConcentrateCat;

const ALL_CATS: ConcentrateCat[] = ['Solventless', 'Hydrocarbon'];

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'All', label: 'All', count: CONCENTRATES.filter(c => c.cat === 'Solventless' || c.cat === 'Hydrocarbon').length },
  ...ALL_CATS.map(cat => ({
    key: cat as FilterKey,
    label: cat,
    count: CONCENTRATES.filter(c => c.cat === cat).length,
  })),
];

// Orb palette per category — [highlight, mid, deep] for radial gradient.
// Hues chosen to reflect the concentrate's visual identity rather than just brand colours.
const ORB_PALETTE: Record<FilterKey, [string, string, string]> = {
  All: [THEME.ember.bright, THEME.ember.deep, THEME.navy[1]], // white intensity — overall mix
  Solventless: ['#f6e090', '#c0a040', '#3a2a08'], // pale gold (yellow, not orange — kept)
  Hash: ['#d4d4d4', '#666666', '#0a0a0a'], // cool monochrome (was amber-brown)
  Hydrocarbon: ['#ffffff', '#cccccc', '#222222'], // white intensity (was ember)
  Distillate: ['#ffe26a', '#c89020', '#3a2406'], // saturated gold (yellow, not orange — kept)
  Novel: ['#e09cf5', '#9a3ec8', '#2a0d36'], // magenta (kept)
};

// ─── Category orb (SVG with radial gradient + specular) ───────────────────────

function CategoryOrb({ cat, size = 42 }: { cat: FilterKey; size?: number }) {
  const [light, mid, deep] = ORB_PALETTE[cat];
  const id = `orb-${cat}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42">
      <Defs>
        <RadialGradient id={id} cx="0.36" cy="0.30" r="0.85">
          <Stop offset="0" stopColor={light} stopOpacity="1" />
          <Stop offset="0.55" stopColor={mid} stopOpacity="1" />
          <Stop offset="1" stopColor={deep} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Circle cx="21" cy="21" r="20" fill={`url(#${id})`} />
      {/* Specular highlight near top-left */}
      <Ellipse cx="15" cy="13" rx="6" ry="3.2" fill="rgba(255,255,255,0.32)" />
    </Svg>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

type FilterChipProps = {
  item: (typeof FILTERS)[number];
  active: boolean;
  onPress: () => void;
};

function FilterChip({ item, active, onPress }: FilterChipProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.catCard, active && styles.catCardActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${item.label}`}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.catInner, animatedStyle]}>
        <View style={[styles.catOrbRing, active && styles.catOrbRingActive]}>
          <CategoryOrb cat={item.key} size={40} />
        </View>
        <Text
          style={[styles.catLabel, active && styles.catLabelActive]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        <View style={[styles.catCountPill, active && styles.catCountPillActive]}>
          <Text style={[styles.catCountText, active && styles.catCountTextActive]}>
            {item.count}
          </Text>
        </View>
      </Animated.View>
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
        stroke="#160c06"
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
    // Stiffer than pressSpring — two-column grid tile needs heavier resistance.
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
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
      : THEME.bone.warm10;

  // Gradient palette — warm glows for selected, cooler neutrals otherwise
  const gradColors: [string, string] = active
    ? ['rgba(18,10,1,0.20)', 'rgba(10,6,0,0.82)']
    : ['rgba(10,6,0,0.30)', 'rgba(12, 6, 0, 0.88)'];

  if (!image) return null;

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
        {/* Full-card image — cover fills the tile without letterboxing */}
        {image ? (
          <Image
            source={image}
            style={StyleSheet.absoluteFill}
            resizeMode="none"
          />
        ) : (
          // Fallback warm tint
          <LinearGradient
            colors={[THEME.navy[3], THEME.navy[0]]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Thin scrim only over the bottom label zone */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.98)']}
          start={{ x: 0.5, y: 0.62 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ring is a decorative border overlay — must stay absolute. */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.ring, { borderColor: ringColor }]}
        />

        <View style={styles.tileTopRow}>
          {disabled ? (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedText}>BLOCKED</Text>
            </View>
          ) : (
            <View />
          )}
          {active && <CheckBadge />}
        </View>

        {/* Bottom metadata */}
        <View style={styles.tileBottom}>

          {conc.surface_optimal != null && (
            <View style={styles.tileMeta}>
              <Text style={[styles.tileName, disabled && styles.tileDim]} numberOfLines={1}>
                {conc.name}
              </Text>
              {!disabled && (
                <Text style={styles.tileTemp}>{conc.surface_optimal}°F</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── ConcChooser ──────────────────────────────────────────────────────────────

const TILE_STAGGER_MS = 30;
const CAP = 7;

export default function ConcChooser() {
  const concId = useFlow((s) => s.concId);
  const setConcId = useFlow((s) => s.setConcId);
  const reduced = useReducedMotion();

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

  const containerStyle = useStaggerEntrance(0);

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
    >


      {/* 2-col grid via FlatList of row-pairs */}
      <FlatList
        data={rows}
        keyExtractor={(_, idx) => String(idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        renderItem={({ item: row, index: rowIndex }) => (
          <View style={styles.gridRow}>
            {row.map((c, colIndex) => {
              const isBlocked = !!c.blocked;
              const tileIndex = rowIndex * 2 + colIndex;
              return (
                <Animated.View
                  key={c.id}
                  entering={FadeInDown
                    .duration(motion.duration.popover)
                    .delay(reduced ? 0 : Math.min(tileIndex, CAP) * TILE_STAGGER_MS)
                    .easing(reanimatedEasing.easeOut)}
                >
                  <ConcTile
                    conc={c}
                    active={!isBlocked && concId === c.id}
                    disabled={isBlocked}
                    onPress={() => setConcId(c.id)}
                  />
                </Animated.View>
              );
            })}
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
    marginHorizontal: -SCREEN.HPAD,
  },
  // ── Category cards row ──
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: CAT_GAP,
    paddingBottom: 16,
    paddingHorizontal: SCREEN.HPAD,
    paddingRight: SCREEN.HPAD + 8,
  },
  catCard: {
    width: CAT_CARD_W,
    height: CAT_CARD_H,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.bone.warm10,
    backgroundColor: 'rgba(246, 222, 210, 0.03)',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  catCardActive: {
    borderColor: THEME.ember.base,
    backgroundColor: THEME.ember.base,
    shadowColor: THEME.ember.base,
    shadowRadius: 18,
    shadowOpacity: 0.30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  catInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catOrbRing: {
    width: 46,
    height: 46,
    borderRadius: SCREEN.PILL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catOrbRingActive: {
    borderColor: 'rgba(255, 122, 0, 0.85)',
    shadowColor: THEME.ember.base,
    shadowRadius: 12,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
  },
  catLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12.5,
    letterSpacing: -0.15,
    color: THEME.bone[90],
    textAlign: 'center',
  },
  catLabelActive: {
    color: THEME.bone[100],
  },
  catCountPill: {
    minWidth: 24,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: SCREEN.PILL_RADIUS,
    backgroundColor: 'rgba(22, 12, 6, 0.55)',
    borderWidth: 0.5,
    borderColor: THEME.bone.warm08,
    alignItems: 'center',
  },
  catCountPillActive: {
    backgroundColor: 'rgba(22, 12, 6, 0.65)',
    borderColor: 'rgba(255, 174, 90, 0.22)',
  },
  catCountText: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.10 * 9,
    color: THEME.bone[50],
  } as const,
  catCountTextActive: {
    color: THEME.bone[100],
  },

  // Grid
  grid: {

    paddingHorizontal: SCREEN.HPAD,
    paddingBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },

  // Tile
  tileWrap: {
    width: TILE_W,
    aspectRatio: 900 / 600,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.navy[0],
    marginBottom: GRID_GAP,
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
    aspectRatio: 900 / 600,
  },

  tile: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  ring: {
    borderRadius: 16,
    borderWidth: 1,
  },
  // Top row keeps blocked-badge / check-badge in flow.
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 9,
    paddingHorizontal: 9,
    minHeight: 22,
  },
  blockedBadge: {
    backgroundColor: 'rgba(60, 20, 20, 0.80)',
    borderRadius: SCREEN.PILL_RADIUS,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 0.5,
    borderColor: 'rgba(200, 80, 70, 0.40)',
  },
  blockedText: {
    ...(TYPE.mono as object),
    fontSize: 8,
    letterSpacing: 0.16 * 8,
    color: '#e0c0af',
    textTransform: 'uppercase',
  } as const,
  tileBottom: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 4,
  },
  tileName: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: THEME.bone[100],
    letterSpacing: -0.25,
    lineHeight: 15 * 1.1,
  },
  tileMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
  },
  tileCat: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.16 * 9,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    flex: 1,
  } as const,
  tileTemp: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.06 * 11,
    color: THEME.bone[100],
    flexShrink: 0,
  } as const,
  tileDim: {
    color: THEME.bone[35],
  },
});
