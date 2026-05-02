import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../tokens';
import { GEM_COLORS, GEM_ICONS } from './constants';
import { styles } from './styles';
import type { SaveStepProps } from './types';

export function StepSave({
  presetName,
  onChangeName,
  banger,
  concentrate,
  finalTemp,
  dunkTemp,
  gemColor,
  onSelectGem,
  coldStartCompatible,
  useColdStart,
  onToggleColdStart,
}: SaveStepProps) {
  const iconName = GEM_ICONS[gemColor] ?? 'diamond';

  const orbScale = useSharedValue(1);
  const orbPulse = useSharedValue(1);
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * orbPulse.value }],
  }));

  useEffect(() => {
    orbScale.value = withSequence(
      withSpring(1.12, { damping: 8, stiffness: 300, mass: 0.4 }),
      withSpring(1, { damping: 14, stiffness: 280, mass: 0.5 }),
    );
  }, [gemColor, orbScale]);

  useEffect(() => {
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      orbPulse.value = 1;
    };
  }, [orbPulse]);

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroSection}>
        <Animated.View
          style={[
            styles.heroOrb,
            { backgroundColor: gemColor, shadowColor: gemColor },
            orbStyle,
          ]}
        >
          <MaterialIcons name={iconName} size={36} color={colors.bgDeep} />
        </Animated.View>
        <Text style={styles.heroSummary}>
          {concentrate?.name ?? '—'} · {banger?.name ?? '—'}
        </Text>
        <View style={styles.heroTempRow}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.labelCaps}>Dab</Text>
            <Text style={[styles.heroTemp, { color: colors.emberBright }]}>{finalTemp}°</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.labelCaps}>Dunk</Text>
            <Text style={[styles.heroTemp, { color: colors.quartzBright }]}>{dunkTemp}°</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.labelCaps}>Name</Text>
        <TextInput
          style={styles.input}
          value={presetName}
          onChangeText={onChangeName}
          placeholder="Preset name"
          placeholderTextColor={colors.bone35}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.labelCaps}>Gem color</Text>
        <View style={styles.gemRow}>
          {GEM_COLORS.map((c) => {
            const active = c === gemColor;
            return (
              <Pressable
                key={c}
                onPress={() => onSelectGem(c)}
                style={[styles.gemRing, active && styles.gemRingActive]}
              >
                <View style={[styles.gemDot, { backgroundColor: c }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={coldStartCompatible ? onToggleColdStart : undefined}
        disabled={!coldStartCompatible}
        style={[
          styles.coldStartRow,
          !coldStartCompatible && styles.coldStartRowDisabled,
          useColdStart && coldStartCompatible && styles.coldStartRowActive,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.coldStartLabel}>Use cold start</Text>
          <Text style={styles.coldStartHint}>
            {coldStartCompatible
              ? 'Load now, heat low — protects terps on this combo.'
              : 'Not compatible with this banger × concentrate.'}
          </Text>
        </View>
        <View
          style={[
            styles.toggle,
            useColdStart && coldStartCompatible && styles.toggleOn,
            !coldStartCompatible && styles.toggleDisabled,
          ]}
        >
          <View
            style={[
              styles.toggleKnob,
              useColdStart && coldStartCompatible && styles.toggleKnobOn,
            ]}
          />
        </View>
      </Pressable>
    </ScrollView>
  );
}
