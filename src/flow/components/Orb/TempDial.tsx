import React, { memo, useEffect, useId, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { THEME } from '../../theme';
import { CausticLayer1, CausticLayer2, SessionArc } from './CausticLayers';
import { styles } from './styles';
import type { TempDialProps } from './types';
import { isCool } from './utils';

function TempDialInner({
  size,
  state,
  label,
  temp,
  noReading,
  inWindow,
  fastDrop,
  idleBreathe,
  reduced,
}: TempDialProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Caustic rotations — two layers spinning opposite directions.
  const causticCw = useSharedValue(0);
  const causticCcw = useSharedValue(0);
  const breathe = useSharedValue(0);
  const searchPulse = useSharedValue(0);
  // Session arc — slow quartz hairline that completes one rotation every 90s,
  // rendered only during cool/dab/dunk/clean phases. (Bold #6.)
  const sessionArcRotation = useSharedValue(0);

  // Caustics + breathe only run when the orb is in a live state. Idle, standby,
  // searching, and complete are static moments — leaving worklets repeating
  // forever during build choosers (orb suppressed at scale 0.5) was wasted UI
  // thread work. ConnectStage opts the idle state into the breathe via
  // `idleBreathe` so the lone "AWAITING SIGNAL" orb feels alive.
  const isLive =
    state === 'cool' ||
    state === 'cool-fast-drop' ||
    state === 'cool-in-window' ||
    state === 'dab' ||
    state === 'dunk' ||
    state === 'clean' ||
    (idleBreathe && state === 'idle');

  // Breathe pacing:
  //   - idleBreathe (idle stage): calm 4s half-cycle.
  //   - dab: 2x rate (2s half-cycle) — feels "occupied" without dimming the body.
  //   - default live: 4s half-cycle.
  const breatheHalfMs = state === 'dab' ? 2000 : 4000;

  useEffect(() => {
    if (reduced || !isLive) {
      cancelAnimation(causticCw);
      cancelAnimation(causticCcw);
      cancelAnimation(breathe);
      return;
    }
    causticCw.value = withRepeat(
      withTiming(1, { duration: 30000, easing: Easing.linear }),
      -1,
      false,
    );
    causticCcw.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: breatheHalfMs, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: breatheHalfMs, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(causticCw);
      cancelAnimation(causticCcw);
      cancelAnimation(breathe);
    };
  }, [isLive, breathe, causticCcw, causticCw, reduced, breatheHalfMs]);

  useEffect(() => {
    if (!reduced && state === 'searching') {
      searchPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(searchPulse);
      searchPulse.value = withTiming(0, { duration: 200 });
    }
    return () => {
      cancelAnimation(searchPulse);
    };
  }, [state, searchPulse, reduced]);

  // Session arc — only spins during cool/dab/dunk/clean. One full rotation per
  // 90s, hairline quartz. Skipped when reduced motion is on (still renders
  // statically below for visual continuity).
  const showSessionArc =
    state === 'cool' ||
    state === 'cool-fast-drop' ||
    state === 'cool-in-window' ||
    state === 'dab' ||
    state === 'dunk' ||
    state === 'clean';

  useEffect(() => {
    if (reduced || !showSessionArc) {
      cancelAnimation(sessionArcRotation);
      return;
    }
    sessionArcRotation.value = withRepeat(
      withTiming(1, { duration: 90000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(sessionArcRotation);
    };
  }, [showSessionArc, reduced, sessionArcRotation]);

  const causticCwStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${causticCw.value * 360}deg` }],
  }));
  const causticCcwStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-causticCcw.value * 360}deg` }],
  }));
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1.0, 1.012]) }],
  }));
  const searchPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchPulse.value, [0, 1], [0, 0.6]),
  }));
  const sessionArcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sessionArcRotation.value * 360}deg` }],
  }));

  const showTemp =
    !noReading &&
    typeof temp === 'number' &&
    (state === 'cool' ||
      state === 'cool-fast-drop' ||
      state === 'cool-in-window' ||
      state === 'dunk' ||
      state === 'clean');

  // For cool states, the eyebrow color shifts to quartz-bright when in window.
  const eyebrowColor = inWindow
    ? THEME.quartz.bright
    : state === 'dab'
      ? THEME.ember.bright
      : THEME.bone[50];

  // Body stays at full opacity during the dab — "occupied" is conveyed via the
  // 2x-rate breathe (above) rather than dimming. The dab is the moment of the
  // product; don't fade it.
  const bodyOpacity = 1;

  // Numeric scaling — match prototype rule (3+ digits → 0.42, else 0.50).
  const tempStr = showTemp ? `${Math.round(temp ?? 0)}` : '';
  const numScale = tempStr.length >= 3 ? 0.42 : 0.5;

  const reactUid = useId();
  const uid = useMemo(
    () => `td-${reactUid.replace(/:/g, '-')}`,
    [reactUid],
  );

  return (
    <Animated.View
      style={[
        styles.box,
        { width: size, height: size, opacity: bodyOpacity },
        breatheStyle,
      ]}
    >
      {/* Far halo — softly tinted by state. iOS uses shadow; Android can't
          render shadowColor on a non-elevated View, so we render a tinted
          backing circle scaled 1.4x to simulate the bloom. Cool/standby glows
          quartz; active/heat glows ember. */}
      {Platform.OS === 'android' ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          style={[
            styles.haloAndroid,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isCool(state)
                ? THEME.quartz.glow
                : 'rgba(255, 122, 0, 0.18)',
              transform: [{ scale: 1.4 }],
            },
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.haloAbs,
            {
              shadowColor: isCool(state) ? THEME.quartz.glow : THEME.ember.bright,
            },
          ]}
        />
      )}

      {/* Search pulse ring — only animates while searching. */}
      {state === 'searching' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.searchPulse,
            { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
            searchPulseStyle,
          ]}
        />
      )}

      {/* Glass body — radial gradient core. */}
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          {/* Body gradient: bright bone center → navy edge. */}
          <RadialGradient
            id={`${uid}-body`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.bone[100]} stopOpacity="0.18" />
            <Stop offset="0.45" stopColor={THEME.navy[3]} stopOpacity="0.85" />
            <Stop offset="1" stopColor={THEME.navy[0]} stopOpacity="1" />
          </RadialGradient>

          {/* Top refraction streak (off-center highlight). */}
          <RadialGradient
            id={`${uid}-streak`}
            cx="32%"
            cy="22%"
            rx="38%"
            ry="38%"
          >
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>

          {/* Emissive ember overlay for cool states. */}
          <RadialGradient
            id={`${uid}-ember`}
            cx="50%"
            cy="55%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.ember.bright} stopOpacity="0.55" />
            <Stop offset="0.55" stopColor={THEME.ember.deep} stopOpacity="0.20" />
            <Stop offset="1" stopColor={THEME.ember.deep} stopOpacity="0" />
          </RadialGradient>

          {/* Caustic stroke gradient. */}
          <RadialGradient
            id={`${uid}-caustic`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={THEME.quartz.bright} stopOpacity="0" />
            <Stop offset="0.55" stopColor={THEME.quartz.bright} stopOpacity="0.28" />
            <Stop offset="1" stopColor={THEME.quartz.bright} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glass body */}
        <Circle cx={cx} cy={cy} r={r - 1} fill={`url(#${uid}-body)`} />

        {/* Emissive ember (only for cool/dunk/clean states with a real temp). */}
        {isCool(state) && state !== 'dab' && (
          <Circle
            cx={cx}
            cy={cy}
            r={r - 4}
            fill={`url(#${uid}-ember)`}
            opacity={inWindow ? 0.95 : 0.55}
          />
        )}

        {/* Top refraction streak */}
        <Circle cx={cx} cy={cy} r={r - 1} fill={`url(#${uid}-streak)`} />

        {/* Outer hairline — light-catching edge. */}
        <Circle
          cx={cx}
          cy={cy}
          r={r - 0.5}
          fill="none"
          stroke="rgba(220, 230, 245, 0.18)"
          strokeWidth={0.5}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r - 1.5}
          fill="none"
          stroke="rgba(22, 12, 6, 0.5)"
          strokeWidth={0.5}
        />

        {/* Fast-drop danger ring (inside the orb edge). */}
        {fastDrop && (
          <Circle
            cx={cx}
            cy={cy}
            r={r - 6}
            fill="none"
            stroke={THEME.danger.base}
            strokeWidth={1.25}
            opacity={0.55}
          />
        )}
      </Svg>

      {/* Caustic layer 1 — clockwise. */}
      <CausticLayer1 size={size} animStyle={causticCwStyle} />

      {/* Caustic layer 2 — counter-clockwise, slower. */}
      <CausticLayer2 size={size} animStyle={causticCcwStyle} />

      {/* Session arc — Bold #6. Hairline quartz arc at the orb's outer edge,
          completing one revolution every 90s during cool/dab/dunk/clean. */}
      {showSessionArc && (
        <SessionArc size={size} animStyle={sessionArcStyle} />
      )}

      {/* Centered text stack. */}
      <View pointerEvents="none" style={styles.centerStack}>
        <Text
          style={[
            styles.eyebrow,
            { color: eyebrowColor, marginBottom: showTemp ? 10 : 0 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {showTemp ? (
          <View style={styles.tempRow}>
            <Text
              style={[
                styles.bigNumber,
                {
                  fontSize: Math.round(size * numScale),
                  // Tracking proportional to the rendered size so the readout
                  // never visually loosens or tightens between size morphs.
                  letterSpacing: -Math.round(size * numScale) * 0.07,
                  color: THEME.bone[100],
                },
              ]}
            >
              {tempStr}
            </Text>
            <Text
              style={[
                styles.degSymbol,
                { fontSize: Math.round(size * 0.07) },
              ]}
            >
              °
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export const TempDial = memo(TempDialInner);
