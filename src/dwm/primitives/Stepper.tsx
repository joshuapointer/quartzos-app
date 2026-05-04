import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { palette, radii } from '../tokens';

interface Props {
  count: number;
  current: number;
  onTapStep?: (index: number) => void;
}

export function Stepper({ count, current, onTapStep }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <Pressable
            key={i}
            style={styles.dotWrap}
            onPress={() => isDone && onTapStep?.(i)}
            accessibilityRole="button"
            accessibilityLabel={`Step ${i + 1}`}
          >
            <View
              style={[
                styles.dot,
                isDone && styles.dotDone,
                isCurrent && styles.dotCurrent,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dotWrap: {
    flex: 1,
    height: 4,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
  },
  dotDone: {
    backgroundColor: palette.accent,
  },
  dotCurrent: {
    // half-peach: left portion accent, right portion border — achieved via accent at 50% opacity blended
    backgroundColor: palette.accent,
    opacity: 0.55,
  },
});
