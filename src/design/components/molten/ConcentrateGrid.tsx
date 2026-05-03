import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';

import type { Concentrate } from '../../../data/concentrates';
import { colors, fonts, gradients, glass } from '../../tokens';
import { PrismEdge } from './PrismEdge';

// ─── Layout constants (match .tile-grid in quartzie-molten-refresh.html) ─────
const PADDING = 18;
const GAP = 8;

// ─── Component Props ──────────────────────────────────────────────────────────
export type ConcentrateGridProps = {
  concentrates: readonly Concentrate[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

// ─── Chromatic check glyph rendered in top-right of active tile ───────────────
function ChromaticCheck() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgLinearGradient id="checkGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={colors.prismCyan} stopOpacity="1" />
          <Stop offset="50%" stopColor={colors.prismMagenta} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.prismGold} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M2.5 7.6 L6 11 L11.5 4.5"
        fill="none"
        stroke="url(#checkGrad)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Single tile card ─────────────────────────────────────────────────────────
type TileCardProps = {
  concentrate: Concentrate & { surface_temp_optimal_f: number };
  isActive: boolean;
  tileWidth: number;
  tileHeight: number;
  onSelect: (id: string) => void;
};

function TileCard({ concentrate, isActive, tileWidth, tileHeight, onSelect }: TileCardProps) {
  const firstLetter = concentrate.name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => onSelect(concentrate.id)}
      style={[
        styles.tile,
        {
          width: tileWidth,
          height: tileHeight,
          borderColor: isActive ? 'transparent' : glass.edge,
        },
      ]}
    >
      {/* Background base color */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surface }]} />

      {/* Card neutral gradient overlay — top to bottom */}
      <LinearGradient
        colors={gradients.cardNeutral}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Dark shade gradient — bottom fade to near-black */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.78)']}
        start={{ x: 0, y: 0.32 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Glyph fallback — first letter, centered top portion */}
      {/* TODO: real concentrate photos */}
      <View style={styles.glyphContainer} pointerEvents="none">
        <Text style={styles.glyphText}>{firstLetter}</Text>
      </View>

      {/* Bottom-left meta: name + temp */}
      <View style={styles.metaBox} pointerEvents="none">
        <Text
          style={styles.tileName}
          numberOfLines={2}
        >
          {concentrate.name}
        </Text>
        <Text style={styles.tileTemp}>
          <Text style={styles.tileTempLabel}>OPTIMAL </Text>
          <Text style={styles.tileTempValue}>{concentrate.surface_temp_optimal_f}°F</Text>
        </Text>
      </View>

      {/* Active: PrismEdge border overlay */}
      {isActive && (
        <PrismEdge radius={14} strokeWidth={0.75} />
      )}

      {/* Active: chromatic check glyph — top right */}
      {isActive && (
        <View style={styles.checkBadge} pointerEvents="none">
          <ChromaticCheck />
        </View>
      )}
    </Pressable>
  );
}

// ─── Exported grid component ──────────────────────────────────────────────────
export function ConcentrateGrid({
  concentrates,
  selectedId,
  onSelect,
}: ConcentrateGridProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Filter out concentrates with no optimal temp
  const filtered = concentrates.filter(
    (c): c is Concentrate & { surface_temp_optimal_f: number } =>
      c.surface_temp_optimal_f !== null,
  );

  // Tile width: (parentWidth - 2*PADDING - 2*GAP) / 3
  const tileWidth = (windowWidth - 2 * PADDING - 2 * GAP) / 3;
  // Explicit height — Yoga's `aspectRatio` doesn't reliably compute height
  // for items inside `flex-direction: row` + `flexWrap: wrap` containers,
  // collapsing tiles to ~0pt. Mirrors the prototype `.tile-card` 1:1.18 ratio.
  const tileHeight = tileWidth * 1.18;

  return (
    <View style={styles.wrapper}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Your hash</Text>
        <Text style={styles.headerMeta}>{filtered.length} textures</Text>
      </View>

      {/* 3-column tile grid */}
      <View style={styles.grid}>
        {filtered.map((concentrate) => (
          <TileCard
            key={concentrate.id}
            concentrate={concentrate}
            isActive={selectedId === concentrate.id}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 16,
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  headerRow: {
    marginBottom: 10,
  },
  headerTitle: {
    ...fonts.serifHeadline,
    color: colors.bone100,
  },
  headerMeta: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    // height set inline per-instance — see TileCardProps.tileHeight
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    marginBottom: 0,
  },
  glyphContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphText: {
    ...fonts.serifHeadline,
    fontSize: 36,
    fontStyle: 'italic',
    color: colors.bone20,
  },
  metaBox: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 7,
    gap: 2,
  },
  tileName: {
    ...fonts.serifCard,
    fontSize: 13.5,
    color: colors.bone100,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tileTemp: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 8.5,
    letterSpacing: 1.36,
    textTransform: 'uppercase',
  },
  tileTempLabel: {
    color: colors.bone60,
  },
  tileTempValue: {
    color: colors.prismCyan,
  },
  checkBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 14,
    height: 14,
  },
});
