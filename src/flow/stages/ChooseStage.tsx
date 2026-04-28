/**
 * src/flow/stages/ChooseStage.tsx
 *
 * S-03 — Choose stage. Scrollable list: "New sesh" card + divider + saved presets.
 *
 * PRD §5.2 + prototype ChooseStage (flow-shell.jsx line 438).
 *
 * Tokens: src/flow/theme.ts
 * Data:   src/flow/data.ts
 * Store:  useFlow from ../store
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import PresetRow from '../components/PresetRow';
import { SAVED_PRESETS } from '../data';
import { useFlow } from '../store';
import { THEME } from '../theme';

// ─── Entrance animation helper ────────────────────────────────────────────────

function useStaggerEntrance(idx: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = idx * 55;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600 }));
  }, [idx, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ─── Sphere glyph for "New sesh" card ─────────────────────────────────────────

function NewSeshGlyph() {
  const size = 44;
  const r = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        flexShrink: 0,
        shadowColor: THEME.ember.base,
        shadowRadius: 18,
        shadowOpacity: 0.55,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="newSeshMain" cx="35%" cy="30%" r="70%" fx="35%" fy="30%">
            <Stop offset="0%" stopColor={THEME.ember.bright} stopOpacity="1" />
            <Stop offset="45%" stopColor={THEME.ember.deep} stopOpacity="1" />
            <Stop offset="100%" stopColor="#0a0402" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="newSeshShimmer" cx="32%" cy="26%" r="36%" fx="32%" fy="26%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill="url(#newSeshMain)" />
        <Circle cx={r} cy={r} r={r} fill="url(#newSeshShimmer)" />
        <Circle
          cx={r}
          cy={r}
          r={r - 0.5}
          fill="none"
          stroke={THEME.ember.bright}
          strokeOpacity={0.55}
          strokeWidth={0.5}
        />
        <Path
          d="M22 15v14M15 22h14"
          stroke="#fff5e8"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
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
        strokeWidth={1.25}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── NewSeshCard ──────────────────────────────────────────────────────────────

function NewSeshCard({ onPress }: { onPress: () => void }) {
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
    onPress();
  }

  return (
    <Animated.View style={[cardSt.wrapper, animStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={cardSt.pressable}
        accessibilityRole="button"
        accessibilityLabel="Build a new sesh"
      >
        <BlurView intensity={22} tint="dark" style={cardSt.blur}>
          {/* Warm amber tint overlay */}
          <View style={cardSt.warmTint} />
          {/* Inner hairline */}
          <View style={cardSt.innerBorder} />
          <View style={cardSt.row}>
            <NewSeshGlyph />
            <View style={cardSt.middle}>
              <Text style={cardSt.name}>New sesh</Text>
              <Text style={cardSt.sub}>
                Tell us your banger and what you're dabbing.
              </Text>
            </View>
            <Chevron />
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const cardSt = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  blur: {
    padding: 18,
    borderRadius: 999,
  },
  warmTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 174, 90, 0.04)',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 200, 130, 0.14)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: THEME.bone[100],
    letterSpacing: -0.225,
    marginBottom: 3,
    textShadowColor: 'rgba(180,200,230,0.18)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  sub: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11.5,
    color: THEME.bone[50],
    lineHeight: 11.5 * 1.4,
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <View style={divSt.row}>
      <LinearGradient
        colors={['transparent', 'rgba(180,200,230,0.14)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={divSt.hairline}
      />
      <Text style={divSt.label}>SAVED</Text>
      <LinearGradient
        colors={['transparent', 'rgba(180,200,230,0.14)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={divSt.hairline}
      />
    </View>
  );
}

const divSt = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  hairline: {
    flex: 1,
    height: 0.5,
  },
  label: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 9,
    letterSpacing: 0.18 * 9,
    color: THEME.bone[35],
  },
});

// ─── StaggeredPresetRow ───────────────────────────────────────────────────────
// Wraps PresetRow with its own stagger animation to avoid hooks-in-loop.

function StaggeredPresetRow({
  preset,
  idx,
  onApply,
}: {
  preset: (typeof SAVED_PRESETS)[number];
  idx: number;
  onApply: () => void;
}) {
  const anim = useStaggerEntrance(idx);
  return (
    <Animated.View style={anim}>
      <PresetRow preset={preset} onApply={onApply} />
    </Animated.View>
  );
}

// ─── ChooseStage ──────────────────────────────────────────────────────────────

export default function ChooseStage() {
  const startBuilder = useFlow((s) => s.startBuilder);
  const applyPreset = useFlow((s) => s.applyPreset);

  const s0 = useStaggerEntrance(0);
  const s1 = useStaggerEntrance(1);

  return (
    <View style={st.container}>

      {/* Header: eyebrow + headline */}
      <Animated.View style={s0}>
        <View style={st.header}>
          <Text style={st.eyebrow}>READY</Text>
          <Text style={st.headline}>
            {'Start a '}
            <Text style={st.accentAmber}>sesh.</Text>
          </Text>
        </View>
      </Animated.View>

      {/* Scrollable list */}
      <Animated.View style={[st.listWrapper, s1]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.listContent}
        >
          <NewSeshCard onPress={startBuilder} />
          {SAVED_PRESETS.length > 0 && (
            <>
              <Divider />
              {SAVED_PRESETS.map((preset, i) => (
                <StaggeredPresetRow
                  key={preset.id}
                  preset={preset}
                  idx={i + 2}
                  onApply={() => applyPreset(preset.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 4,
    paddingHorizontal: 22,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.88,
    textTransform: 'uppercase',
    color: THEME.bone[50],
    marginBottom: 6,
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 28,
    color: THEME.bone[100],
    letterSpacing: -0.98,
  },
  accentAmber: {
    color: '#ffae5a',
    textShadowColor: 'rgba(255, 174, 90, 0.6)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
});
