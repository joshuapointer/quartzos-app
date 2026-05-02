/**
 * Full-bleed overlay explaining why a concentrate is blocked from preset
 * creation. Renders the `blocked` reason, any `notes`, and a single CTA to
 * dismiss. Animated fade-in via Reanimated when `visible` flips.
 *
 * Returns `null` when not visible — the parent owns visibility state.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { Concentrate } from '../../data/concentrates';
import { colors, fonts, radius, spacing } from '../tokens';
import { usePressScale } from '../hooks/usePressScale';

interface Props {
  readonly concentrate: Concentrate;
  readonly onClose: () => void;
  readonly visible: boolean;
}

export function BlockedConcentrateExplainer({ concentrate, onClose, visible }: Props) {
  const progress = useSharedValue(0);
  const { animatedStyle: ctaAnimatedStyle, onPressIn: ctaPressIn, onPressOut: ctaPressOut } = usePressScale();

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.scrim, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.label}>NOT FOR DABBING</Text>
        <Text style={styles.title}>{concentrate.name}</Text>
        {concentrate.blocked ? (
          <Text style={styles.body}>{concentrate.blocked}</Text>
        ) : null}

        {concentrate.notes.length > 0 ? (
          <View style={styles.notesWrap}>
            {concentrate.notes.map((note, idx) => (
              <View key={`${idx}-${note.slice(0, 6)}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{note}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          onPressIn={ctaPressIn}
          onPressOut={ctaPressOut}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel="Got it"
        >
          <Animated.View style={ctaAnimatedStyle}>
            <Text style={styles.ctaText}>Got it</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(5,4,3,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
  },
  label: {
    ...fonts.labelCaps,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  title: {
    ...fonts.h2,
    color: colors.bone100,
    marginBottom: spacing.md,
  },
  body: {
    ...fonts.body,
    color: colors.bone90,
    marginBottom: spacing.md,
  },
  notesWrap: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    ...fonts.body,
    color: colors.bone50,
    width: 12,
  },
  bulletText: {
    ...fonts.body,
    color: colors.bone70,
    flex: 1,
  },
  cta: {
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface5,
    borderWidth: 1,
    borderColor: colors.bone35,
    alignItems: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.surface6,
  },
  ctaText: {
    ...fonts.body,
    color: colors.bone100,
    fontWeight: '500',
  },
});

export default BlockedConcentrateExplainer;
