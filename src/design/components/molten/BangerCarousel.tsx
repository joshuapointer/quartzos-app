import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients } from '../../tokens';
import { PrismEdge } from './PrismEdge';
import { Banger } from '../../../data/bangers';

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants (mirrors .banger-card / .carousel-track in index.html)
// ─────────────────────────────────────────────────────────────────────────────
const CARD_WIDTH = 184;
const GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + GAP;

export type BangerCarouselProps = {
  bangers: readonly Banger[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  width?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Individual card
// ─────────────────────────────────────────────────────────────────────────────
interface BangerCardProps {
  banger: Banger;
  isActive: boolean;
  onPress: () => void;
}

function BangerCard({ banger, isActive, onPress }: BangerCardProps) {
  const [low, high] = banger.surface_temp_range_f;
  // First letter glyph-fallback for photo placeholder
  const glyph = banger.name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={banger.name}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
        {/* Glass blur layer */}
        <BlurView
          intensity={14}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.cardBlur]}
        />

        {/* Glass tint fill */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.cardFill,
            isActive ? styles.cardFillActive : styles.cardFillDefault,
          ]}
          pointerEvents="none"
        />

        {/* Active prism edge overlay */}
        {isActive && <PrismEdge radius={18} strokeWidth={0.75} />}

        {/* Card content — sits above blur/tint layers */}
        <View style={styles.cardContent}>
          {/* Photo placeholder — TODO: real banger photos */}
          <View style={styles.photoWrapper}>
            <LinearGradient
              colors={gradients.photoPlaceholder}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.photo, isActive && styles.photoActive]}
            >
              <Text style={styles.photoGlyph}>{glyph}</Text>
            </LinearGradient>
          </View>

          {/* b-name */}
          <Text style={styles.name} numberOfLines={2}>
            {banger.name}
          </Text>

          {/* b-sub */}
          <Text style={styles.sub} numberOfLines={2}>
            {banger.category.toUpperCase()}
          </Text>

          {/* b-temp */}
          <Text style={styles.temp}>
            {low}
            {'–'}
            {high}
            <Text style={styles.tempUnit}>{'°F'}</Text>
          </Text>
        </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pip dot row
// ─────────────────────────────────────────────────────────────────────────────
interface PipDotsProps {
  count: number;
  scrollX: SharedValue<number>;
}

function PipDots({ count, scrollX }: PipDotsProps) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }, (_, i) => (
        <AnimatedPip key={i} index={i} scrollX={scrollX} />
      ))}
    </View>
  );
}

interface AnimatedPipProps {
  index: number;
  scrollX: SharedValue<number>;
}

function AnimatedPip({ index, scrollX }: AnimatedPipProps) {
  const activeProgress = useDerivedValue(() => {
    const nearest = Math.round(scrollX.value / SNAP_INTERVAL);
    const dist = Math.abs(nearest - index);
    return dist === 0 ? 1 : 0;
  });

  // Dot scales between 0.66 (inactive, visual ~4px) and 1.0 (active, 6px).
  // Fixed container (12×12) keeps layout stable as scale changes.
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeProgress.value, [0, 1], [0.66, 1]) }],
    backgroundColor: activeProgress.value > 0.5 ? colors.bone100 : colors.glassEdge,
  }));

  // Static halo: prismCyan circle behind the dot, opacity driven by activeProgress.
  const haloStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dotHalo, haloStyle]} />
      <Animated.View style={[styles.dot, dotStyle]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main carousel
// ─────────────────────────────────────────────────────────────────────────────
export function BangerCarousel({
  bangers,
  selectedId,
  onSelect,
  width = Dimensions.get('window').width,
}: BangerCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.value = e.nativeEvent.contentOffset.x;
    },
    [scrollX],
  );

  const handleCardPress = useCallback(
    (banger: Banger, index: number) => {
      scrollRef.current?.scrollTo({
        x: index * SNAP_INTERVAL,
        animated: true,
      });
      onSelect(banger.id);
    },
    [onSelect],
  );

  return (
    <View style={[styles.root, { width }]}>
      {/* Picker head — matches .picker-head */}
      <View style={styles.header}>
        <Text style={styles.title}>Your banger</Text>
        <Text style={styles.meta}>{bangers.length} styles · swipe</Text>
      </View>

      {/* Horizontal snap track */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.trackContent}
        style={styles.track}
      >
        {bangers.map((banger, index) => (
          <BangerCard
            key={banger.id}
            banger={banger}
            isActive={selectedId === banger.id}
            onPress={() => handleCardPress(banger, index)}
          />
        ))}
      </ScrollView>

      {/* Pip dots */}
      <PipDots count={bangers.length} scrollX={scrollX} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
  },

  // Header — .picker-head
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  title: {
    ...fonts.serifHeadline,
    color: colors.bone100,
  },
  meta: {
    ...fonts.monoEyebrow,
    color: colors.bone40,
  },

  // Track
  track: {
    flexGrow: 0,
  },
  trackContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    // Gap via marginRight on cards — RN ScrollView contentContainerStyle
    // does not reliably honour 'gap' on older RN versions.
  },

  // Card — .banger-card
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.glassEdge,
    overflow: 'hidden',
    marginRight: GAP,
    position: 'relative',
  },
  cardActive: {
    borderColor: 'transparent',
    transform: [{ scale: 1.02 }],
  },
  cardBlur: {
    borderRadius: 18,
  },
  cardFill: {
    borderRadius: 18,
  },
  cardFillDefault: {
    backgroundColor: colors.glassPane,
  },
  cardFillActive: {
    backgroundColor: colors.glassThick,
  },

  // Card content wrapper — sits above blur/tint layers in z-order
  cardContent: {
    padding: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
  },

  // Photo placeholder — .banger-photo
  photoWrapper: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1 / 1.02,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActive: {
    transform: [{ scale: 1.06 }],
  },
  photoGlyph: {
    ...fonts.serifHeadline,
    fontSize: 48,
    color: colors.bone35,
    lineHeight: 56,
  },

  // b-name
  name: {
    ...fonts.serifCard,
    color: colors.bone100,
    marginBottom: 5,
    textAlign: 'center',
  },

  // b-sub
  sub: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 8.5,
    letterSpacing: 1.53, // 0.18em * 8.5
    textTransform: 'uppercase',
    color: colors.bone40,
    lineHeight: 11,
    minHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },

  // b-temp
  temp: {
    ...fonts.serifCard,
    fontSize: 16,
    color: colors.bone80,
    textAlign: 'center',
  },
  tempUnit: {
    fontSize: 10,
    color: colors.bone40,
  },

  // Pip dots — .carousel-dots / .carousel-dot
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 14,
    minHeight: 14,
  },
  // Fixed 12×12 container centers the dot so scale doesn't shift layout
  dotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Halo: prismCyan glow behind active dot
  dotHalo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.prismCyan,
    opacity: 0.4,
  },
  // Dot: rendered at active size (6×6), scaled down to ~4px when inactive
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
