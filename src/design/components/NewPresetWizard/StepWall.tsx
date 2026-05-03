import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Rect as SvgRect } from 'react-native-svg';
import { WALL_THICKNESSES, type WallThickness, type WallThicknessId } from '../../../data/wallThicknesses';
import { WALL_ORDER } from './constants';
import { styles } from './styles';
import type { WallStepProps } from './types';
import { colors, spacing } from '../../tokens';

function ThermalStrip({ thickness }: { thickness: WallThicknessId }) {
  const strokeMap: Record<WallThicknessId, number> = {
    thin: 4,
    standard: 8,
    thick: 14,
    unknown: 8,
  };
  const w = strokeMap[thickness];
  return (
    <Svg width={88} height={56} viewBox="0 0 88 56">
      <SvgRect
        x={(88 - w) / 2}
        y={6}
        width={w}
        height={44}
        rx={2}
        fill={colors.surface5}
        stroke={colors.bone35}
        strokeWidth={1}
      />
    </Svg>
  );
}

export function StepWall({ wallId, onSelect }: WallStepProps) {
  const orderedWalls = useMemo<readonly WallThickness[]>(() => {
    return WALL_ORDER.map((id) => WALL_THICKNESSES.find((w) => w.id === id)).filter(
      (w): w is WallThickness => w !== undefined,
    );
  }, []);

  const active = orderedWalls.find((w) => w.id === wallId) ?? orderedWalls[1];

  return (
    <ScrollView
      style={styles.stepRoot}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chipRow}>
        {orderedWalls.map((w) => {
          const isActive = w.id === wallId;
          return (
            <Pressable
              key={w.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(w.id);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {w.id === 'unknown' ? '?' : w.id.charAt(0).toUpperCase() + w.id.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.wallStripPanel}>
        <ThermalStrip thickness={active.id} />
        <View style={styles.wallStripText}>
          <Text style={styles.wallStripTitle}>{active.name}</Text>
          <Text style={styles.wallStripModifier}>
            {active.modifier_f === 0 ? '0' : active.modifier_f > 0 ? `+${active.modifier_f}` : active.modifier_f}°F modifier
          </Text>
        </View>
      </View>

      <View style={styles.thermalPanel}>
        <Text style={styles.thermalNote}>{active.description}</Text>
        {active.thickness_mm_range ? (
          <Text style={styles.calibrationNote}>Range: {active.thickness_mm_range} mm</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
