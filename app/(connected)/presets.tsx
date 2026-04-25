import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { QuartzBackground, GlassCard, ChromeButton } from '../../src/design';
import { colors, spacing, radius, fonts } from '../../src/design/tokens';
import { formatTemp } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import type { Preset } from '../../src/db/presets';
import type { RGB565 } from '../../src/ble/types';

function rgb565ToHex(value: RGB565): string {
  const r = ((value >> 11) & 0x1f) << 3;
  const g = ((value >> 5) & 0x3f) << 2;
  const b = (value & 0x1f) << 3;
  return `rgb(${r},${g},${b})`;
}

interface PresetCardProps {
  preset: Preset;
  onApply: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function PresetCard({ preset, onApply, onDelete, onEdit }: PresetCardProps) {
  const { settings } = preset;
  return (
    <GlassCard style={styles.card} padding={14} borderRadius={radius.md}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{preset.name}</Text>
        {preset.isBuiltIn && (
          <View style={styles.builtInBadge}>
            <Text style={styles.builtInText}>Built-in</Text>
          </View>
        )}
        {!preset.isBuiltIn && (
          <>
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Color swatches */}
      <View style={styles.swatchRow}>
        {(settings.colors as [RGB565, RGB565, RGB565, RGB565]).map((c, i) => (
          <View
            key={i}
            style={[styles.swatch, { backgroundColor: rgb565ToHex(c) }]}
          />
        ))}
      </View>

      {/* Alarm temps */}
      <View style={styles.alarmRow}>
        <Text style={styles.alarmLabel}>
          Dab: <Text style={styles.alarmValue}>{formatTemp(settings.dabAlarmF, settings.useCelsius)}</Text>
        </Text>
        <Text style={styles.alarmLabel}>
          Dunk: <Text style={[styles.alarmValue, { color: '#5AD9FF' }]}>{formatTemp(settings.dunkAlarmF, settings.useCelsius)}</Text>
        </Text>
      </View>

      {/* Apply button */}
      <ChromeButton
        label="Apply"
        onPress={onApply}
        variant="secondary"
        style={styles.applyButton}
      />
    </GlassCard>
  );
}

export default function PresetsScreen() {
  const [presets, setPresets] = useState<Preset[]>([]);

  const load = useCallback(async () => {
    await presetsDb.seedBuiltins();
    const all = await presetsDb.getAll();
    setPresets(all);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApply = useCallback((preset: Preset) => {
    void bleManager.writeSettings(preset.settings);
  }, []);

  const handleDelete = useCallback((preset: Preset) => {
    Alert.alert(
      'Delete Preset',
      `Delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await presetsDb.remove(preset.id);
            await load();
          },
        },
      ],
    );
  }, [load]);

  return (
    <View style={styles.root}>
      <QuartzBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Text style={styles.heading}>Presets</Text>
        <FlatList
          data={presets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <PresetCard
              preset={item}
              onApply={() => handleApply(item)}
              onDelete={() => handleDelete(item)}
              onEdit={() => router.push(`/(connected)/presets/${item.id}` as never)}
            />
          )}
        />
        {/* FAB */}
        <ChromeButton
          label="+"
          onPress={() => router.push('/(connected)/presets/new')}
          variant="primary"
          style={styles.fab}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.idleDeep,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  heading: {
    color: colors.textPrimary,
    ...fonts.h1,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: 80,
  },
  card: {
    alignSelf: 'stretch',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  builtInBadge: {
    backgroundColor: colors.glassTint,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.crystalEdge,
  },
  builtInText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  deleteIcon: {
    color: colors.alertRed,
    fontSize: 16,
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  editIcon: {
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.crystalEdge,
  },
  alarmRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  alarmLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  alarmValue: {
    color: colors.activeAmber,
    fontWeight: '600',
  },
  applyButton: {
    alignSelf: 'stretch',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    minHeight: 0,
  },
});
