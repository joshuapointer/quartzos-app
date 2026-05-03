import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedProps,
  withSpring,
  withRepeat,
  withTiming,
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
import { animation, colors, prism } from '../../../tokens';
import { MOLTEN_STATES, MoltenPhase } from './STATES';
import { getOrbStops } from './palette';

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

  // ── Phase transitions ────────────────────────────────────────────────────────
  useEffect(() => {
    const s = MOLTEN_STATES[phase];
    orbR.value   = withSpring(s.r,     animation.orbSpring);
    haloRv.value = withSpring(s.haloR, animation.orbSpring);
    haloAv.value = withSpring(s.haloA, animation.orbSpring);
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

  // Iridescence overlay G rotation
  const irisGProps = useAnimatedProps(() => ({
    rotation: irisRot.value,
    originX: cx,
    originY: cy,
  }));

  // Torch ring: stroke-dasharray = circumference; dashoffset drains ring as torchProgress → 1
  const torchCircumference = 2 * Math.PI * target.r;
  const torchDashOffset = torchCircumference * (1 - torchProgress);

  // ── Stop colors (static per render; phase change re-renders component) ───────
  const stops = getOrbStops(target.tempK);

  const gradId    = `orb-grad-${size}`;
  const haloGId   = `halo-grad-${size}`;
  const hiGId     = `hi-grad-${size}`;
  const irisGId   = `iris-grad-${size}`;
  const prismGId  = `prism-grad-${size}`;

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
            <Stop offset="0%"   stopColor={prism.cyan}    stopOpacity={0.85} />
            <Stop offset="50%"  stopColor={prism.magenta} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={prism.gold}    stopOpacity={0.85} />
          </LinearGradient>
        </Defs>

        {/* Layer 1: Halo */}
        <AnimatedCircle
          animatedProps={haloProps}
          cx={cx}
          cy={cy}
          fill={`url(#${haloGId})`}
        />

        {/* Layer 2: Orb body */}
        <AnimatedCircle
          animatedProps={orbBodyProps}
          cx={cx}
          cy={cy}
          fill={`url(#${gradId})`}
        />

        {/* Layer 3: Iridescence overlay — rotating gradient ellipse */}
        <AnimatedG animatedProps={irisGProps}>
          <AnimatedCircle
            animatedProps={orbBodyProps}
            cx={cx}
            cy={cy}
            fill={`url(#${irisGId})`}
            opacity={0.55}
          />
        </AnimatedG>

        {/* Layer 4: Specular highlight */}
        <AnimatedEllipse
          animatedProps={hiProps}
          fill={`url(#${hiGId})`}
          opacity={0.85}
        />

        {/* Layer 5: Torch ring (heating phase only) */}
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
      </Svg>
    </View>
  );
}
