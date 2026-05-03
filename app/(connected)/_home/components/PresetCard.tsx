import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '../../../../src/design/tokens';
import { usePressScale } from '../../../../src/design/hooks/usePressScale';
import { formatTemp } from '../../../../src/utils/temperature';
import { GemDot } from './GemDot';
import type { PresetCardProps } from '../types';

export const PresetCard = React.memo(function PresetCard({
  preset, index, listProgress, settings, isActive, isApplying, onApply,
}: PresetCardProps) {
  const applyPress = usePressScale();
  const delay = Math.min(index * 0.1, 0.4);
  const cardStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, (listProgress.value - delay) / (1 - delay || 0.001)));
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 10 }],
    };
  });

  return (
    <Animated.View style={[styles.presetCardOuter, cardStyle]}>
      <View style={[styles.presetCard, isActive && styles.presetCardActive]}>
        <View
          style={[StyleSheet.absoluteFillObject, styles.presetCardBorder, isActive && styles.presetCardBorderActive]}
          pointerEvents="none"
        />
        <View style={styles.presetCardLeft}>
          <GemDot idx={preset.iconSlot ?? 0} />
        </View>
        <View style={styles.presetCardMid}>
          <Text style={styles.presetCardName} numberOfLines={1}>{preset.name}</Text>
          <View style={styles.presetTempRow}>
            <Text style={styles.presetTempDab}>DAB {formatTemp(preset.settings.dabAlarmF, settings.useCelsius)}</Text>
            <Text style={styles.presetTempDunk}>  DUNK {formatTemp(preset.settings.dunkAlarmF, settings.useCelsius)}</Text>
          </View>
        </View>
        <View style={styles.presetCardRight}>
          {isActive ? (
            <Text style={styles.activePillText}>ACTIVE</Text>
          ) : (
            <Animated.View style={applyPress.animatedStyle}>
              <Pressable
                onPress={() => onApply(preset)}
                onPressIn={applyPress.onPressIn}
                onPressOut={applyPress.onPressOut}
                style={styles.applyBtn}
                disabled={isApplying}
              >
                {isApplying ? (
                  <ActivityIndicator size="small" color={colors.emberBright} />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  presetCardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 72,
    backgroundColor: colors.surface2,
    borderRadius: 18,
  },
  presetCardActive: {
    backgroundColor: colors.surface2,
  },
  presetCardBorder: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  presetCardBorderActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
  },
  presetCardLeft: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCardMid: { flex: 1, paddingLeft: 12 },
  presetCardName: {
    fontFamily: 'Geist_400Regular',
    fontSize: 18,
    color: colors.bone100,
    letterSpacing: -0.36,
    marginBottom: 4,
  },
  presetTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetTempDab: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone70,
    letterSpacing: 0.3,
  },
  presetTempDunk: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.quartzDim,
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  presetCardRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2.2,
    color: colors.emberBright,
  },
  applyBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.surface4,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.emberBright,
  },
});
