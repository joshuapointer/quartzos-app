import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CONCENTRATES, isDabbable, type Concentrate } from '../../../data/concentrates';
import { ConcentrateTagChip } from '../ConcentrateTagChip';
import { CATEGORY_SWATCH_COLORS, CONCENTRATE_CATEGORY_LABELS, CONCENTRATE_CATEGORY_ORDER } from './constants';
import { styles } from './styles';
import type { ConcentrateStepProps } from './types';
import { colors, spacing } from '../../tokens';

interface ConcentrateSwatchProps {
  concentrate: Concentrate;
  active: boolean;
  onSelect: (id: string) => void;
}

function ConcentrateSwatch({ concentrate, active, onSelect }: ConcentrateSwatchProps) {
  const dabbable = isDabbable(concentrate);
  const [color1, color2] = CATEGORY_SWATCH_COLORS[concentrate.category];
  const hasWarning = concentrate.warning != null;
  const topTags = concentrate.tags.slice(0, 2);

  return (
    <Pressable
      onPress={() => onSelect(concentrate.id)}
      style={[
        styles.swatch,
        active && dabbable && styles.swatchActive,
        !dabbable && styles.swatchBlocked,
      ]}
    >
      <LinearGradient
        colors={[color1, color2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.swatchGradient, !dabbable && styles.swatchGradientBlocked]}
      />
      <View style={styles.swatchTextWrap}>
        <Text
          style={[styles.swatchName, !dabbable && styles.swatchNameBlocked]}
          numberOfLines={2}
        >
          {concentrate.name}
        </Text>
        {dabbable && concentrate.surface_temp_optimal_f != null ? (
          <Text style={styles.swatchTemp}>{concentrate.surface_temp_optimal_f}°F</Text>
        ) : (
          <Text style={[styles.swatchTemp, styles.swatchTempBlocked]}>Not dabbable</Text>
        )}
        {dabbable && topTags.length > 0 ? (
          <View style={styles.swatchTagRow}>
            {topTags.map((t) => (
              <ConcentrateTagChip key={t} tag={t} />
            ))}
          </View>
        ) : null}
      </View>
      {active && dabbable ? (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={14} color={colors.bgDeep} />
        </View>
      ) : null}
      {hasWarning && dabbable ? (
        <View style={styles.warnBadge}>
          <Text style={styles.warnBadgeText}>⚠︎</Text>
        </View>
      ) : null}
      {!dabbable ? (
        <View style={styles.blockedBadge}>
          <MaterialIcons name="block" size={14} color={colors.error} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function StepConcentrate({ concentrateId, onSelect }: ConcentrateStepProps) {
  const groups = useMemo(() => {
    return CONCENTRATE_CATEGORY_ORDER.map((category) => ({
      category,
      items: CONCENTRATES.filter((c) => c.category === category),
    })).filter((g) => g.items.length > 0);
  }, []);

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
      {groups.map((g) => (
        <View key={g.category} style={{ gap: spacing.sm }}>
          <Text style={styles.labelCaps}>{CONCENTRATE_CATEGORY_LABELS[g.category]}</Text>
          <View style={styles.swatchGrid}>
            {g.items.map((c) => (
              <ConcentrateSwatch
                key={c.id}
                concentrate={c}
                active={c.id === concentrateId}
                onSelect={onSelect}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
