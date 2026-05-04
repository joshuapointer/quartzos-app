import React, { ReactNode, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { palette, springs, radii, fontStack } from '../tokens';

interface WallItem {
  id: string;
  name: string;
  meta?: string;
  illustration?: ReactNode;
}

interface Props {
  items: ReadonlyArray<WallItem>;
  selectedId?: string;
  onSelect: (item: WallItem) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function WallCell({
  item,
  selected,
  onSelect,
}: {
  item: WallItem;
  selected: boolean;
  onSelect: (item: WallItem) => void;
}) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springs.squish);
  }, []);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.squish);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onSelect(item)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.cell, selected && styles.cellSelected, animStyle]}
    >
      {item.illustration != null && (
        <View style={styles.illo}>{item.illustration}</View>
      )}
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {item.meta != null && (
        <Text style={styles.meta} numberOfLines={2}>{item.meta}</Text>
      )}
    </AnimatedPressable>
  );
}

export function WallGrid({ items, selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <WallCell
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  cell: {
    // 2-column: subtract gap and divide
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cellSelected: {
    borderColor: palette.accent,
    borderWidth: 2,
    shadowColor: `${palette.accent}40`,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  illo: {
    width: 56,
    height: 56,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fontStack.display,
    fontSize: 13.5,
    color: palette.fg,
    letterSpacing: -0.01 * 13.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  meta: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    color: palette.muted,
    lineHeight: 13,
    textAlign: 'center',
  },
});
