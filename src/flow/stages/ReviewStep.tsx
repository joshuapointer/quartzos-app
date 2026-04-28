import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const STAGGER_EASING = Easing.bezier(0.22, 1, 0.36, 1);
import { useEffect } from 'react';

import {
  type Banger,
  type CalibResult,
  type Concentrate,
  type Wall,
} from '../data';
import {
  useBanger,
  useCalibration,
  useColdStartFit,
  useConcentrate,
  useFlow,
  useWall,
} from '../store';
import { THEME, TYPE } from '../theme';

// ─── CalibrationCard ──────────────────────────────────────────────────────────

type CalibrationCardProps = {
  banger: Banger;
  concentrate: Concentrate;
  wall: Wall;
  calibration: CalibResult;
};

const CalibrationCard = React.memo(function CalibrationCard({
  banger,
  concentrate,
  wall,
  calibration,
}: CalibrationCardProps) {
  const { displayed, low, high } = calibration;

  return (
    <View style={styles.calibCardWrap}>
      <View style={styles.calibCard}>
        <View pointerEvents="none" style={styles.calibInnerBorder} />

        <View style={styles.calibRow}>
          {/* Left: label + big temperature */}
          <View style={styles.calibLeft}>
            <Text style={styles.calibEyebrow}>DABRITE WILL READ</Text>
            <Text style={styles.displayValue}>{Math.round(displayed)}°</Text>
          </View>

          {/* Right: window range + label */}
          <View style={styles.calibRight}>
            <Text style={styles.windowValue}>
              {low}–{high}°
            </Text>
            <Text style={styles.windowLabel}>WINDOW</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─── Cold-start toggle ────────────────────────────────────────────────────────

type ColdStartCardProps = {
  banger: Banger;
  fit: 'IDEAL' | 'RECOMMENDED' | 'OPTIONAL' | 'NOT AVAILABLE';
  coldStart: boolean;
  setColdStart: (v: boolean) => void;
};

function ColdStartCard({
  banger,
  fit,
  coldStart,
  setColdStart,
}: ColdStartCardProps) {
  const blocked = fit === 'NOT AVAILABLE';
  const enabled = coldStart && !blocked;
  const thumbX = useSharedValue(enabled ? 22 : 2);

  useEffect(() => {
    thumbX.value = withTiming(enabled ? 22 : 2, { duration: 240 });
  }, [enabled, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const description: string =
    fit === 'IDEAL'
      ? 'Both banger and concentrate are cold-start ideal. Strongly recommended for terpene preservation.'
      : fit === 'RECOMMENDED'
        ? 'Concentrate prefers cold-start. Banger supports it.'
        : fit === 'OPTIONAL'
          ? 'Available, but hot-start is the typical workflow for this combination.'
          : `${banger.name} is not cold-start compatible. Hot-start required.`;

  // Badge palette per state
  const badgeBg =
    fit === 'IDEAL'
      ? 'rgba(170, 197, 224, 0.16)'
      : fit === 'NOT AVAILABLE'
        ? 'rgba(224, 112, 112, 0.16)'
        : fit === 'RECOMMENDED'
          ? 'rgba(180, 200, 230, 0.10)'
          : 'transparent';
  const badgeColor =
    fit === 'IDEAL'
      ? THEME.quartz.bright
      : fit === 'NOT AVAILABLE'
        ? THEME.danger
        : fit === 'RECOMMENDED'
          ? THEME.bone[90]
          : THEME.bone[50];

  function handlePress() {
    if (blocked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColdStart(!coldStart);
  }

  const trackBg = enabled ? THEME.ember.base : THEME.bone[20];

  return (
    <View style={styles.coldCardWrap}>
      <BlurView intensity={22} tint="dark" style={styles.coldCardBlur}>
        <View pointerEvents="none" style={styles.coldCardBorder} />
        <View style={styles.coldCardInner}>
          <View style={styles.coldHeadingRow}>
            <Text style={styles.coldHeading}>Cold start</Text>
            <View style={[styles.coldBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.coldBadgeText, { color: badgeColor }]}>
                {fit}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={handlePress}
              disabled={blocked}
              style={[
                styles.toggleTrack,
                { backgroundColor: trackBg, opacity: blocked ? 0.4 : 1 },
              ]}
              accessibilityRole="switch"
              accessibilityLabel="Cold start"
              accessibilityState={{ checked: enabled, disabled: blocked }}
            >
              {enabled ? (
                <LinearGradient
                  colors={[THEME.ember.bright, THEME.ember.deep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Animated.View style={[styles.toggleThumb, thumbStyle]} />
            </Pressable>
          </View>
          <Text style={styles.coldDescription}>{description}</Text>
        </View>
      </BlurView>
    </View>
  );
}

// ─── ReviewStep ───────────────────────────────────────────────────────────────

export default function ReviewStep() {
  const banger = useBanger();
  const concentrate = useConcentrate();
  const wall = useWall();
  const calibration = useCalibration();
  const coldFit = useColdStartFit();
  const coldStart = useFlow((s) => s.coldStart);
  const setColdStart = useFlow((s) => s.setColdStart);

  if (!banger || !concentrate || !calibration) return null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Animated.View
        entering={FadeInUp.delay(120).duration(380).easing(STAGGER_EASING)}
      >
        <CalibrationCard
          banger={banger}
          concentrate={concentrate}
          wall={wall}
          calibration={calibration}
        />
        <Text style={styles.recipeLine}>
          {banger.name} · {concentrate.name} · {wall.name}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(380).easing(STAGGER_EASING)}
      >
        <ColdStartCard
          banger={banger}
          fit={coldFit}
          coldStart={coldStart}
          setColdStart={setColdStart}
        />
      </Animated.View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },

  // Calibration card
  calibCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: THEME.ember.base,
    shadowRadius: 28,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  calibCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(246,222,210,0.04)',
    paddingVertical: 20,
    paddingHorizontal: 22,
    position: 'relative',
  },
  calibInnerBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(246,222,210,0.20)',
    pointerEvents: 'none',
  } as const,
  calibRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calibLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  calibEyebrow: {
    ...(TYPE.mono as object),
    fontSize: 10,
    letterSpacing: 1.5,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,
  displayValue: {
    fontFamily: 'Geist_300Light',
    fontSize: 56,
    letterSpacing: -2.24,
    lineHeight: 60,
    color: THEME.ember.base,
    textShadowColor: 'rgba(255,122,0,0.30)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  calibRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  windowValue: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[70],
  },
  windowLabel: {
    ...(TYPE.mono as object),
    fontSize: 10,
    letterSpacing: 1.5,
    color: THEME.bone[50],
    textTransform: 'uppercase',
  } as const,

  // Recipe summary line
  recipeLine: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[70],
    marginTop: 12,
  },

  // Cold-start card
  coldCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  coldCardBlur: {
    borderRadius: 24,
    position: 'relative',
  },
  coldCardBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(180, 200, 230, 0.10)',
    pointerEvents: 'none',
  } as const,
  coldCardInner: {
    padding: 16,
  },
  coldHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  coldHeading: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: THEME.bone[100],
  },
  coldBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  coldBadgeText: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.14 * 9,
    textTransform: 'uppercase',
  } as const,
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.bone[100],
    shadowColor: THEME.navy[0],
    shadowRadius: 4,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  coldDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: THEME.bone[50],
    lineHeight: 12 * 1.5,
    maxWidth: 280,
  },
});
