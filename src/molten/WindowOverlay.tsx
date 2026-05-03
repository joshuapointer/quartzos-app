import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients } from '../design/tokens';
import { useBleStore } from '../state/bleStore';

// ─────────────────────────────────────────────────────────────────────────────

export type WindowOverlayProps = {
  optimalF: number;
  windowLowF?: number;
  windowHighF?: number;
  coachingText?: string;
  /** H3: show manual-advance chip after 30s in window with no dab detected */
  showStuckFallback?: boolean;
  /** H3: called when user taps the stuck-fallback chip */
  onForceAdvance?: () => void;
};

type WindowState = 'Window open' | 'In window' | 'Past optimal';

function deriveWindowState(tempF: number, low: number, high: number): WindowState {
  if (tempF >= low && tempF <= high) return 'In window';
  if (tempF > high) return 'Window open';
  return 'Past optimal';
}

// ─── Spectrum bar ─────────────────────────────────────────────────────────────

const SPECTRUM_W = 220;
const DRIFT_DURATION = 4000;

const SpectrumBar = React.memo(function SpectrumBar() {
  const driftX = useSharedValue(0);

  useEffect(() => {
    driftX.value = withRepeat(
      withTiming(1, { duration: DRIFT_DURATION }),
      -1,
      true,
    );
  }, [driftX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (driftX.value - 0.5) * 40 }],
  }));

  return (
    <View style={styles.spectrumClip}>
      <Animated.View style={[styles.spectrumInner, animatedStyle]}>
        <LinearGradient
          colors={gradients.spectrum}
          locations={[0, 0.18, 0.5, 0.82, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.spectrumGradient}
        />
      </Animated.View>
    </View>
  );
});

// ─── WindowOverlay ────────────────────────────────────────────────────────────

const DEFAULT_COACHING =
  'Lift the rig to your lips when it feels right. Quartzie watches the temperature drop.';

export const WindowOverlay = React.memo(function WindowOverlay({
  optimalF,
  windowLowF,
  windowHighF,
  coachingText,
  showStuckFallback = false,
  onForceAdvance,
}: WindowOverlayProps) {
  const low = windowLowF ?? optimalF - 25;
  const high = windowHighF ?? optimalF + 15;
  const displayTemp = useBleStore((s) => Math.max(0, Math.round(s.liveTempF)));
  const stateLabel = useBleStore((s) => deriveWindowState(s.liveTempF, low, high));

  return (
    <View style={styles.container}>
      {/* Big numbers row */}
      <View style={styles.numbersRow}>
        <Text
          style={styles.tempNumber}
          allowFontScaling={false}
          accessibilityRole="text"
          accessibilityLabel={`${displayTemp} degrees Fahrenheit`}
          accessibilityLiveRegion="polite"
        >
          {displayTemp}
        </Text>
        <Text style={styles.degSuffix} allowFontScaling={false}>
          °F
        </Text>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{stateLabel}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>
          {'Optimal '}
          <Text style={styles.metaOptimalValue}>{optimalF}°F</Text>
        </Text>
      </View>

      {/* Spectrum bar */}
      <SpectrumBar />

      {/* Coaching copy */}
      <Text style={styles.coachingText}>
        {coachingText ?? DEFAULT_COACHING}
      </Text>

      {/* H3: manual-advance chip after 30s if dab-lift velocity detection missed */}
      {showStuckFallback ? (
        <Pressable
          onPress={onForceAdvance}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Tap when you've dabbed"
          style={({ pressed }) => [
            styles.stuckFallbackChip,
            pressed && styles.stuckFallbackChipPressed,
          ]}
        >
          <Text style={styles.stuckFallbackLabel} allowFontScaling={false}>
            Tap when you've dabbed
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempNumber: {
    ...fonts.serifDisplay,
    fontSize: 96,
    color: colors.bone100,
    fontVariant: ['tabular-nums'],
  },
  degSuffix: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 36,
    color: colors.bone60,
    lineHeight: 36,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  metaText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9.5,
    letterSpacing: 1.9,
    lineHeight: 12,
    textTransform: 'uppercase',
    color: colors.bone40,
  },
  metaDot: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9.5,
    color: colors.bone25,
  },
  metaOptimalValue: {
    color: colors.prismCyan,
  },
  spectrumClip: {
    width: SPECTRUM_W,
    height: 2,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 14,
    alignSelf: 'center',
  },
  spectrumInner: {
    width: SPECTRUM_W + 40,
    height: 2,
    marginLeft: -20,
  },
  spectrumGradient: {
    flex: 1,
  },
  coachingText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.bone60,
    textAlign: 'center',
    maxWidth: 240,
    alignSelf: 'center',
    marginTop: 16,
  },
  // H3: stuck-fallback chip — mirrors torchFallbackChip from MoltenSurface
  stuckFallbackChip: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.glassThin,
    alignSelf: 'center',
  },
  stuckFallbackChipPressed: {
    opacity: 0.7,
  },
  stuckFallbackLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.bone60,
  },
});
