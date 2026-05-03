/**
 * Confidence pill — tiny rounded badge showing the confidence-source letter
 * (S/M/B/C/E/A). Compound levels like "BRAND+COMMUNITY" render as multiple
 * pills side by side. Tap-and-hold reveals the full description from the
 * `META.confidence_levels` legend.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { META } from '../../data/dabReference';
import { colors, fonts, radius, spacing } from '../tokens';
import { usePressScale } from '../hooks/usePressScale';

interface Props {
  readonly level: string;
}

type LetterCode = 'S' | 'M' | 'B' | 'C' | 'E' | 'A';

function tokenToLetter(token: string): LetterCode | null {
  switch (token.trim().toUpperCase()) {
    case 'SCIENCE':
      return 'S';
    case 'MFR':
    case 'MANUFACTURER':
      return 'M';
    case 'BRAND':
      return 'B';
    case 'COMMUNITY':
      return 'C';
    case 'EMPIRICAL':
      return 'E';
    case 'ANECDOTAL':
      return 'A';
    default:
      return null;
  }
}

function letterTint(letter: LetterCode): { bg: string; fg: string } {
  switch (letter) {
    case 'S':
      return { bg: 'rgba(126,200,160,0.16)', fg: colors.success };
    case 'M':
      return { bg: 'rgba(155,189,216,0.18)', fg: colors.quartzBright };
    case 'B':
      return { bg: 'rgba(196,172,84,0.18)', fg: colors.brass };
    case 'C':
      return { bg: colors.firedAmber + '2E', fg: colors.emberBright };
    case 'E':
      return { bg: 'rgba(199,184,164,0.16)', fg: colors.bone70 };
    case 'A':
      return { bg: 'rgba(224,112,112,0.14)', fg: colors.error };
  }
}

interface SinglePillProps {
  readonly letter: LetterCode;
}

function SinglePill({ letter }: SinglePillProps) {
  const [tipVisible, setTipVisible] = useState(false);
  const description = META.confidence_levels[letter] ?? '';
  const { bg, fg } = letterTint(letter);

  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();

  const handleIn = useCallback(() => {
    setTipVisible(true);
    scaleIn();
  }, [scaleIn]);
  const handleOut = useCallback(() => {
    setTipVisible(false);
    scaleOut();
  }, [scaleOut]);

  return (
    <View style={styles.pillWrap}>
      <Pressable
        onPressIn={handleIn}
        onPressOut={handleOut}
        accessibilityRole="text"
        accessibilityLabel={`Confidence ${letter}: ${description}`}
        style={[styles.pill, { backgroundColor: bg, borderColor: fg }]}
      >
        <Animated.View style={[styles.pillInner, animatedStyle]}>
          <Text style={[styles.letter, { color: fg }]}>{letter}</Text>
        </Animated.View>
      </Pressable>
      {tipVisible && description ? (
        <View style={styles.tooltip} pointerEvents="none">
          <Text style={styles.tooltipText}>{description}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ConfidencePill({ level }: Props) {
  const letters = useMemo<readonly LetterCode[]>(() => {
    if (!level) return [];
    if (level.toUpperCase() === 'N/A') return [];
    return level
      .split('+')
      .map((t) => tokenToLetter(t))
      .filter((l): l is LetterCode => l !== null);
  }, [level]);

  if (letters.length === 0) return null;

  return (
    <View style={styles.row}>
      {letters.map((letter, idx) => (
        <SinglePill key={`${letter}-${idx}`} letter={letter} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pillWrap: {
    position: 'relative',
  },
  pill: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...fonts.labelCaps,
    fontSize: 10,
    letterSpacing: 1,
  },
  tooltip: {
    position: 'absolute',
    bottom: '110%',
    left: '50%',
    transform: [{ translateX: -90 }],
    width: 180,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface5,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    zIndex: 10,
  },
  tooltipText: {
    ...fonts.caption,
    color: colors.bone90,
  },
});

export default ConfidencePill;
