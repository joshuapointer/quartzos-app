import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

import { colors } from '../../tokens';

// ─── Flame icon ──────────────────────────────────────────────────────────────

export function FlameIcon({ size = 56, opacity = 1 }: { size?: number; opacity?: number }) {
  const flicker = useSharedValue(1);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 180, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(flicker); };
  }, []);

  const flickerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flicker.value }, { scaleX: 0.9 + flicker.value * 0.1 }],
    opacity,
  }));

  const s = size;
  return (
    <Animated.View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, flickerStyle]}>
      <Svg width={s} height={s} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="flamGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#f6ded2" stopOpacity={0.9} />
            <Stop offset="35%" stopColor={colors.emberBright} stopOpacity={1} />
            <Stop offset="75%" stopColor={colors.ember} stopOpacity={1} />
            <Stop offset="100%" stopColor={colors.emberDeep} stopOpacity={1} />
          </SvgGradient>
          <SvgGradient id="innerFlam" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#f6ded2" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="#ffb68b" stopOpacity={0.8} />
            <Stop offset="100%" stopColor={colors.emberBright} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        {/* outer flame */}
        <Path
          d="M28 4 C28 4 38 14 38 24 C38 32 34 36 34 36 C36 28 30 26 30 26 C32 34 26 40 26 46 C22 42 16 36 16 28 C16 20 22 12 22 12 C20 20 26 22 26 22 C22 16 28 4 28 4 Z"
          fill="url(#flamGrad)"
        />
        {/* inner core */}
        <Path
          d="M28 20 C28 20 33 26 33 31 C33 35 30.5 37.5 30.5 37.5 C31.5 33 28.5 31 28.5 31 C29.5 35 26 38 26 42 C23.5 39 21 35 21 30 C21 25 25 21 25 21 C24 26 27 27 27 27 C25.5 23 28 20 28 20 Z"
          fill="url(#innerFlam)"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Cool icon ───────────────────────────────────────────────────────────────

export function CoolIcon({ size = 56 }: { size?: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(pulse); };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="coolGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.quartzBright} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={colors.quartzDeep} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        <SvgCircle cx={28} cy={28} r={20} fill="none" stroke="url(#coolGrad)" strokeWidth={2} />
        <SvgCircle cx={28} cy={28} r={12} fill="none" stroke={colors.quartz} strokeWidth={1.5} strokeDasharray="3 3" />
        <Path d="M28 14 L28 18 M28 38 L28 42 M14 28 L18 28 M38 28 L42 28" stroke={colors.quartzBright} strokeWidth={2} strokeLinecap="round" />
        <SvgCircle cx={28} cy={28} r={4} fill={colors.quartzBright} opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

// ─── Dab icon ────────────────────────────────────────────────────────────────

export function DabIcon({ size = 56 }: { size?: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(glow); };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.5,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }, glowStyle]}>
        <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, backgroundColor: colors.emberBright, opacity: 0.12 }} />
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="dabGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.emberBright} />
            <Stop offset="100%" stopColor={colors.ember} />
          </SvgGradient>
        </Defs>
        <Path d="M28 10 C20 10 14 16 14 24 C14 32 20 40 28 46 C36 40 42 32 42 24 C42 16 36 10 28 10 Z" fill="none" stroke="url(#dabGrad)" strokeWidth={2} />
        <SvgCircle cx={28} cy={28} r={6} fill={colors.emberBright} opacity={0.85} />
        <Path d="M28 22 L28 26 M22 28 L26 28 M28 30 L28 34 M30 28 L34 28" stroke={colors.bone100 + '99'} strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ─── Dunk icon ───────────────────────────────────────────────────────────────

export function DunkIcon({ size = 56 }: { size?: number }) {
  const drop = useSharedValue(0);
  useEffect(() => {
    drop.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(drop); };
  }, []);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value * 8 }],
    opacity: 1 - drop.value * 0.5,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={dropStyle}>
        <Svg width={size} height={size} viewBox="0 0 56 56">
          <Defs>
            <SvgGradient id="dunkGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor={colors.quartzBright} />
              <Stop offset="100%" stopColor={colors.quartzDeep} />
            </SvgGradient>
          </Defs>
          <Path d="M28 8 C28 8 18 22 18 32 C18 38.6 22.7 44 28 44 C33.3 44 38 38.6 38 32 C38 22 28 8 28 8 Z" fill="none" stroke="url(#dunkGrad)" strokeWidth={2} />
          <Path d="M22 34 C22 34 24 38 28 38" stroke={colors.quartzBright} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── Complete icon ────────────────────────────────────────────────────────────

export function CompleteIcon({ size = 56 }: { size?: number }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, []);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Defs>
          <SvgGradient id="complGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor={colors.success} />
            <Stop offset="100%" stopColor="#5aaa7a" />
          </SvgGradient>
        </Defs>
        <SvgCircle cx={28} cy={28} r={22} fill="none" stroke="url(#complGrad)" strokeWidth={2} />
        <Path d="M18 28 L24 34 L38 20" stroke={colors.success} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}
