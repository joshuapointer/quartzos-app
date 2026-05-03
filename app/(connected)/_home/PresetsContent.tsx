import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { usePressScale } from '../../../src/design/hooks/usePressScale';
import type { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';

import { colors } from '../../../src/design/tokens';
import type { Preset } from '../../../src/db/presets';
import { PresetCard } from './components/PresetCard';
import type { SettingsState } from './types';

export function PresetsContent({
  settings,
  presets,
  activePresetId,
  onApply,
  listProgress,
  onNewPreset,
  sessionActive,
  onBackToSession,
}: {
  settings: SettingsState;
  presets: Preset[];
  activePresetId: string | null;
  onApply: (preset: Preset) => Promise<void>;
  listProgress: SharedValue<number>;
  onNewPreset: () => void;
  sessionActive: boolean;
  onBackToSession: () => void;
}) {
  const newBtnPress = usePressScale();
  const backPress = usePressScale();
  const dismissPress = usePressScale();
  const floatY = useSharedValue(0);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(floatY); };
  }, [floatY]);

  const handleApply = async (preset: Preset) => {
    setApplyingId(preset.id);
    setApplyError(null);
    try {
      await onApply(preset);
    } catch {
      setApplyError("Couldn't reach device");
      setApplyingId(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.panelScroll}
        showsVerticalScrollIndicator={false}
      >
        {sessionActive && (
          <Animated.View style={backPress.animatedStyle}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBackToSession(); }}
              onPressIn={backPress.onPressIn}
              onPressOut={backPress.onPressOut}
              style={styles.backToSessionBtn}
            >
              <Svg width={12} height={12} viewBox="0 0 12 12" style={{ marginRight: 4 }}>
                <Path d="M8 2 L4 6 L8 10" stroke={colors.bone35} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.backToSessionText}>back to session</Text>
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Presets</Text>
          <Animated.View style={newBtnPress.animatedStyle}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNewPreset();
              }}
              onPressIn={newBtnPress.onPressIn}
              onPressOut={newBtnPress.onPressOut}
              style={styles.newBtn}
            >
              <Text style={styles.newBtnText}>+ New</Text>
            </Pressable>
          </Animated.View>
        </View>

        {presets.map((preset, index) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            index={index}
            listProgress={listProgress}
            settings={settings}
            isActive={preset.id === activePresetId}
            isApplying={applyingId === preset.id}
            onApply={handleApply}
          />
        ))}

        {presets.length === 0 && (
          <View style={styles.emptyState}>
            <Animated.View style={[styles.emptyGlyph, floatStyle]}>
              <Svg width={44} height={44} viewBox="0 0 44 44">
                <Path d="M22 4 L40 22 L22 40 L4 22 Z" stroke={colors.emberBright} strokeWidth={1} fill="none" />
                <Path d="M22 13 L31 22 L22 31 L13 22 Z" stroke={colors.emberBright} strokeWidth={0.5} fill="none" opacity={0.5} />
                <SvgCircle cx={22} cy={22} r={2} fill={colors.emberBright} opacity={0.6} />
              </Svg>
            </Animated.View>
            <Text style={styles.emptyStateText}>No presets yet</Text>
            <Text style={styles.emptyStateSub}>Tap + New to save your temperatures as a preset</Text>
          </View>
        )}
      </ScrollView>

      {applyError !== null && (
        <View style={styles.applyErrorToast}>
          <Text style={styles.applyErrorText}>{applyError}</Text>
          <Animated.View style={dismissPress.animatedStyle}>
            <Pressable
              onPress={() => setApplyError(null)}
              onPressIn={dismissPress.onPressIn}
              onPressOut={dismissPress.onPressOut}
              style={styles.applyErrorDismiss}
            >
              <Text style={styles.applyErrorDismissText}>Dismiss</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panelScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 0,
  },
  panelTitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 34,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.68,
  },
  newBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: colors.bone35,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtnText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.bone90,
  },
  backToSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    minHeight: 32,
  },
  backToSessionText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.bone50,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyGlyph: {
    opacity: 0.28,
    marginBottom: 18,
  },
  emptyStateText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 24,
    color: colors.bone50,
    letterSpacing: -0.48,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 12,
    color: colors.bone35,
    letterSpacing: 0.4,
    marginBottom: 24,
  },
  applyErrorToast: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.error,
    marginBottom: 8,
  },
  applyErrorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '400',
    flex: 1,
  },
  applyErrorDismiss: {
    paddingLeft: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyErrorDismissText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.bone50,
  },
});
