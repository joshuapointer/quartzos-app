import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useDerivedValue,
  useAnimatedProps,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { animation, colors, reanimatedEasing } from '../../../tokens';
import { MOLTEN_STATES, MoltenPhase } from './STATES';
import Sparks from './Sparks';
import MoltenOrb3D from './MoltenOrb3D';
import { MoltenOrb3DBoundary } from './MoltenOrb3DBoundary';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

// Animated SVG primitives
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface MoltenOrbProps {
  phase: MoltenPhase;
  size?: number;
  x?: number;
  y?: number;
  tempF?: number;
  torchProgress?: number;
}

export default function MoltenOrb({
  phase,
  size = 200,
  x = 0,
  y = 0,
  torchProgress = 0,
}: MoltenOrbProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const target = MOLTEN_STATES[phase];
  const cx = size / 2 + x;
  const cy = size / 2 + y;

  // ── Animated values ──────────────────────────────────────────────────────────
  const orbR   = useSharedValue(target.r);
  const haloRv = useSharedValue(target.haloR);
  const haloAv = useSharedValue(target.haloA);

  const roilV = useSharedValue(target.roil || 0);
  const complexityV = useSharedValue(target.complexity || 0);
  const tempKV = useSharedValue(target.tempK || 0);

  // Breathing oscillator: 0→1 loop over 3 s
  const breath = useSharedValue(0);

  const haloPrismR = useSharedValue(0);

  // Chromatic dispersion (chrom) — drives fringes, caustic, and halo-prism opacity.
  const chromV = useSharedValue(target.chrom);

  const pulse1R = useSharedValue(0);
  const pulse1A = useSharedValue(0);
  const pulse2R = useSharedValue(0);
  const pulse2A = useSharedValue(0);
  const pulse3R = useSharedValue(0);
  const pulse3A = useSharedValue(0);

  // ── Phase transitions ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = MOLTEN_STATES[phase];

    if (reducedMotion) {
      orbR.value = s.r;
      haloRv.value = s.haloR;
      haloAv.value = s.haloA;
      chromV.value = s.chrom;
      roilV.value = s.roil ?? 0;
      complexityV.value = s.complexity ?? 0;
      tempKV.value = s.tempK ?? 0;
      const prismActivePhases: MoltenPhase[] = ['ready', 'heating', 'window', 'swab', 'dunk'];
      haloPrismR.value = prismActivePhases.includes(phase) ? s.r * (1.4 + 0.6 * s.chrom) : 0;
      pulse1R.value = 0; pulse1A.value = 0;
      pulse2R.value = 0; pulse2A.value = 0;
      pulse3R.value = 0; pulse3A.value = 0;
      return;
    }

    orbR.value   = withSpring(s.r,     animation.orbSpring);
    haloRv.value = withSpring(s.haloR, animation.orbSpring);
    haloAv.value = withSpring(s.haloA, animation.orbSpring);
    chromV.value = withTiming(s.chrom, { duration: 500 });

    roilV.value = withTiming(s.roil || 0, { duration: 500 });
    complexityV.value = withTiming(s.complexity || 0, { duration: 500 });
    tempKV.value = withTiming(s.tempK || 0, { duration: 500 });

    // Halo prism radius: active only in ready/heating/window/swab/dunk
    const prismActivePhases: MoltenPhase[] = ['ready', 'heating', 'window', 'swab', 'dunk'];
    if (prismActivePhases.includes(phase)) {
      const prismTarget = s.r * (1.4 + 0.6 * s.chrom);
      haloPrismR.value = withTiming(prismTarget, {
        duration: 700,
        easing: reanimatedEasing.quartz,
      });
    } else {
      haloPrismR.value = withTiming(0, { duration: 400 });
    }

    // Pulse rings
    if (phase === 'connecting') {
      pulse1R.value = withRepeat(withTiming(size * 0.45, { duration: 1500 }), -1, false);
      pulse1A.value = withRepeat(withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 1500 })), -1, false);
      pulse2R.value = withTiming(0, { duration: 300 });
      pulse2A.value = withTiming(0, { duration: 300 });
      pulse3R.value = withTiming(0, { duration: 300 });
      pulse3A.value = withTiming(0, { duration: 300 });
    } else if (phase === 'window') {
      const burstR = size * 0.55;
      pulse1R.value = withTiming(burstR, { duration: 900 });
      pulse1A.value = withSequence(withTiming(0.5, { duration: 0 }), withTiming(0, { duration: 900 }));
      pulse2R.value = withDelay(120, withTiming(burstR, { duration: 900 }));
      pulse2A.value = withDelay(120, withSequence(withTiming(0.5, { duration: 0 }), withTiming(0, { duration: 900 })));
      pulse3R.value = withDelay(240, withTiming(burstR, { duration: 900 }));
      pulse3A.value = withDelay(240, withSequence(withTiming(0.5, { duration: 0 }), withTiming(0, { duration: 900 })));
    } else {
      pulse1R.value = withTiming(0, { duration: 300 });
      pulse1A.value = withTiming(0, { duration: 300 });
      pulse2R.value = withTiming(0, { duration: 300 });
      pulse2A.value = withTiming(0, { duration: 300 });
      pulse3R.value = withTiming(0, { duration: 300 });
      pulse3A.value = withTiming(0, { duration: 300 });
    }
  }, [phase, size, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Breathing ────────────────────────────────────────────────────────────────
  useEffect(() => {
    cancelAnimation(breath);
    if (reducedMotion) {
      breath.value = 0;
      return;
    }
    const period = 1000 / MOLTEN_STATES[phase].breathHz;
    breath.value = withRepeat(withTiming(1, { duration: period }), -1, false);
  }, [phase, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const breathR = useDerivedValue(() => {
    'worklet';
    return Math.sin(breath.value * Math.PI * 2) * orbR.value * 0.04;
  });

  // ── Animated props ───────────────────────────────────────────────────────────
  const haloProps = useAnimatedProps(() => ({
    r: haloRv.value,
    opacity: haloAv.value,
  }));

  const haloPrismProps = useAnimatedProps(() => {
    'worklet';
    return {
      r: haloPrismR.value,
      opacity: chromV.value,
    };
  });

  const pulse1Props = useAnimatedProps(() => ({
    r: pulse1R.value,
    opacity: pulse1A.value,
  }));
  const pulse2Props = useAnimatedProps(() => ({
    r: pulse2R.value,
    opacity: pulse2A.value,
  }));
  const pulse3Props = useAnimatedProps(() => ({
    r: pulse3R.value,
    opacity: pulse3A.value,
  }));

  const torchCircumference = 2 * Math.PI * target.r;
  const torchDashOffset = torchCircumference * (1 - torchProgress);

  const haloGId         = `halo-grad-${size}`;
  const prismGId        = `prism-grad-${size}`;
  const prismSoftGId    = `prism-soft-grad-${size}`;

  const ORB_ACCESSIBILITY_LABEL: Record<MoltenPhase, string> = {
    cold: 'Quartzie idle',
    connecting: 'Searching for Dabrite',
    connected: 'Dabrite connected',
    presets: 'Choosing your loadout',
    banger: 'Choosing your loadout',
    concentrate: 'Choosing your loadout',
    ready: 'Ready, waiting for torch',
    heating: 'Heating',
    window: 'Dab window open',
    dabbing: 'Dabbing',
    swab: 'Swab now',
    dunk: 'Dunk safe',
    complete: 'Session complete',
  };

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={ORB_ACCESSIBILITY_LABEL[phase]}
      accessibilityLiveRegion="polite"
      style={{ width: size, height: size }}
    >
      
      {/* Background SVG: Halo and Pulses */}
      <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={haloGId} cx="50%" cy="50%" r="60%">
              <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.55} />
              <Stop offset="60%"  stopColor={colors.prismMagenta} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={colors.prismMagenta} stopOpacity={0}    />
            </RadialGradient>
            <RadialGradient id={prismSoftGId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.55} />
              <Stop offset="50%"  stopColor={colors.prismMagenta} stopOpacity={0.30} />
              <Stop offset="80%"  stopColor={colors.prismGold}    stopOpacity={0.12} />
              <Stop offset="100%" stopColor={colors.prismGold}    stopOpacity={0}    />
            </RadialGradient>
          </Defs>

          <AnimatedCircle animatedProps={haloProps} cx={cx} cy={cy} fill={`url(#${haloGId})`} />
          <AnimatedCircle animatedProps={haloPrismProps} cx={cx} cy={cy} fill={`url(#${prismSoftGId})`} />
          <AnimatedCircle animatedProps={pulse1Props} cx={cx} cy={cy} fill="none" stroke={colors.prismCyan} strokeWidth={0.5} />
          <AnimatedCircle animatedProps={pulse2Props} cx={cx} cy={cy} fill="none" stroke={colors.prismMagenta} strokeWidth={0.5} />
          <AnimatedCircle animatedProps={pulse3Props} cx={cx} cy={cy} fill="none" stroke={colors.prismGold} strokeWidth={0.5} />
        </Svg>
      </View>

      {/* Middle R3F Layer: 3D Molten Orb — wrapped in error boundary so GL
          init failures on lower-end devices fall back to SVG-only gracefully */}
      <View style={{ position: 'absolute', top: y, left: x, width: size, height: size, backgroundColor: 'transparent' }} pointerEvents="none">
        <MoltenOrb3DBoundary>
          <MoltenOrb3D
            orbR={orbR}
            breathR={breathR}
            roil={roilV}
            complexity={complexityV}
            chrom={chromV}
            tempK={tempKV}
            size={size}
          />
        </MoltenOrb3DBoundary>
      </View>

      {/* Foreground SVG: Torch ring and Sparks */}
      <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={prismGId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.85} />
              <Stop offset="50%"  stopColor={colors.prismMagenta} stopOpacity={0.85} />
              <Stop offset="100%" stopColor={colors.prismGold}    stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          
          {target.hasTorchRing && (
            <Circle
              cx={cx}
              cy={cy}
              r={target.r + 6}
              fill="none"
              stroke={`url(#${prismGId})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={torchCircumference}
              strokeDashoffset={torchDashOffset}
              rotation={-90}
              originX={cx}
              originY={cy}
            />
          )}

          <Sparks cx={cx} cy={cy} orbR={orbR} phase={phase} />
        </Svg>
      </View>

    </View>
  );
}
