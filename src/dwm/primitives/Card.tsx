import React, { ReactNode, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, springs, radii, fontStack } from '../tokens';

type GlyphTint = 'peach' | 'mint' | 'butter' | 'lilac';

const GLYPH_GRADIENTS: Record<GlyphTint, [string, string]> = {
  peach:  ['#F5C4AE', '#FAE8DC'],
  mint:   [palette.mint, '#D9F4E8'],
  butter: [palette.butter, '#FBF5D0'],
  lilac:  [palette.lilac, '#EDE0F5'],
};

interface Props {
  glyph?: { tint: GlyphTint; icon: ReactNode };
  title: string;
  sub?: string | ReactNode;
  chevron?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ glyph, title, sub, chevron = false, selected = false, onPress }: Props) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springs.squish);
  }, []);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.squish);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 - pressed.value * 0.04 },
      { scaleX: 1 + pressed.value * 0.01 },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      style={[
        styles.card,
        selected && styles.cardSelected,
        animStyle,
      ]}
    >
      {glyph && (
        <LinearGradient
          colors={GLYPH_GRADIENTS[glyph.tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glyph}
        >
          {glyph.icon}
        </LinearGradient>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {typeof sub === 'string' ? (
          <Text style={styles.sub}>{sub}</Text>
        ) : sub != null ? (
          <View style={styles.subRow}>{sub}</View>
        ) : null}
      </View>
      {chevron && (
        <Text style={styles.chevron}>{'›'}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: palette.accent,
    borderWidth: 2,
    shadowColor: `${palette.accent}40`,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  glyph: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontStack.display,
    fontSize: 15.5,
    color: palette.fg,
    letterSpacing: -0.015 * 15.5,
    marginBottom: 3,
  },
  sub: {
    fontSize: 12.5,
    color: palette.muted,
    lineHeight: 17,
    fontFamily: fontStack.body,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chevron: {
    fontSize: 20,
    color: palette.muted,
    opacity: 0.7,
    flexShrink: 0,
  },
});
