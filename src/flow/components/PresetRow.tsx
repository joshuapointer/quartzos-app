/**
 * src/flow/components/PresetRow.tsx
 *
 * Glass-disc card row for a single SavedPreset.
 * Uses expo-blur for backdrop blur, react-native-svg for glyphs,
 * and Reanimated for press spring.
 *
 * Memoized — rendered in lists; equality is shallow on props.
 *
 * Tokens: src/flow/theme.ts
 * Data:   src/flow/data.ts
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import {
  BANGERS,
  CONCENTRATES,
  SENSORS,
  WALLS,
  computeCalibration,
  type SavedPreset,
} from '../data';
import { THEME } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PresetRowProps = {
  preset: SavedPreset;
  onApply: () => void;
  selected?: boolean;
};

// ─── PresetGlyph ──────────────────────────────────────────────────────────────
// 44pt circle with kind-specific radial gradient.

type GlyphKind = 'quartz' | 'opaque' | 'low' | 'custom';

function PresetGlyph({ kind, size = 44 }: { kind: GlyphKind; size?: number }) {
  const r = size / 2;

  // Gradient stops per kind
  const gradients: Record<GlyphKind, { cx: string; cy: string; stops: { offset: string; color: string; opacity: number }[] }> = {
    quartz: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: '#ffcf82', opacity: 1 },
        { offset: '45%',  color: '#c8821a', opacity: 1 },
        { offset: '100%', color: '#1a0e02', opacity: 1 },
      ],
    },
    opaque: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: '#d4d8e0', opacity: 1 },
        { offset: '45%',  color: '#8a93a3', opacity: 1 },
        { offset: '100%', color: '#1a1d24', opacity: 1 },
      ],
    },
    low: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: '#c8dff5', opacity: 1 },
        { offset: '45%',  color: '#5d7388', opacity: 1 },
        { offset: '100%', color: '#06101e', opacity: 1 },
      ],
    },
    custom: {
      cx: '35%', cy: '30%',
      stops: [
        { offset: '0%',   color: THEME.ember.bright, opacity: 1 },
        { offset: '45%',  color: THEME.ember.deep,   opacity: 1 },
        { offset: '100%', color: '#0a0402',           opacity: 1 },
      ],
    },
  };

  const g = gradients[kind];
  const glowColor = kind === 'custom' ? THEME.ember.base : kind === 'quartz' ? '#c8821a' : kind === 'low' ? THEME.quartz.base : THEME.bone[50];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        flexShrink: 0,
        shadowColor: kind === 'custom' ? THEME.ember.base : glowColor,
        shadowRadius: kind === 'custom' ? 18 : 8,
        shadowOpacity: kind === 'custom' ? 0.55 : 0.25,
        shadowOffset: { width: 0, height: 0 },
        elevation: kind === 'custom' ? 6 : 3,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={`glyph_${kind}`} cx={g.cx} cy={g.cy} r="70%" fx={g.cx} fy={g.cy}>
            {g.stops.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </RadialGradient>
          {/* Shimmer */}
          <RadialGradient id={`shimmer_${kind}`} cx="32%" cy="26%" r="36%" fx="32%" fy="26%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.40" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#glyph_${kind})`} />
        <Circle cx={r} cy={r} r={r} fill={`url(#shimmer_${kind})`} />
        {/* Thin ring */}
        <Circle
          cx={r}
          cy={r}
          r={r - 0.5}
          fill="none"
          stroke={glowColor}
          strokeOpacity={0.25}
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
}

// ─── TempPill ─────────────────────────────────────────────────────────────────

type TempPillProps = { label: string; temp: number; accent: 'ember' | 'quartz' };

function TempPill({ label, temp, accent }: TempPillProps) {
  const accentColor = accent === 'ember' ? THEME.ember.bright : THEME.quartz.bright;
  return (
    <View style={styles.tempPill}>
      <Text style={[styles.tempLabel, { color: accentColor }]}>{label}</Text>
      <Text style={[styles.tempValue, { color: accentColor }]}>
        {Math.round(temp)}°
      </Text>
    </View>
  );
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function Chevron() {
  return (
    <Svg width={7} height={12} viewBox="0 0 8 14">
      <Path
        d="M1 1l6 6-6 6"
        stroke={THEME.bone[50]}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── PresetRow ────────────────────────────────────────────────────────────────

function PresetRowInner({ preset, onApply, selected = false }: PresetRowProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1.0, { damping: 20, stiffness: 300 });
  }

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onApply();
  }

  // Compute calibration values
  const banger = BANGERS.find((b) => b.id === preset.banger);
  const conc = CONCENTRATES.find((c) => c.id === preset.concentrate);
  const sensor = SENSORS.find((s) => s.id === preset.sensor);
  const wall = WALLS.find((w) => w.id === preset.wall);
  const cal =
    banger && conc && wall
      ? computeCalibration(banger, conc, wall)
      : null;
  const dab = cal?.displayed ?? 0;
  const dunk = cal?.dunk ?? 0;

  // Suppress unused variable warning for sensor (kept for future use)
  void sensor;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`Apply ${preset.name} preset`}
        accessibilityState={{ selected }}
      >
        <BlurView intensity={22} tint="dark" style={styles.blurContainer}>
          {/* Inner hairline border */}
          <View style={styles.innerBorder} />

          {/* Content row */}
          <View style={styles.contentRow}>
            {/* Left: glyph */}
            <PresetGlyph kind={preset.kind} size={44} />

            {/* Middle: name + temp pills */}
            <View style={styles.middle}>
              <View style={styles.nameRow}>
                <Text style={styles.presetName} numberOfLines={1}>
                  {preset.name}
                </Text>
                {preset.builtin && (
                  <View style={styles.builtinTag}>
                    <Text style={styles.builtinText}>BUILT-IN</Text>
                  </View>
                )}
              </View>
              <View style={styles.pillsRow}>
                <TempPill label="DAB" temp={dab} accent="ember" />
                <TempPill label="DUNK" temp={dunk} accent="quartz" />
              </View>
            </View>

            {/* Right: chevron */}
            <Chevron />
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const PresetRow = React.memo(PresetRowInner);
export default PresetRow;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  blurContainer: {
    padding: 18,
    borderRadius: 999,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  presetName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14.5,
    color: THEME.bone[100],
    letterSpacing: -0.218,
    flexShrink: 1,
  },
  builtinTag: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(180, 200, 230, 0.06)',
    flexShrink: 0,
  },
  builtinText: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 8,
    letterSpacing: 0.14 * 8,
    color: THEME.bone[50],
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  tempPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tempLabel: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9,
  },
  tempValue: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
  },
});
