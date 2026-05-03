import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../tokens';

export type DialSilhouetteState = 'idle' | 'connecting' | 'connected';

interface Props {
  state?: DialSilhouetteState;
  size?: number;
}

const GLOW_CONFIG: Record<
  DialSilhouetteState,
  { color: string; minOpacity: number; maxOpacity: number; duration: number }
> = {
  idle:       { color: colors.quartzDim,   minOpacity: 0.55, maxOpacity: 0.70, duration: 3800 },
  connecting: { color: colors.quartzMid,   minOpacity: 0.70, maxOpacity: 0.85, duration: 1800 },
  connected:  { color: colors.firedAmber,  minOpacity: 0.90, maxOpacity: 0.98, duration: 300  },
};

export function StaticDialSilhouette({ state = 'idle', size = 280 }: Props) {
  const cfg = GLOW_CONFIG[state];
  const opacity = useSharedValue(cfg.minOpacity);

  useEffect(() => {
    opacity.value = cfg.minOpacity;
    opacity.value = withRepeat(
      withTiming(cfg.maxOpacity, {
        duration: cfg.duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const r = size * 0.44;
  const cx = size / 2;
  const cy = size / 2;
  const lensSize = size * 0.78;

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      {/* Outer ring background disc */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: colors.surface1,
            shadowColor: colors.voidObsidian,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.45,
            shadowRadius: 24,
            elevation: 10,
          },
        ]}
      />

      {/* SVG: static track ring + colored ring stroke */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={cfg.color} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* Glow fill behind ring */}
        <Circle cx={cx} cy={cy} r={r + 12} fill="url(#glowGrad)" />
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.bone100 + '0F'}
          strokeWidth={1}
          fill="none"
        />
        {/* Colored ring arc (full circle, dim) */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={cfg.color}
          strokeWidth={2}
          fill="none"
          strokeOpacity={0.55}
        />
      </Svg>

      {/* Inner lens */}
      <View
        style={{
          position: 'absolute',
          top: (size - lensSize) / 2,
          left: (size - lensSize) / 2,
          width: lensSize,
          height: lensSize,
          borderRadius: lensSize / 2,
          backgroundColor: colors.lensIdle,
          borderWidth: 0.5,
          borderColor: colors.bone100 + '0A',
          overflow: 'hidden',
        }}
      />

      {/* Dim "—" readout placeholder */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.Text
          style={{
            fontSize: 11,
            letterSpacing: 2.2,
            fontWeight: '500',
            color: colors.bone100 + '2E',
            textTransform: 'uppercase',
          }}
        >
          {state === 'connecting' ? 'PAIRING' : '— — —'}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
