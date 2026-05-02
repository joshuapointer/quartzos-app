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
import { MOTION, SCREEN, SPACE, THEME, TYPE } from '../theme';
import TempRangeIndicator from '../components/TempRangeIndicator';

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

        {/* Profile eyebrow — recipe line elevated into the card */}
        <Text style={styles.profileEyebrow} numberOfLines={1}>
          PROFILE · {banger.name.toUpperCase()} · {concentrate.name.toUpperCase()} · {wall.name.toUpperCase()}
        </Text>

        {/* Centered target temp — 40pt ember above the range indicator */}
        <Text style={styles.displayValue}>{Math.round(displayed)}°</Text>

        {/* Instrument tape */}
        <TempRangeIndicator
          targetTemp={displayed}
          lowTemp={low}
          highTemp={high}
          unit="F"
        />
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

// Toggle geometry — derived once from track + thumb dimensions instead of
// magic numbers. Padding is the gap between thumb and track edge.
const TOGGLE_TRACK_WIDTH = 52;
const TOGGLE_THUMB_DIAMETER = 22;
const TOGGLE_PADDING = 2;
const TOGGLE_THUMB_OFF_X = TOGGLE_PADDING;
const TOGGLE_THUMB_ON_X =
  TOGGLE_TRACK_WIDTH - TOGGLE_THUMB_DIAMETER - TOGGLE_PADDING;

function ColdStartCard({
  banger,
  fit,
  coldStart,
  setColdStart,
}: ColdStartCardProps) {
  const blocked = fit === 'NOT AVAILABLE';
  const enabled = coldStart && !blocked;
  const thumbX = useSharedValue(enabled ? TOGGLE_THUMB_ON_X : TOGGLE_THUMB_OFF_X);

  useEffect(() => {
    thumbX.value = withTiming(enabled ? TOGGLE_THUMB_ON_X : TOGGLE_THUMB_OFF_X, {
      duration: 240,
      easing: MOTION.STAGGER_EASE,
    });
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
          : `${banger?.name ?? 'this banger'} is not cold-start compatible. Hot-start required.`;

  // Badge palette per state
  const badgeBg =
    fit === 'IDEAL'
      ? 'rgba(170, 197, 224, 0.16)'
      : fit === 'NOT AVAILABLE'
        ? 'rgba(224, 112, 112, 0.16)'
        : fit === 'RECOMMENDED'
          ? THEME.bone.warm10
          : 'transparent';
  const badgeColor =
    fit === 'IDEAL'
      ? THEME.quartz.bright
      : fit === 'NOT AVAILABLE'
        ? THEME.danger.base
        : fit === 'RECOMMENDED'
          ? THEME.bone[90]
          : THEME.bone[50];

  function handlePress() {
    if (blocked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColdStart(!coldStart);
  }

  // When enabled, the LinearGradient renders alone on a transparent track
  // (avoids a visible seam between the gradient and a solid ember underlay).
  const trackBg = enabled ? 'transparent' : THEME.bone[20];

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
    paddingVertical: SPACE.xl,
    paddingHorizontal: SCREEN.HPAD,
    position: 'relative',
    alignItems: 'center',
    gap: SPACE.md,
  },
  calibInnerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(246,222,210,0.20)',
    pointerEvents: 'none',
  } as const,
  // Profile eyebrow inside the card — replaces the old recipeLine
  profileEyebrow: {
    ...(TYPE.mono as object),
    fontSize: 12,
    letterSpacing: 1.2,
    color: THEME.bone[90],
    textTransform: 'uppercase',
    textAlign: 'center',
  } as const,
  // Target temperature — 40pt ember, centered above the range indicator.
  // Reduced from 56pt so the orb stays the visual protagonist on this screen.
  displayValue: {
    fontFamily: 'Geist_300Light',
    fontSize: 40,
    letterSpacing: -1.6,
    lineHeight: 44,
    color: THEME.ember.base,
    textShadowColor: 'rgba(255,122,0,0.30)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    textAlign: 'center',
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: THEME.bone.warm10,
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
    borderRadius: SCREEN.BADGE_RADIUS,
  },
  coldBadgeText: {
    ...(TYPE.mono as object),
    fontSize: 9,
    letterSpacing: 0.14 * 9,
    textTransform: 'uppercase',
  } as const,
  toggleTrack: {
    width: TOGGLE_TRACK_WIDTH,
    height: 30,
    borderRadius: SCREEN.PILL_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 4,
    width: TOGGLE_THUMB_DIAMETER,
    height: TOGGLE_THUMB_DIAMETER,
    borderRadius: TOGGLE_THUMB_DIAMETER / 2,
    backgroundColor: THEME.bone[100],
    shadowColor: THEME.navy[0],
    shadowRadius: 4,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  coldDescription: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: THEME.bone[70],
    lineHeight: 13 * 1.5,
    maxWidth: 280,
  },
});
