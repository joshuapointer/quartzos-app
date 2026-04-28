/**
 * src/flow/components/ChooserCard.tsx
 *
 * Reusable picker row for Banger / Concentrate / Wall choosers.
 * Active = ember gradient + ring + glow. Disabled = red-tinted ring + low opacity.
 *
 * Tokens: src/flow/theme.ts
 * Reference: /tmp/quartzie-prototype/src/flow-build.jsx ChooserCard
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { type ReactNode } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { THEME, TYPE } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChooserCardProps = {
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  title: string;
  sub?: string;
  subColor?: string;
  blockedReason?: string;
  warning?: string;
  right?: ReactNode;
  image?: ImageSourcePropType;
};

// ─── Check icon ───────────────────────────────────────────────────────────────

function CheckBadge() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Circle cx={7} cy={7} r={6.5} fill={THEME.ember.bright} />
      <Path
        d="M3.5 7l2.5 2.5L10.5 4.5"
        stroke="#1a1208"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── ChooserCard ──────────────────────────────────────────────────────────────

export default function ChooserCard({
  active = false,
  disabled = false,
  onPress,
  title,
  sub,
  subColor,
  blockedReason,
  warning,
  right,
  image,
}: ChooserCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (disabled) return;
    scale.value = withSpring(0.98, { damping: 20, stiffness: 320 });
  }

  function handlePressOut() {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 20, stiffness: 320 });
  }

  function handlePress() {
    if (disabled || !onPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const titleColor = active
    ? THEME.bone[100]
    : disabled
      ? THEME.bone[50]
      : THEME.bone[90];

  // Determine background style.
  const backgroundEl = active ? (
    <LinearGradient
      colors={['#1d2638', '#0d1120']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  ) : (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: disabled
            ? 'rgba(80,30,30,0.10)'
            : 'rgba(180, 200, 230, 0.04)',
        },
      ]}
    />
  );

  const ringColor = active
    ? 'rgba(227, 128, 31, 0.6)'
    : disabled
      ? 'rgba(132, 76, 71, 0.4)'
      : 'rgba(180, 200, 230, 0.08)';

  return (
    <Animated.View
      style={[
        animStyle,
        styles.shadowWrap,
        active && styles.activeShadow,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.pressable, disabled && styles.disabledOpacity]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!disabled, selected: !!active }}
        accessibilityHint={blockedReason}
      >
        {backgroundEl}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.ring,
            { borderColor: ringColor },
          ]}
        />

        <View style={styles.row}>
          {image != null && (
            <Image
              source={image}
              style={[styles.thumbnail, disabled && styles.thumbnailDisabled]}
              resizeMode="cover"
            />
          )}
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
                {title}
              </Text>
              {disabled && <Text style={styles.blockedTag}>BLOCKED</Text>}
            </View>
            {sub ? (
              <Text style={[styles.sub, subColor ? { color: subColor } : null]}>
                {sub}
              </Text>
            ) : null}
            {blockedReason ? (
              <Text style={styles.blockedReason}>{blockedReason}</Text>
            ) : null}
            {warning ? <Text style={styles.warning}>{warning}</Text> : null}
          </View>
          <View style={styles.rightSlot}>
            {right ?? (active ? <CheckBadge /> : null)}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 14,
  },
  activeShadow: {
    shadowColor: THEME.ember.base,
    shadowRadius: 22,
    shadowOpacity: 0.20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pressable: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  disabledOpacity: {
    opacity: 0.65,
  },
  ring: {
    borderRadius: 14,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    flexShrink: 0,
  },
  thumbnailDisabled: {
    opacity: 0.45,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13.5,
    letterSpacing: -0.135,
  },
  blockedTag: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.14 * 9,
    color: '#ad6359',
  } as const,
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: THEME.bone[50],
    lineHeight: 11 * 1.4,
  },
  blockedReason: {
    fontFamily: 'Geist_400Regular',
    fontStyle: 'italic',
    fontSize: 10.5,
    color: '#bd7a6f',
    lineHeight: 10.5 * 1.4,
    marginTop: 4,
  },
  warning: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: THEME.warn,
    lineHeight: 11 * 1.4,
    marginTop: 4,
  },
  rightSlot: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
