/**
 * src/flow/stages/BangerChooser.tsx
 *
 * Step 1: Pick your vessel.
 * Layout:
 *   – Geometry selector row (Bucket / Slurper / Insert) — three equal cards
 *   – Large horizontal carousel — one card centered + peek, snap-to-item
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
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
const SIDE_PAD = 22;
const CARD_GAP = 12;
// Carousel card width: nearly full width with small peek of the next card
const CARD_PEEK = 18;
const CARD_W = SCREEN_W - SIDE_PAD * 2 - CARD_PEEK;
const CARD_H = 248;

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

// ─── Geometry filter types ─────────────────────────────────────────────────────

type GeomFilter = BangerGeometry;

const GEOM_SUBTYPE: Record<GeomFilter, string> = {
  bucket:  'CUP-SHAPE',
  slurper: 'VORTEX',
  insert:  'DROP-IN',
  enail:   'E-NAIL',
};

const GEOM_FILTERS: { key: GeomFilter; label: string; sub: string; count: number }[] = [
  { key: 'bucket',  label: 'Bucket',  sub: GEOM_SUBTYPE.bucket,  count: BANGERS.filter(b => b.geometry === 'bucket').length },
  { key: 'slurper', label: 'Slurper', sub: GEOM_SUBTYPE.slurper, count: BANGERS.filter(b => b.geometry === 'slurper').length },
  { key: 'insert',  label: 'Insert',  sub: GEOM_SUBTYPE.insert,  count: BANGERS.filter(b => b.geometry === 'insert').length },
];

function passesGeomFilter(b: Banger, f: GeomFilter): boolean {
  return b.geometry === f;
}

// ─── Geometry icons ────────────────────────────────────────────────────────────
//
// Drawn at 32 viewBox so the same line-weight reads at chip and card scale.
// Stroke-only line art on a transparent fill — colour swaps via stroke prop.

function BucketIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M9 8h14v14a3 3 0 01-3 3h-8a3 3 0 01-3-3V8z"
        stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M8 8h16" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function SlurperIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M16 4v8" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path
        d="M11 12h10v10a3 3 0 01-3 3h-4a3 3 0 01-3-3V12z"
        stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M13 22h6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M14.5 25h3v2.5h-3z" stroke={color} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function InsertIcon({ color, size = 32 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M9 7h14v13a3 3 0 01-3 3h-8a3 3 0 01-3-3V7z"
        stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M13 23h6v3h-6z" stroke={color} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function GeomIcon({ geom, color, size }: { geom: GeomFilter; color: string; size?: number }) {
  if (geom === 'slurper') return <SlurperIcon color={color} size={size} />;
  if (geom === 'insert')  return <InsertIcon color={color} size={size} />;
  return <BucketIcon color={color} size={size} />;
}

// ─── Geometry selector card ────────────────────────────────────────────────────

type GeomChipProps = {
  item: (typeof GEOM_FILTERS)[number];
  active: boolean;
  onPress: () => void;
};

function GeomChip({ item, active, onPress }: GeomChipProps) {
  const iconColor = active ? THEME.ember.bright : THEME.bone[70];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.geomCard, active && styles.geomCardActive]}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${item.label}`}
      accessibilityState={{ selected: active }}
    >
      <View style={styles.geomIconWrap}>
        <GeomIcon geom={item.key} color={iconColor} size={30} />
      </View>
      <Text style={[styles.geomLabel, active && styles.geomLabelActive]}>
        {item.label}
      </Text>
      <View style={[styles.geomTag, active && styles.geomTagActive]}>
        <Text style={[styles.geomTagText, active && styles.geomTagTextActive]}>
          {item.sub}
        </Text>
        <Text style={[styles.geomTagCount, active && styles.geomTagCountActive]}>
          {item.count}
        </Text>
      </View>
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

  const tagLabel = `${banger.geometry.toUpperCase()}-CLASS`;

  const ringColor = active
    ? 'rgba(255, 122, 0, 0.85)'
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
        {/* Subtle ember bloom on active card — anchors the glow */}
        {active && (
          <View pointerEvents="none" style={styles.cardEmberBloom} />
        )}

        {/* Banger image, centered with breathing room around it */}
        {image ? (
          <Image
            source={image}
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : null}

        {/* Thin scrim only over the bottom label zone */}
        <LinearGradient
          colors={['transparent', active ? 'rgba(12,6,0,0.96)' : 'rgba(6,10,20,0.96)']}
          start={{ x: 0.5, y: 0.55 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Ring */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.ring, { borderColor: ringColor }]}
        />

        {/* Tag top-left — geometry class */}
        <View style={[styles.cardTag, active && styles.cardTagActive]}>
          <Text style={[styles.cardTagText, active && styles.cardTagTextActive]}>
            {tagLabel}
          </Text>
        </View>

        {/* Check badge top-right */}
        {active && (
          <View style={styles.cardCheck}>
            <CheckBadge />
          </View>
        )}

        {/* Bottom metadata — centered */}
        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={1}>{banger.name}</Text>
          <Text style={styles.cardMetaLine} numberOfLines={1}>
            {banger.geometry.toUpperCase()} · {banger.category.toUpperCase()} · {banger.heat_time} HEAT
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── BangerChooser ────────────────────────────────────────────────────────────

export default function BangerChooser() {
  const bangerId    = useFlow((s) => s.bangerId);
  const setBangerId = useFlow((s) => s.setBangerId);

  // Default to the geometry of the already-selected banger if any,
  // otherwise fall back to the first geometry filter (Bucket).
  const initialGeom: GeomFilter = useMemo(() => {
    const current = BANGERS.find((b) => b.id === bangerId);
    if (current && current.geometry !== 'enail') return current.geometry;
    return 'bucket';
  }, [bangerId]);

  const [geomFilter, setGeomFilter] = useState<GeomFilter>(initialGeom);

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

  // Auto-select on scroll, but only after the user has interacted. This keeps
  // BuildStage's "Make a selection to continue" hint honest on first mount and
  // forces an explicit choice rather than implicitly committing the user to
  // whatever happened to be centered.
  const userInteractedRef = useRef(false);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!userInteractedRef.current) return;
      if (viewableItems.length === 0) return;
      const first = viewableItems[0]?.item as Banger | undefined;
      if (first) setBangerId(first.id);
    },
    [setBangerId],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  function handleCardPress(b: Banger) {
    userInteractedRef.current = true;
    void Haptics.selectionAsync();
    setBangerId(b.id);
  }

  function handleScrollBeginDrag() {
    userInteractedRef.current = true;
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(380).easing(STAGGER_EASING)}
    >
      {/* Geometry selector — three equal cards, full row */}
      <View style={styles.geomRow}>
        {GEOM_FILTERS.map((item) => (
          <GeomChip
            key={item.key}
            item={item}
            active={geomFilter === item.key}
            onPress={() => handleGeomPress(item.key)}
          />
        ))}
      </View>

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
        onScrollBeginDrag={handleScrollBeginDrag}
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

  // ── Geometry selector row (3 equal cards) ──
  geomRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 16,
  },
  geomCard: {
    flex: 1,
    minHeight: 104,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    backgroundColor: 'rgba(180, 200, 230, 0.03)',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  geomCardActive: {
    borderColor: 'rgba(255, 122, 0, 0.85)',
    backgroundColor: 'rgba(255, 122, 0, 0.18)',
    shadowColor: THEME.ember.base,
    shadowRadius: 18,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  geomIconWrap: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geomLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    letterSpacing: -0.2,
    color: THEME.bone[90],
  },
  geomLabelActive: {
    color: THEME.bone[100],
  },
  geomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.08)',
  },
  geomTagActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderColor: 'rgba(255, 174, 90, 0.22)',
  },
  geomTagText: {
    ...(TYPE.mono as object),
    fontSize: 8,
    letterSpacing: 0.16 * 8,
    color: THEME.bone[35],
    textTransform: 'uppercase',
  } as const,
  geomTagTextActive: {
    color: THEME.bone[70],
  },
  geomTagCount: {
    ...(TYPE.mono as object),
    fontSize: 8,
    letterSpacing: 0.10 * 8,
    color: THEME.bone[50],
  } as const,
  geomTagCountActive: {
    color: THEME.bone[100],
  },

  // ── Carousel ──
  carousel: {
    gap: CARD_GAP,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 16,
    paddingRight: SIDE_PAD + CARD_PEEK + CARD_GAP,
  },
  cardWrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#160c06',
  },
  cardShadow: {
    shadowColor: THEME.ember.base,
    shadowRadius: 30,
    shadowOpacity: 0.40,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cardEmberBloom: {
    position: 'absolute',
    top: -CARD_H * 0.35,
    left: '50%',
    width: CARD_H * 1.6,
    height: CARD_H * 1.6,
    marginLeft: -CARD_H * 0.8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 122, 0, 0.10)',
  },
  cardImage: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    bottom: 80,
  },
  ring: {
    borderRadius: 20,
    borderWidth: 1.25,
  },
  cardTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(20, 14, 4, 0.68)',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 174, 90, 0.30)',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  cardTagActive: {
    backgroundColor: 'rgba(255, 122, 0, 0.16)',
    borderColor: 'rgba(255, 122, 0, 0.55)',
  },
  cardTagText: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.18 * 9,
    color: THEME.ember.bright,
    textTransform: 'uppercase',
  } as const,
  cardTagTextActive: {
    color: THEME.ember.bright,
  },
  cardCheck: {
    position: 'absolute',
    top: 12,
    right: 14,
  },
  cardBottom: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 10,
    gap: 6,
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 19,
    color: THEME.bone[100],
    letterSpacing: -0.3,
    lineHeight: 19 * 1.1,
    textAlign: 'center',
  },
  cardMetaLine: {
    ...(TYPE.mono as object),
    fontSize: 9.5,
    letterSpacing: 0.14 * 9.5,
    color: THEME.bone[50],
    textTransform: 'uppercase',
    textAlign: 'center',
  } as const,
});
