import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { layout, palette, fontStack, radii } from '../tokens';
import { PressableButton } from '../primitives/PressableButton';
import { PhaseStrip } from '../primitives/PhaseStrip';
import { PHASE_COPY } from '../flow/copy';
import { useReducedMotion } from '../../design/hooks/useReducedMotion';
import { PeekIn } from '../primitives/PeekIn';
import { SkeuSlider } from '../../design/components/SkeuSlider';

export interface HeatScreenProps {
  secondsLeft: number;
  secondsTotal: number;
  torchOn: boolean;
  onSkip: () => void;
  showFallback: boolean;
  onForceAdvance: () => void;
  sessionElapsedS: number;
  // Adjustable values — sliders write back via the setters
  torchS: number;
  dabF: number;
  dunkF: number;
  onTorchSChange: (s: number) => void;
  onDabFChange: (f: number) => void;
  onDunkFChange: (f: number) => void;
}

const TORCH_MIN_S = 10;
const TORCH_MAX_S = 180;
const TORCH_STEP_S = 5;
const DAB_MIN_F = 200;
const DAB_MAX_F = 750;
const DAB_STEP_F = 5;
const DUNK_MIN_F = 100;
const DUNK_STEP_F = 5;

function fmtSession(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function HeatScreen({
  secondsLeft,
  torchOn,
  showFallback,
  onForceAdvance,
  sessionElapsedS,
  torchS,
  dabF,
  dunkF,
  onTorchSChange,
  onDabFChange,
  onDunkFChange,
}: HeatScreenProps) {
  const reduced = useReducedMotion();
  const copy = PHASE_COPY.heating;
  const eyebrow = `${copy.eyebrow} · ${fmtSession(sessionElapsedS)}`;
  const pillLabel = torchOn ? 'torch on' : 'listening';
  const pillSub = torchOn ? 'low · even · sweep' : "spark the torch — i'll start the timer";
  const pillBorder = torchOn ? `${palette.accent}55` : `${palette.lilac}66`;

  const gradients = torchOn
    ? { base: ['#FCF7F1', '#FFFCF7'] as [string, string], bl: ['#F4B98F33', 'transparent'] as [string, string], tr: ['#F8C99A2E', 'transparent'] as [string, string] }
    : { base: ['#F8F8FB', '#FBFBFD'] as [string, string], bl: ['#C5C8E12E', 'transparent'] as [string, string], tr: ['#CCD2E229', 'transparent'] as [string, string] };

  const dotScale = useSharedValue(reduced ? 1 : 1);
  const dotOpacity = useSharedValue(reduced ? 1 : 1);

  useEffect(() => {
    cancelAnimation(dotScale);
    cancelAnimation(dotOpacity);
    if (reduced) {
      dotScale.value = 1;
      dotOpacity.value = 1;
      return;
    }
    if (torchOn) {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
    return () => {
      cancelAnimation(dotScale);
      cancelAnimation(dotOpacity);
    };
  }, [torchOn, reduced, dotScale, dotOpacity]);

  const dotAnimStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const dotColor = torchOn ? palette.accent : palette.lilac;

  // Cross-field rule: dunk must sit at least 10°F below dab.
  const dunkMaxF = Math.max(DUNK_MIN_F, dabF - 10);

  return (
    <View style={styles.well}>
      <PeekIn delay={0}><PhaseStrip current={0} /></PeekIn>
      <PeekIn delay={80}><Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text></PeekIn>
      <PeekIn delay={140}><Text style={styles.headline}>{copy.headline}</Text></PeekIn>
      <PeekIn delay={200}><Text style={styles.sub}>{copy.sub}</Text></PeekIn>

      <PeekIn delay={260}>
        <View style={[styles.pill, { borderColor: pillBorder, overflow: 'hidden' }]}>
          <LinearGradient
            colors={gradients.base}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
          />
          <LinearGradient
            colors={gradients.bl}
            start={{ x: 0, y: 1 }}
            end={{ x: 0.6, y: 0.4 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
          />
          <LinearGradient
            colors={gradients.tr}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.4, y: 0.6 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.pillLeft}>
              <View style={styles.pillLabelRow}>
                <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dotAnimStyle]} />
                <Text style={styles.pillLabel}>{pillLabel}</Text>
              </View>
              <Text style={styles.pillSub}>{pillSub.toUpperCase()}</Text>
            </View>
            <View style={styles.pillRight}>
              <Text style={styles.secondsValue}>{secondsLeft}</Text>
              <Text style={styles.secondsUnit}>SEC</Text>
            </View>
          </View>
        </View>
      </PeekIn>

      <PeekIn delay={320}>
        <View style={styles.sliders}>
          <SkeuSlider
            value={torchS}
            min={TORCH_MIN_S}
            max={TORCH_MAX_S}
            step={TORCH_STEP_S}
            onValueChange={onTorchSChange}
            label="TORCH"
            unit="s"
            accessibilityLabel="torch duration seconds"
            variant="secondary"
          />
          <SkeuSlider
            value={dabF}
            min={DAB_MIN_F}
            max={DAB_MAX_F}
            step={DAB_STEP_F}
            onValueChange={onDabFChange}
            label="DAB"
            unit="°F"
            accessibilityLabel="dab alarm temperature"
          />
          <SkeuSlider
            value={Math.min(dunkF, dunkMaxF)}
            min={DUNK_MIN_F}
            max={dunkMaxF}
            step={DUNK_STEP_F}
            onValueChange={onDunkFChange}
            label="DUNK"
            unit="°F"
            accessibilityLabel="dunk alarm temperature"
            variant="secondary"
          />
        </View>
      </PeekIn>

      {showFallback && (
        <PeekIn delay={380}>
          <View style={styles.fallback}>
            <PressableButton
              label="tap if it's hot enough"
              variant="ghost"
              fullWidth={false}
              onPress={onForceAdvance}
            />
          </View>
        </PeekIn>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingX,
    gap: 6,
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
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.035 * 26,
    color: palette.fg,
  },
  sub: {
    fontFamily: fontStack.body,
    fontSize: 14,
    lineHeight: 19,
    color: palette.muted,
    letterSpacing: -0.01 * 14,
    marginTop: 2,
  },
  fallback: {
    alignItems: 'center',
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginTop: 8,
  },
  pillLeft: {
    flex: 1,
    gap: 4,
  },
  pillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillLabel: {
    fontFamily: fontStack.bodyMedium,
    fontSize: 15,
    color: palette.fg,
    letterSpacing: -0.01 * 15,
    fontWeight: '700',
  },
  pillSub: {
    fontFamily: fontStack.mono,
    fontSize: 9.5,
    color: palette.muted,
    letterSpacing: 0.18 * 9.5,
  },
  pillRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  secondsValue: {
    fontFamily: fontStack.displayHeavy,
    fontSize: 26,
    color: palette.fg,
    letterSpacing: -0.04 * 26,
    lineHeight: 28,
  },
  secondsUnit: {
    fontFamily: fontStack.mono,
    fontSize: 10,
    color: palette.muted,
    letterSpacing: 0.18 * 10,
  },
  sliders: {
    gap: 14,
    marginTop: 12,
  },
});
