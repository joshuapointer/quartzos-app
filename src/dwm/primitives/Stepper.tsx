import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../tokens';

interface Props {
  count: number;
  current: number;
  onTapStep?: (index: number) => void;
}

// Half-fill gradient (accent → border) for the current dot — matches the
// prototype `.stepper .dot.current` rule which uses
// `linear-gradient(90deg, var(--accent), var(--border))`.
function CurrentDot() {
  return (
    <View style={styles.currentCell}>
      <LinearGradient
        colors={[palette.accent, palette.border]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dot}
      />
    </View>
  );
}

export function Stepper({ count, current, onTapStep }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        const tappable = isDone && onTapStep != null;

        return (
          <Pressable
            key={i}
            style={styles.dotWrap}
            onPress={tappable ? () => onTapStep!(i) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Step ${i + 1}`}
            accessibilityState={{ disabled: !tappable }}
          >
            {isCurrent ? (
              <CurrentDot />
            ) : (
              <View style={[styles.dot, isDone && styles.dotDone]} />
            )}
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
  currentCell: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
});
