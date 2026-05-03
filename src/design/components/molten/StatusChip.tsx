import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts, reanimatedEasing } from '../../tokens';
import type { MoltenPhase } from './MoltenOrb/STATES';
export type { MoltenPhase };

interface StatusChipProps {
  phase: MoltenPhase;
  banger?: { name: string };
  concentrate?: { name: string; surface_temp_optimal_f?: number | null };
  batteryPct?: number;
}

const HIDE_PHASES: MoltenPhase[] = [
  'cold', 'connecting', 'presets', 'banger', 'concentrate', 'dabbing',
];

type TextSegment = { text: string; em: boolean; sep: boolean };

function buildSegments(
  phase: MoltenPhase,
  banger: StatusChipProps['banger'],
  concentrate: StatusChipProps['concentrate'],
  batteryPct: number | undefined,
): TextSegment[] {
  const c = concentrate?.name?.toUpperCase();
  const b = banger?.name?.toUpperCase();
  const sep = (text: string): TextSegment => ({ text, em: false, sep: true });
  const em = (text: string): TextSegment => ({ text, em: true, sep: false });
  const plain = (text: string): TextSegment => ({ text, em: false, sep: false });

  switch (phase) {
    case 'connected':
      return batteryPct !== undefined
        ? [em('DABRITE PRO'), sep('·'), plain(`${batteryPct}%`)]
        : [em('DABRITE PRO')];

    case 'ready':
      return c && b
        ? [plain('READY'), sep('·'), em(c), sep('·'), plain(b)]
        : [plain('READY'), sep('·'), plain('MIC ON')];

    case 'heating':
      return c && b
        ? [plain('HEATING'), sep('·'), em(c), sep('·'), plain(b)]
        : [plain('HEATING')];

    case 'window': {
      const optF = concentrate?.surface_temp_optimal_f;
      return c
        ? [plain('SESSION'), sep('·'), em(c), sep('·'), plain(`${optF ?? 480}°F OPTIMAL`)]
        : [plain('SESSION'), sep('·'), plain('WINDOW OPEN')];
    }

    case 'swab':
      return c
        ? [plain('POST-DAB'), sep('·'), em(c), sep('·'), plain('SWAB SAFE')]
        : [plain('POST-DAB'), sep('·'), plain('SWAB SAFE')];

    case 'dunk':
      return [plain('POST-DAB'), sep('·'), em('DUNK SAFE'), sep('·'), plain('BELOW 250°F')];

    case 'complete':
      return c && b
        ? [plain('SAVED'), sep('·'), em(c), sep('·'), plain(b)]
        : [plain('SESSION COMPLETE')];

    default:
      return [];
  }
}

export function StatusChip({
  phase,
  banger,
  concentrate,
  batteryPct,
}: StatusChipProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);
  const gemOpacity = useSharedValue(0.85);

  const prevVisibleRef = useRef(false);
  const isVisible = !HIDE_PHASES.includes(phase);

  // Entrance animation when transitioning from hidden to visible
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = isVisible;

    if (isVisible && !wasVisible) {
      opacity.value = 0;
      translateY.value = 6;
      opacity.value = withTiming(1, { duration: 380, easing: reanimatedEasing.quartz });
      translateY.value = withTiming(0, { duration: 380, easing: reanimatedEasing.quartz });
    } else if (!isVisible && wasVisible) {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(6, { duration: 200, easing: Easing.out(Easing.ease) });
    }
  }, [isVisible, opacity, translateY]);

  // Gem pulse animation
  useEffect(() => {
    gemOpacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [gemOpacity]);

  const chipStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const gemStyle = useAnimatedStyle(() => ({
    opacity: gemOpacity.value,
  }));

  if (!isVisible) {
    return null;
  }

  const segments = buildSegments(phase, banger, concentrate, batteryPct);

  return (
    <Animated.View
      style={[styles.container, chipStyle]}
      pointerEvents="none"
      accessible={true}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={segments.map((s) => s.text).join(' ')}
    >
      <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[StyleSheet.absoluteFill, styles.glassOverlay]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.gem, gemStyle]} />
      <View style={styles.textRow}>
        {segments.map((seg, i) => (
          <Text
            key={i}
            style={[
              styles.chipText,
              seg.sep && styles.sepText,
              seg.em && styles.emText,
            ]}
          >
            {seg.text}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.glassEdge,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: colors.glassPane,
    borderRadius: 16,
  },
  gem: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bone100,
    flexShrink: 0,
    shadowColor: colors.prismCyan,
    shadowOffset: { width: -1.5, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 0,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  chipText: {
    ...fonts.monoChip,
    color: colors.bone60,
  },
  sepText: {
    color: colors.bone25,
    marginHorizontal: 1,
  },
  emText: {
    color: colors.bone100,
    letterSpacing: 1.8,
  },
});
