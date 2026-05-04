import React, { ReactNode, useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, fontStack, radii, layout } from '../tokens';

const DEFAULT_ITEM_W = 280;
const DEFAULT_ITEM_H = 320;
const DEFAULT_SPACING = 12;
const FADE_W = 24;

interface ChipDef {
  id: string;
  label: string;
}

interface Props<T> {
  items: ReadonlyArray<T>;
  renderItem: (item: T, isActive: boolean) => ReactNode;
  keyExtractor: (item: T) => string;
  onSelect: (item: T) => void;
  initialIndex?: number;
  itemWidth?: number;
  itemSpacing?: number;
  chips?: ChipDef[];
  activeChipId?: string;
  onChipChange?: (id: string) => void;
}

export function Carousel<T>({
  items,
  renderItem,
  keyExtractor,
  onSelect,
  initialIndex = 0,
  itemWidth = DEFAULT_ITEM_W,
  itemSpacing = DEFAULT_SPACING,
  chips,
  activeChipId,
  onChipChange,
}: Props<T>) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);

  const sidePad = layout.screenPaddingX;
  const snapInterval = itemWidth + itemSpacing;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offset / snapInterval);
      setActiveIndex(Math.max(0, Math.min(idx, items.length - 1)));
    },
    [snapInterval, items.length],
  );

  return (
    <View style={styles.wrapper}>
      {chips && chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {chips.map((chip) => {
            const isActive = chip.id === activeChipId;
            return (
              <Pressable
                key={chip.id}
                onPress={() => onChipChange?.(chip.id)}
                style={[styles.chip, isActive && styles.chipActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                  {chip.label.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Negative margin so scroll content bleeds to phone edges */}
      <View style={[styles.carouselOuter, { marginHorizontal: -sidePad }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: sidePad },
          ]}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {items.map((item, idx) => (
            <Pressable
              key={keyExtractor(item)}
              onPress={() => onSelect(item)}
              style={[
                styles.item,
                { width: itemWidth, height: DEFAULT_ITEM_H },
                idx < items.length - 1 && { marginRight: itemSpacing },
              ]}
            >
              {renderItem(item, idx === activeIndex)}
            </Pressable>
          ))}
        </ScrollView>

        {/* Edge fades — mirror prototype `.carousel-wrap::before/::after` (lines 1316-1333) */}
        <LinearGradient
          colors={[palette.bg, `${palette.bg}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={[styles.fade, { left: 0, width: FADE_W }]}
        />
        <LinearGradient
          colors={[`${palette.bg}00`, palette.bg]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={[styles.fade, { right: 0, width: FADE_W }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  chipRow: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 6,
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(251,241,244,0.6)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.fg,
    borderColor: palette.fg,
  },
  chipLabel: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    letterSpacing: 0.16 * 9.5,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  chipLabelActive: {
    color: palette.bg,
  },
  carouselOuter: {
    overflow: 'visible',
  },
  scrollContent: {
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  item: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 14,
    zIndex: 2,
  },
});
