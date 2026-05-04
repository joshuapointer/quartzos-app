import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { palette, springs, radii, fontStack } from '../tokens';

type Mood = 'peach' | 'mint' | 'lilac' | 'neutral';

interface Props {
  eyebrow?: string;
  primary: string | number;
  unit?: string;
  hint?: string;
  progress?: number;
  mood?: Mood;
}

const MOOD_STYLES: Record<Mood, { border: string; bg: string; fill: [string, string] }> = {
  peach:   { border: `${palette.accent}72`, bg: '#FDF3EE', fill: [palette.accent, palette.accentDeep] },
  mint:    { border: `${palette.mint}99`,   bg: '#EEFAF3', fill: [palette.mint, '#5EC491'] },
  lilac:   { border: `${palette.lilac}88`,  bg: '#F5EDFB', fill: [palette.lilac, '#9B6EC8'] },
  neutral: { border: palette.border,        bg: palette.surface, fill: [palette.muted, palette.fg] },
};

export function Banner({ eyebrow, primary, unit, hint, progress, mood = 'neutral' }: Props) {
  const moodStyle = MOOD_STYLES[mood];

  // Tick bounce when integer value changes
  const prevInt = useRef<number | null>(null);
  const tickScale = useSharedValue(1);

  const intVal = typeof primary === 'number' ? Math.floor(primary) : null;

  useEffect(() => {
    if (intVal === null) return;
    if (prevInt.current !== null && prevInt.current !== intVal) {
      tickScale.value = 0.7;
      tickScale.value = withSpring(1, { ...springs.squish, overshootClamping: false });
    }
    prevInt.current = intVal;
  }, [intVal]);

  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: tickScale.value }, { scaleX: 1 / Math.max(tickScale.value, 0.01) * 0.5 + 0.5 }],
  }));

  return (
    <View style={[styles.banner, { borderColor: moodStyle.border, backgroundColor: moodStyle.bg }]}>
      {eyebrow != null && (
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      )}

      <View style={styles.primaryRow}>
        <Animated.View style={tickStyle}>
          <Text style={styles.primaryNum}>
            {String(primary)}
          </Text>
        </Animated.View>
        {unit != null && (
          <Text style={styles.unit}>{unit}</Text>
        )}
      </View>

      {hint != null && (
        <Text style={styles.hint}>{hint}</Text>
      )}

      {progress != null && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
                backgroundColor: moodStyle.fill[0],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    alignSelf: 'stretch',
    marginBottom: 8,
    gap: 2,
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  primaryNum: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 30,
    color: palette.fg,
    letterSpacing: -0.04 * 30,
    lineHeight: 34,
  },
  unit: {
    fontFamily: fontStack.bodyMedium,
    fontSize: 16,
    color: palette.muted,
    letterSpacing: -0.02 * 16,
    marginLeft: 1,
  },
  hint: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    color: palette.muted,
    letterSpacing: 0.14 * 10,
    textTransform: 'uppercase',
  },
  progressTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${palette.border}88`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
