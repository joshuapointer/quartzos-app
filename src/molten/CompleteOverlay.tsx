import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Line } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, motion } from '../design/tokens';
import { PrismEdge } from '../design/components/molten/PrismEdge';
import { useSessionStore } from '../state/sessionStore';

// ─────────────────────────────────────────────────────────────────────────────

export type CompleteOverlayProps = {
  bangerName: string;
  windowLabel: string | null;
  onAgain: () => void;
  onNew: () => void;
};

// ─── ArrowIcon ────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Line
        x1={3}
        y1={11}
        x2={11}
        y2={3}
        stroke={colors.bone60}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Polyline
        points="5,3 11,3 11,9"
        stroke={colors.bone60}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── CompleteCard ─────────────────────────────────────────────────────────────

type CompleteCardProps = {
  title: string;
  sub: string;
  onPress: () => void;
};

function CompleteCard({ title, sub, onPress }: CompleteCardProps) {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    setPressed(true);
    scale.value = withTiming(0.98, { duration: motion.duration.tap });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
    scale.value = withTiming(1, { duration: motion.duration.tap });
  }, [scale]);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.cardTouchable}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.cardGlass]} pointerEvents="none" />
        {pressed && <PrismEdge radius={18} strokeWidth={0.75} />}

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} allowFontScaling={false}>
            {title}
          </Text>
          <Text style={styles.cardSub} allowFontScaling={false}>
            {sub}
          </Text>
          <View style={styles.arrowWrap} pointerEvents="none">
            <ArrowIcon />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── CompleteOverlay ──────────────────────────────────────────────────────────

export const CompleteOverlay = React.memo(function CompleteOverlay({
  bangerName,
  windowLabel,
  onAgain,
  onNew,
}: CompleteOverlayProps) {
  const peakF = useSessionStore((s) => s.peakF);
  const displayPeakF = Math.round(peakF || 0);
  // Card-pair entrance: spring from scale 0.86 / opacity 0 → 1 on mount.
  // The prototype CSS doesn't formally specify an entrance, but the cards
  // visually pop on phase entry — matching the spec's "session card pair
  // springs in" line in the spec timing table.
  const cardScale = useSharedValue(0.86);
  const cardOp = useSharedValue(0);
  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 16, stiffness: 200, mass: 0.8 });
    cardOp.value = withTiming(1, { duration: 260 });
    return () => {
      cancelAnimation(cardScale);
      cancelAnimation(cardOp);
    };
  }, [cardScale, cardOp]);
  const cardPairStyle = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Eyebrow */}
      <Text style={styles.eyebrow} allowFontScaling={false}>
        Saved · auto
      </Text>

      {/* Card pair */}
      <Animated.View style={[styles.cardPair, cardPairStyle]}>
        <CompleteCard
          title="Again"
          sub={`Same banger\nsame concentrate`}
          onPress={onAgain}
        />
        <CompleteCard
          title="New"
          sub={`Pick something\ndifferent`}
          onPress={onNew}
        />
      </Animated.View>

      {/* Recap line */}
      <View style={styles.recapRow}>
        <Text style={styles.recapLabel} allowFontScaling={false}>
          {'Peak'}
        </Text>
        <Text style={styles.recapValue} allowFontScaling={false}>
          {` ${displayPeakF}°F`}
        </Text>
        {windowLabel !== null && (
          <>
            <Text style={styles.recapSep} allowFontScaling={false}>
              {' · '}
            </Text>
            <Text style={styles.recapLabel} allowFontScaling={false}>
              {'Window'}
            </Text>
            <Text style={styles.recapValue} allowFontScaling={false}>
              {` ${windowLabel}`}
            </Text>
          </>
        )}
        <Text style={styles.recapSep} allowFontScaling={false}>
          {' · '}
        </Text>
        <Text style={styles.recapBanger} allowFontScaling={false}>
          {bangerName}
        </Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  eyebrow: {
    ...fonts.monoEyebrow,
    letterSpacing: 3.52,
    color: colors.bone40,
  },
  cardPair: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 320,
    marginTop: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.glassEdge,
    position: 'relative',
  },
  cardGlass: {
    backgroundColor: colors.glassThin,
    borderRadius: 18,
  },
  cardContent: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 18,
    minHeight: 100,
  },
  cardTitle: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: -0.22, // -0.01em * 22
    color: colors.bone100,
    marginBottom: 6,
  },
  cardSub: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 8.5,
    letterSpacing: 1.7, // 0.20em * 8.5
    textTransform: 'uppercase',
    color: colors.bone40,
    lineHeight: 12,
  },
  arrowWrap: {
    position: 'absolute',
    right: 14,
    bottom: 14,
  },
  // Recap row
  recapRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
    marginTop: 6,
  },
  recapLabel: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 1.98, // 0.22em * 9
    textTransform: 'uppercase',
    color: colors.bone40,
    lineHeight: 12,
  },
  recapValue: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 15,
    letterSpacing: -0.15, // -0.01em * 15
    color: colors.bone100,
    lineHeight: 18,
  },
  recapSep: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    color: colors.glassEdgeStrong,
    lineHeight: 12,
  },
  recapBanger: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.bone100,
    lineHeight: 18,
  },
});
