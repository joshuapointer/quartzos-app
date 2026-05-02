import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import PresetRow from '../components/PresetRow';
import { SAVED_PRESETS } from '../data';
import { useFlow } from '../store';
import { SCREEN, THEME } from '../theme';
import { useStaggerEntrance } from '../components/useStaggerEntrance';

function NewSeshCircle() {
  const size = 80;
  const r = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        shadowColor: THEME.ember.base,
        shadowRadius: 20,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="newSeshCircle" cx="38%" cy="32%" r="68%" fx="38%" fy="32%">
            <Stop offset="0%" stopColor="#ff9a30" stopOpacity="1" />
            <Stop offset="55%" stopColor={THEME.ember.base} stopOpacity="1" />
            <Stop offset="100%" stopColor="#b85800" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="newSeshShimmer" cx="34%" cy="26%" r="38%" fx="34%" fy="26%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill="url(#newSeshCircle)" />
        <Circle cx={r} cy={r} r={r} fill="url(#newSeshShimmer)" />
        <Path
          d="M40 29v22M29 40h22"
          stroke={THEME.navy[3]}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function NewSeshCard({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const locked = useRef(false);

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
    if (locked.current) return;
    locked.current = true;
    setTimeout(() => { locked.current = false; }, 250);
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
        accessibilityLabel="Build a new session"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <BlurView intensity={22} tint="dark" style={cardSt.blur}>
          <View style={cardSt.warmTint} />
          <View style={cardSt.innerBorder} />
          <View style={cardSt.content}>
            <NewSeshCircle />
            <Text style={cardSt.name}>New session</Text>
            <Text style={cardSt.sub}>Configure your setup.</Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const cardSt = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: SCREEN.CARD_MAX,
    shadowColor: THEME.navy[0],
    shadowRadius: 24,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pressable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  warmTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: 'Geist_400Regular',
    fontSize: 22,
    color: THEME.bone[100],
    letterSpacing: -0.44,
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10,
    color: THEME.bone[50],
    letterSpacing: 0.1 * 10,
    textAlign: 'center',
    marginTop: -6,
  },
});

function SavedPill() {
  return (
    <View style={pillSt.pill}>
      <Text style={pillSt.label}>PRESETS</Text>
    </View>
  );
}

const pillSt = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SCREEN.PILL_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    marginTop: 6,
    marginBottom: 2,
  },
  label: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 1.6,
    color: THEME.bone[50],
  },
});

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

function EmptyPresetsHint() {
  return (
    <View style={emptySt.wrapper}>
      <Text style={emptySt.text}>
        Saved presets appear here after your first session.
      </Text>
    </View>
  );
}

const emptySt = StyleSheet.create({
  wrapper: {
    paddingTop: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  text: {
    fontFamily: 'GeistMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.16 * 10,
    color: THEME.bone[35],
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 10 * 1.6,
  },
});

export default function ChooseStage() {
  const startBuilder = useFlow((s) => s.startBuilder);
  const applyPreset = useFlow((s) => s.applyPreset);

  const s0 = useStaggerEntrance(0);
  const s1 = useStaggerEntrance(1);

  return (
    <View style={st.container}>

      <Animated.View style={s0}>
        <View style={st.header}>
          <Text style={st.headline}>Start a session.</Text>
        </View>
      </Animated.View>

      <Animated.View style={[st.listWrapper, s1]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.listContent}
        >
          <NewSeshCard onPress={startBuilder} />
          {SAVED_PRESETS.length > 0 ? (
            <>
              <SavedPill />
              {SAVED_PRESETS.map((preset, i) => (
                <StaggeredPresetRow
                  key={preset.id}
                  preset={preset}
                  idx={i + 2}
                  onApply={() => applyPreset(preset.id)}
                />
              ))}
            </>
          ) : (
            <EmptyPresetsHint />
          )}
        </ScrollView>
      </Animated.View>

    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 4,
    paddingHorizontal: SCREEN.HPAD,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'Geist_300Light',
    fontSize: 40,
    color: THEME.bone[100],
    letterSpacing: -1.52,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.18)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: SCREEN.BOTTOM,
  },
});
