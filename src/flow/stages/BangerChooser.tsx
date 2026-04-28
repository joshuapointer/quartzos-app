/**
 * src/flow/stages/BangerChooser.tsx
 *
 * Step 1: Pick your vessel.
 * Layout:
 *   – Geometry chips row (Bucket / Slurper / Insert) as scrollable icon+label pills
 *   – Large horizontal carousel — one card visible + next peeking, snap-to-item
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { BANGERS, type Banger, type BangerGeometry } from '../data';
import { BANGER_IMAGES } from '../bangerImages';
import { useFlow } from '../store';
import { THEME, TYPE } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_H = 230;
const CARD_GAP = 10;
const SIDE_PAD = 22;
// Card width: screen minus left pad, gap and right peek
const CARD_W = SCREEN_W - SIDE_PAD * 2 - CARD_GAP - 36;

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// ─── Geometry filter types ─────────────────────────────────────────────────────

type GeomFilter = 'All' | BangerGeometry;

const GEOM_FILTERS: { key: GeomFilter; label: string; count: number }[] = [
  { key: 'All',     label: 'All',     count: BANGERS.length },
  { key: 'bucket',  label: 'Bucket',  count: BANGERS.filter(b => b.geometry === 'bucket').length },
  { key: 'slurper', label: 'Slurper', count: BANGERS.filter(b => b.geometry === 'slurper').length },
  { key: 'insert',  label: 'Insert',  count: BANGERS.filter(b => b.geometry === 'insert').length },
];

function passesGeomFilter(b: Banger, f: GeomFilter): boolean {
  if (f === 'All') return true;
  return b.geometry === f;
}

// ─── Geometry chip icons ────────────────────────────────────────────────────────

function BucketIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M5 5h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
        stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M4 5h12" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

function SlurperIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M10 3v5M7 8h6v5a2 2 0 01-2 2H9a2 2 0 01-2-2V8z"
        stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M8 14.5h4" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M9 16.5h2v1H9v-1z" stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function InsertIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M6 4h8v8a2 2 0 01-2 2H8a2 2 0 01-2-2V4z"
        stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M8 14h4v2H8v-2z" stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function GeomIcon({ geom, color }: { geom: GeomFilter; color: string }) {
  if (geom === 'bucket')  return <BucketIcon color={color} />;
  if (geom === 'slurper') return <SlurperIcon color={color} />;
  if (geom === 'insert')  return <InsertIcon color={color} />;
  // All: show a simple grid
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z"
        stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Geometry chip ─────────────────────────────────────────────────────────────

type GeomChipProps = {
  item: (typeof GEOM_FILTERS)[number];
  active: boolean;
  onPress: () => void;
};

function GeomChip({ item, active, onPress }: GeomChipProps) {
  const iconColor = active ? THEME.ember.bright : THEME.bone[50];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${item.label}`}
      accessibilityState={{ selected: active }}
    >
      <GeomIcon geom={item.key} color={iconColor} />
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
        stroke="#160c06"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Large carousel card ───────────────────────────────────────────────────────

type BangerCardProps = {
  banger: Banger;
  active: boolean;
  onPress: () => void;
};

function BangerCard({ banger, active, onPress }: BangerCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }

  const image = BANGER_IMAGES[banger.id];

  const tagLabel = banger.tags[0] ?? banger.category.toUpperCase();
  const isSlurper = banger.geometry === 'slurper';
  const irSign   = isSlurper ? '+' : '−';
  const irColor  = isSlurper ? THEME.ember.bright : THEME.bone[50];

  const ringColor = active
    ? 'rgba(227, 128, 31, 0.70)'
    : 'rgba(180, 200, 230, 0.10)';

  return (
    <Animated.View style={[styles.cardWrap, animStyle, active && styles.cardShadow]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={banger.name}
        accessibilityState={{ selected: active }}
      >
        {/* Full-card image — contain scales to fit, dark bg on sides is invisible */}
        {image ? (
          <Image
            source={image}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        ) : null}

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

        {/* Tag top-left */}
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{tagLabel}</Text>
        </View>

        {/* Check badge top-right */}
        {active && (
          <View style={styles.cardCheck}>
            <CheckBadge />
          </View>
        )}

        {/* Bottom metadata */}
        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={1}>{banger.name}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaLeft} numberOfLines={1}>
              {banger.geometry.toUpperCase()} · {banger.category.toUpperCase()} · {banger.heat_time} HEAT
            </Text>
            <Text style={[styles.cardIR, { color: irColor }]}>
              {irSign}{banger.gradient_lag_f}°
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── BangerChooser ────────────────────────────────────────────────────────────

export default function BangerChooser() {
  const bangerId    = useFlow((s) => s.bangerId);
  const setBangerId = useFlow((s) => s.setBangerId);

  const [geomFilter, setGeomFilter] = useState<GeomFilter>('All');

  const items = useMemo(
    () => BANGERS.filter((b) => passesGeomFilter(b, geomFilter)),
    [geomFilter],
  );

  const listRef = useRef<FlatList>(null);

  function handleGeomPress(next: GeomFilter) {
    if (next === geomFilter) return;
    void Haptics.selectionAsync();
    setGeomFilter(next);
    // Scroll to start when filter changes
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Auto-select the centered card if none selected yet
      if (viewableItems.length > 0 && !bangerId) {
        const first = viewableItems[0]?.item as Banger | undefined;
        if (first) setBangerId(first.id);
      }
    },
    [bangerId, setBangerId],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  function handleCardPress(b: Banger) {
    void Haptics.selectionAsync();
    setBangerId(b.id);
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(380).easing(STAGGER_EASING)}
    >
      {/* Geometry chips row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {GEOM_FILTERS.map((item) => (
          <GeomChip
            key={item.key}
            item={item}
            active={geomFilter === item.key}
            onPress={() => handleGeomPress(item.key)}
          />
        ))}
      </ScrollView>

      {/* Large carousel */}
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item: b }) => (
          <BangerCard
            banger={b}
            active={bangerId === b.id}
            onPress={() => handleCardPress(b)}
          />
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
    // Bleed horizontally so carousel extends to edges
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
    gap: 6,
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

  // Carousel
  carousel: {
    gap: CARD_GAP,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 16,
    paddingRight: SIDE_PAD + 36, // let next card peek
  },
  cardWrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#160c06',
  },
  cardShadow: {
    shadowColor: THEME.ember.base,
    shadowRadius: 28,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  ring: {
    borderRadius: 18,
    borderWidth: 1,
  },
  cardTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(20, 14, 4, 0.68)',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 174, 90, 0.30)',
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  cardTagText: {
    ...(TYPE.mono as object),
    fontSize: 8.5,
    letterSpacing: 0.18 * 8.5,
    color: THEME.ember.bright,
    textTransform: 'uppercase',
  } as const,
  cardCheck: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  cardBottom: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 18,
    color: THEME.bone[100],
    letterSpacing: -0.3,
    lineHeight: 18 * 1.1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardMetaLeft: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.16 * 9,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    flex: 1,
  } as const,
  cardIR: {
    ...(TYPE.mono as object),
    fontSize: 11,
    letterSpacing: 0.10 * 11,
    textTransform: 'uppercase',
    flexShrink: 0,
  } as const,
});
