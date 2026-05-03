import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
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
  Ellipse,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { animation, colors, reanimatedEasing } from '../../../tokens';
import { MOLTEN_STATES, MoltenPhase } from './STATES';
import { getOrbStops } from './palette';
import Sparks from './Sparks';

// Animated SVG primitives
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);

// SVG canvas is size × size; orb center is (cx, cy) = (size/2 + x, size/2 + y).
// haloR can exceed size/2 — that's fine, SVG clips at viewport.

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
  const target = MOLTEN_STATES[phase];
  const cx = size / 2 + x;
  const cy = size / 2 + y;

  // ── Animated values ──────────────────────────────────────────────────────────
  const orbR   = useSharedValue(target.r);
  const haloRv = useSharedValue(target.haloR);
  const haloAv = useSharedValue(target.haloA);

  // Breathing oscillator: 0→1 loop over 3 s
  const breath = useSharedValue(0);

  // Iridescence rotation: 0→360 over 18 s
  const irisRot = useSharedValue(0);

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
    orbR.value   = withSpring(s.r,     animation.orbSpring);
    haloRv.value = withSpring(s.haloR, animation.orbSpring);
    haloAv.value = withSpring(s.haloA, animation.orbSpring);
    chromV.value = withTiming(s.chrom, { duration: 500 });

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
      // Only pulse-1 animates: r 0→size*0.45, opacity 0.6→0, repeat
      pulse1R.value = withRepeat(
        withTiming(size * 0.45, { duration: 1500 }),
        -1,
        false,
      );
      pulse1A.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 1500 }),
        ),
        -1,
        false,
      );
      pulse2R.value = withTiming(0, { duration: 300 });
      pulse2A.value = withTiming(0, { duration: 300 });
      pulse3R.value = withTiming(0, { duration: 300 });
      pulse3A.value = withTiming(0, { duration: 300 });
    } else if (phase === 'window') {
      // All three fire a staggered burst — single 900ms shot, no repeat
      const burstR = size * 0.55;
      pulse1R.value = withTiming(burstR, { duration: 900 });
      pulse1A.value = withSequence(
        withTiming(0.5, { duration: 0 }),
        withTiming(0, { duration: 900 }),
      );
      pulse2R.value = withDelay(120, withTiming(burstR, { duration: 900 }));
      pulse2A.value = withDelay(
        120,
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 900 }),
        ),
      );
      pulse3R.value = withDelay(240, withTiming(burstR, { duration: 900 }));
      pulse3A.value = withDelay(
        240,
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 900 }),
        ),
      );
    } else {
      // All other phases: decay to 0
      pulse1R.value = withTiming(0, { duration: 300 });
      pulse1A.value = withTiming(0, { duration: 300 });
      pulse2R.value = withTiming(0, { duration: 300 });
      pulse2A.value = withTiming(0, { duration: 300 });
      pulse3R.value = withTiming(0, { duration: 300 });
      pulse3A.value = withTiming(0, { duration: 300 });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Breathing ────────────────────────────────────────────────────────────────
  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Iridescence rotation ─────────────────────────────────────────────────────
  useEffect(() => {
    irisRot.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // breathR: +/- 4% of current orb radius, driven by sin of breath progress
  const breathR = useDerivedValue(() => {
    'worklet';
    return Math.sin(breath.value * Math.PI * 2) * orbR.value * 0.04;
  });

  const displayR = useDerivedValue(() => {
    'worklet';
    return orbR.value + breathR.value;
  });

  // ── Animated props ───────────────────────────────────────────────────────────
  const haloProps = useAnimatedProps(() => ({
    r: haloRv.value,
    opacity: haloAv.value,
  }));

  const orbBodyProps = useAnimatedProps(() => ({
    r: displayR.value,
  }));

  // Highlight ellipse: offset ~30% in / 28% up from center
  const hiProps = useAnimatedProps(() => {
    const r = displayR.value;
    return {
      cx: cx - r * 0.30,
      cy: cy - r * 0.28,
      rx: r * 0.36,
      ry: r * 0.22,
    };
  });

  const irisGProps = useAnimatedProps(() => ({
    rotation: irisRot.value,
    originX: cx,
    originY: cy,
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

  // Caustic ellipse: below center, follows displayR via derived value
  const causticProps = useAnimatedProps(() => {
    'worklet';
    const r = displayR.value;
    const rawOpacity = chromV.value * 0.85;
    const opacity = rawOpacity > 0.7 ? 0.7 : rawOpacity;
    return {
      cx,
      cy: cy + r * 0.55,
      rx: r * 0.34,
      ry: r * 0.13,
      opacity,
    };
  });

  const fringeCProps = useAnimatedProps(() => {
    'worklet';
    const rawOpacity = chromV.value * 0.9;
    const opacity = rawOpacity > 0.85 ? 0.85 : rawOpacity;
    return {
      r: displayR.value + 1,
      opacity,
    };
  });
  const fringeMProps = useAnimatedProps(() => {
    'worklet';
    const rawOpacity = chromV.value * 0.9;
    const opacity = rawOpacity > 0.85 ? 0.85 : rawOpacity;
    return {
      r: displayR.value - 1,
      opacity,
    };
  });

  // Torch ring: stroke-dasharray = circumference; dashoffset drains ring as torchProgress → 1
  const torchCircumference = 2 * Math.PI * target.r;
  const torchDashOffset = torchCircumference * (1 - torchProgress);

  // ── Stop colors (static per render; phase change re-renders component) ───────
  const stops = getOrbStops(target.tempK);

  const gradId          = `orb-grad-${size}`;
  const haloGId         = `halo-grad-${size}`;
  const hiGId           = `hi-grad-${size}`;
  const irisGId         = `iris-grad-${size}`;
  const prismGId        = `prism-grad-${size}`;
  const prismSoftGId    = `prism-soft-grad-${size}`;
  const causticGId      = `caustic-grad-${size}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Orb body radial gradient — tempK-interpolated stops */}
          <RadialGradient id={gradId} cx="42%" cy="38%" r="68%">
            <Stop offset="0%"   stopColor={stops[0]} />
            <Stop offset="38%"  stopColor={stops[1]} />
            <Stop offset="80%"  stopColor={stops[2]} />
            <Stop offset="100%" stopColor={stops[3]} />
          </RadialGradient>

          {/* Halo radial gradient */}
          <RadialGradient id={haloGId} cx="50%" cy="50%" r="60%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.55} />
            <Stop offset="60%"  stopColor={colors.prismMagenta} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={colors.prismMagenta} stopOpacity={0}    />
          </RadialGradient>

          {/* Specular highlight */}
          <RadialGradient id={hiGId} cx="38%" cy="30%" r="22%">
            <Stop offset="0%"   stopColor="#f8fcff" stopOpacity={0.95} />
            <Stop offset="55%"  stopColor="#e8d8ff" stopOpacity={0.40} />
            <Stop offset="100%" stopColor="#e8d8ff" stopOpacity={0}    />
          </RadialGradient>

          {/* Iridescence linear gradient: cyan→purple→magenta drift */}
          <LinearGradient id={irisGId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0}    />
            <Stop offset="35%"  stopColor={colors.prismCyan}    stopOpacity={0.32} />
            <Stop offset="55%"  stopColor={colors.prismMagenta} stopOpacity={0.30} />
            <Stop offset="78%"  stopColor={colors.prismMagenta} stopOpacity={0.24} />
            <Stop offset="100%" stopColor={colors.prismMagenta} stopOpacity={0}    />
          </LinearGradient>

          {/* Prism stroke gradient for torch ring */}
          <LinearGradient id={prismGId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.85} />
            <Stop offset="50%"  stopColor={colors.prismMagenta} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={colors.prismGold}    stopOpacity={0.85} />
          </LinearGradient>

          {/* Halo prism soft radial gradient: cyan→magenta→gold soft bloom */}
          <RadialGradient id={prismSoftGId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.55} />
            <Stop offset="50%"  stopColor={colors.prismMagenta} stopOpacity={0.30} />
            <Stop offset="80%"  stopColor={colors.prismGold}    stopOpacity={0.12} />
            <Stop offset="100%" stopColor={colors.prismGold}    stopOpacity={0}    />
          </RadialGradient>

          {/* Caustic radial gradient: cyan→magenta soft */}
          <RadialGradient id={causticGId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0.85} />
            <Stop offset="35%"  stopColor={colors.prismMagenta} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={colors.prismMagenta} stopOpacity={0}    />
          </RadialGradient>
        </Defs>

        {/* Layer 1: Halo */}
        <AnimatedCircle
          animatedProps={haloProps}
          cx={cx}
          cy={cy}
          fill={`url(#${haloGId})`}
        />

        {/* Layer 2: Halo prism — chromatic dispersion bloom (prototype line 1182) */}
        <AnimatedCircle
          animatedProps={haloPrismProps}
          cx={cx}
          cy={cy}
          fill={`url(#${prismSoftGId})`}
        />

        {/* Layer 3: Pulse rings 1/2/3 — chromatic burst rings (prototype lines 1183-1185) */}
        <AnimatedCircle
          animatedProps={pulse1Props}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={colors.prismCyan}
          strokeWidth={0.5}
        />
        <AnimatedCircle
          animatedProps={pulse2Props}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={colors.prismMagenta}
          strokeWidth={0.5}
        />
        <AnimatedCircle
          animatedProps={pulse3Props}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={colors.prismGold}
          strokeWidth={0.5}
        />

        {/* Layer 4: Orb body */}
        <AnimatedCircle
          animatedProps={orbBodyProps}
          cx={cx}
          cy={cy}
          fill={`url(#${gradId})`}
        />

        {/* Layer 5: Iridescence overlay — rotating gradient ellipse (prototype line 1189) */}
        <AnimatedG animatedProps={irisGProps}>
          <AnimatedCircle
            animatedProps={orbBodyProps}
            cx={cx}
            cy={cy}
            fill={`url(#${irisGId})`}
            opacity={0.55}
          />
        </AnimatedG>

        {/* Layer 6: Fringe-c (cyan) + fringe-m (magenta) chromatic edge rings (prototype lines 1190-1191) */}
        <AnimatedCircle
          animatedProps={fringeCProps}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={colors.prismCyan}
          strokeWidth={2}
        />
        <AnimatedCircle
          animatedProps={fringeMProps}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={colors.prismMagenta}
          strokeWidth={2}
        />

        {/* Layer 7: Specular highlight (prototype line 1192) */}
        <AnimatedEllipse
          animatedProps={hiProps}
          fill={`url(#${hiGId})`}
          opacity={0.85}
        />

        {/* Layer 8: Caustic — chromatic refraction ellipse below orb center (prototype line 1193) */}
        <AnimatedEllipse
          animatedProps={causticProps}
          fill={`url(#${causticGId})`}
        />

        {/* Layer 9: Torch ring (heating phase only) */}
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

        {/* Layer 10: Sparks — particle emitter renders last to sit above all chromatic layers (prototype line 1195) */}
        <Sparks cx={cx} cy={cy} orbR={orbR} phase={phase} />
      </Svg>
    </View>
  );
}
