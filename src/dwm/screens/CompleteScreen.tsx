import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, fontStack, layout, radii, springs } from '../tokens';
import { PHASE_COPY } from '../flow/copy';

export interface CompleteScreenProps {
  peakF: number;
  bangerName: string;
  durationLabel: string | null;
  onAgain: () => void;
  onNew: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FinishCard({
  tint,
  icon,
  title,
  sub,
  onPress,
}: {
  tint: 'peach' | 'lilac';
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);
  const onPressIn = useCallback(() => { pressed.value = withSpring(1, springs.squish); }, []);
  const onPressOut = useCallback(() => { pressed.value = withSpring(0, springs.squish); }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 - pressed.value * 0.06 },
      { scaleX: 1 + pressed.value * 0.01 },
    ],
  }));

  const gradient: [string, string] =
    tint === 'peach' ? ['#F5C4AE', '#FAE8DC'] : [palette.lilac, '#EDE0F5'];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.finishCard, animStyle]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.finishIcon}>
        {icon}
      </LinearGradient>
      <Text style={styles.finishTitle}>{title}</Text>
      <Text style={styles.finishSub}>{sub}</Text>
    </AnimatedPressable>
  );
}

export default function CompleteScreen({
  peakF,
  durationLabel,
  onAgain,
  onNew,
}: CompleteScreenProps) {
  const copy = PHASE_COPY.complete;

  return (
    <View style={styles.well}>
      <Text style={styles.eyebrow}>{copy.eyebrow.toUpperCase()}</Text>
      <Text style={styles.headline}>
        {'that was '}<Text style={styles.headlineMark}>nice</Text>{'.'}
      </Text>
      {copy.sub.length > 0 && <Text style={styles.sub}>{copy.sub}</Text>}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{durationLabel ?? '—'}</Text>
          <Text style={styles.statLbl}>TIME ON RIG</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{`${Math.round(peakF)}°`}</Text>
          <Text style={styles.statLbl}>DAB @</Text>
        </View>
      </View>

      <View style={styles.finishRow}>
        <FinishCard
          tint="peach"
          icon={<PlusIcon color={palette.accentDeep} />}
          title="another one"
          sub="same banger, same hash"
          onPress={onAgain}
        />
        <FinishCard
          tint="lilac"
          icon={<HomeIcon color="#5C3F88" />}
          title="back home"
          sub="pick a different sesh"
          onPress={onNew}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 12,
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    letterSpacing: 0.24 * 10,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 28,
    letterSpacing: -0.035 * 28,
    color: palette.fg,
    textAlign: 'center',
  },
  headlineMark: {
    color: palette.accent,
  },
  sub: {
    fontFamily: fontStack.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: palette.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statNum: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    color: palette.fg,
    letterSpacing: -0.03 * 26,
    lineHeight: 28,
  },
  statLbl: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    color: palette.muted,
    marginTop: 4,
    letterSpacing: 0.16 * 9.5,
  },
  finishRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  finishCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  finishIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  finishTitle: {
    fontFamily: fontStack.display,
    fontSize: 14.5,
    color: palette.fg,
    letterSpacing: -0.015 * 14.5,
  },
  finishSub: {
    fontFamily: fontStack.body,
    fontSize: 11.5,
    color: palette.muted,
    lineHeight: 15,
  },
});
