import React, { memo, useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { THEME } from '../../theme';
import { reanimatedEasing } from '@/design/tokens';
import { useReducedMotion } from '../useReducedMotion';
import { TorchRing } from './TorchRing';
import { TempDial } from './TempDial';
import { A11Y_LABEL, DEFAULT_LABEL, DEFAULT_SIZE, FADE, MORPH } from './constants';
import { styles } from './styles';
import { isHeat } from './utils';
import type { OrbProps, OrbState } from './types';

export { type OrbState, type OrbProps } from './types';

// ─── Orb (entry point) ──────────────────────────────────────────────────────

function OrbInner(props: OrbProps) {
  const {
    state,
    size: sizeOverride,
    label: labelOverride,
    temp,
    countdownMs,
    low,
    high,
    heatProgress = 0,
    heatTotalSeconds = 30,
    noReading = false,
    idleBreathe = false,
  } = props;

  const reduced = useReducedMotion();
  const targetSize = sizeOverride ?? DEFAULT_SIZE[state];
  const label = labelOverride ?? DEFAULT_LABEL[state];

  // Smooth size morph — animated via container scale on a fixed 320px base
  // to avoid re-layout thrash on every re-render during the cool phase.
  const BASE = 320;
  const sizeShared = useSharedValue(targetSize);
  useEffect(() => {
    sizeShared.value = withTiming(targetSize, MORPH);
  }, [targetSize, sizeShared]);

  // In-Window Climax — Bold #3. The dab window is the moment the product
  // exists to mark, so the swell needs to be perceptible. 450ms out-exp to
  // 1.12, then a 600ms spring-decay back to 1.0 (vs the original 220ms@1.06,
  // which was too brief to register). Reduced-motion: skip the swell entirely.
  const climaxScale = useSharedValue(1);
  // Outer corona ring — fires once on cool-in-window entry, fades over 1200ms.
  const coronaScale = useSharedValue(1);
  const coronaOpacity = useSharedValue(0);
  const prevStateRef = React.useRef<OrbState>(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (reduced) return;
    if (prev !== 'cool-in-window' && state === 'cool-in-window') {
      climaxScale.value = withSequence(
        withTiming(1.12, { duration: 450, easing: Easing.out(Easing.exp) }),
        withTiming(1.0, { duration: 600, easing: reanimatedEasing.easeOut }),
      );
      coronaScale.value = 1.0;
      coronaOpacity.value = 0.55;
      coronaScale.value = withTiming(1.5, { duration: 1200, easing: Easing.out(Easing.exp) });
      coronaOpacity.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.exp) });
    }
  }, [state, climaxScale, coronaScale, coronaOpacity, reduced]);

  const morphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: (sizeShared.value / BASE) * climaxScale.value }],
  }));
  const coronaStyle = useAnimatedStyle(() => ({
    opacity: coronaOpacity.value,
    transform: [{ scale: coronaScale.value }],
  }));

  // Crossfade when state changes — keeps label/treatment swap soft.
  // Reduced: skip the dip; opacity stays at 1 so the state label snaps in instantly.
  const fade = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    fade.value = withSequence(
      withTiming(0.55, { duration: FADE.duration / 2, easing: FADE.easing }),
      withTiming(1, { duration: FADE.duration / 2, easing: FADE.easing }),
    );
  }, [state, fade, reduced]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const inWindow =
    state === 'cool-in-window' ||
    (typeof temp === 'number' &&
      typeof low === 'number' &&
      typeof high === 'number' &&
      temp >= low &&
      temp <= high);

  const fastDrop = state === 'cool-fast-drop';

  const a11yLabel = useMemo(() => {
    const base = A11Y_LABEL[state];
    return typeof temp === 'number' ? `${base}, ${Math.round(temp)} degrees` : base;
  }, [state, temp]);

  return (
    <Animated.View
      style={[
        styles.outer,
        { width: BASE, height: BASE },
        morphStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
      accessibilityElementsHidden={false}
    >
      {/* Outer corona ring — Bold #3. Fires once on cool-in-window entry,
          expanding from orb edge to ~1.5x and fading over 1200ms. Quartz hue
          for explicit cool/warm contrast against the warm orb body. */}
      {!reduced && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          style={[
            styles.coronaAbs,
            {
              width: BASE,
              height: BASE,
              borderRadius: BASE / 2,
              borderColor: THEME.quartz.bright,
            },
            coronaStyle,
          ]}
        />
      )}
      <Animated.View style={[styles.outer, fadeStyle]}>
        {isHeat(state) ? (
          <TorchRing
            size={BASE}
            heatProgress={Math.max(0, Math.min(1, heatProgress))}
            heatTotalSeconds={heatTotalSeconds}
            reheat={state === 'heat-reheat'}
            label={label}
          />
        ) : (
          <TempDial
            size={BASE}
            state={state}
            label={label}
            temp={temp}
            countdownMs={countdownMs}
            noReading={noReading || state === 'dab'}
            inWindow={inWindow}
            fastDrop={fastDrop}
            idleBreathe={idleBreathe}
            reduced={reduced}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const Orb = memo(OrbInner);

export default Orb;
