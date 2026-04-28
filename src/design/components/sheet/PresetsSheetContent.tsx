import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { GlassCard } from '../GlassCard';
import { ChromeButton } from '../ChromeButton';
import { toast } from '../Toast';
import { useThemeColors } from '../../ThemeContext';
import { colors, spacing, radius, fonts } from '../../tokens';
import { formatTemp } from '../../../utils/temperature';
import { bleManager } from '../../../ble/BleManager';
import { useSettingsStore } from '../../../state/settingsStore';
import * as presetsDb from '../../../db/presets';
import type { Preset } from '../../../db/presets';

// ─── Gem color helper ────────────────────────────────────────────────────────

const GEM_COLORS = [
  colors.sapphire,
  colors.amethyst,
  colors.citrine,
  colors.emerald,
  colors.ruby,
] as const;

const GEM_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [colors.sapphire]: 'water-drop',
  [colors.amethyst]: 'diamond',
  [colors.citrine]:  'local-fire-department',
  [colors.emerald]:  'eco',
  [colors.ruby]:     'favorite',
};

function gemColorFor(preset: Preset): string {
  let hash = 0;
  for (const ch of preset.name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return GEM_COLORS[Math.abs(hash) % GEM_COLORS.length];
}

// ─── PresetCard ───────────────────────────────────────────────────────────────

interface PresetCardProps {
  preset: Preset;
  onApply: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function PresetCard({ preset, onApply, onDelete, onEdit }: PresetCardProps) {
  const themeColors = useThemeColors();
  const { settings } = preset;
  const gemColor = gemColorFor(preset);
  const gemIcon = GEM_ICONS[gemColor] ?? 'diamond';

  return (
    <GlassCard
      style={[styles.card, { borderColor: gemColor + '33' }]}
      padding={16}
      borderRadius={radius.lg}
    >
      {/* Top row: temp badge + menu actions */}
      <View style={styles.cardTopRow}>
        <View style={[styles.tempBadge, { backgroundColor: themeColors.surfaceBright + '66' }]}>
          <Text style={[styles.tempBadgeText, { color: themeColors.onSurface }]}>
            {formatTemp(settings.dabAlarmF, settings.useCelsius)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          {!preset.isBuiltIn && (
            <>
              <TouchableOpacity
                onPress={onEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <MaterialIcons name="edit" size={16} color={themeColors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <MaterialIcons name="close" size={16} color={themeColors.error} />
              </TouchableOpacity>
            </>
          )}
          {preset.isBuiltIn && (
            <View style={[styles.builtInBadge, { backgroundColor: themeColors.glassFill, borderColor: themeColors.glassBorder }]}>
              <Text style={[styles.builtInText, { color: themeColors.onSurfaceVariant }]}>Built-in</Text>
            </View>
          )}
        </View>
      </View>

      {/* Center: gem icon orb */}
      <View style={styles.cardCenter}>
        <View style={[
          styles.gemOrb,
          {
            backgroundColor: gemColor + '26',
            borderColor: gemColor,
          },
        ]}>
          <MaterialIcons name={gemIcon} size={32} color={gemColor} />
        </View>
      </View>

      {/* Bottom: name, alarm temps, apply */}
      <View style={styles.cardBottom}>
        <Text style={[styles.cardName, { color: themeColors.onSurface }]} numberOfLines={1}>
          {preset.name}
        </Text>

        <View style={styles.alarmRow}>
          <Text style={[styles.alarmLabel, { color: themeColors.onSurfaceVariant }]}>
            Dab: <Text style={[styles.alarmValue, { color: themeColors.primary }]}>{formatTemp(settings.dabAlarmF, settings.useCelsius)}</Text>
          </Text>
          <Text style={[styles.alarmLabel, { color: themeColors.onSurfaceVariant }]}>
            Dunk: <Text style={[styles.alarmValue, { color: themeColors.sapphire }]}>{formatTemp(settings.dunkAlarmF, settings.useCelsius)}</Text>
          </Text>
        </View>

        <ChromeButton
          label="Apply"
          onPress={onApply}
          variant="secondary"
          style={styles.applyButton}
        />
      </View>
    </GlassCard>
  );
}

// ─── PresetsSheetContent ──────────────────────────────────────────────────────

export function PresetsSheetContent() {
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
    const doWrite = async () => {
      try {
        await bleManager.writeSettings(preset.settings);
        useSettingsStore.getState().setSettings(preset.settings);
        useSettingsStore.getState().setActivePresetId(preset.id);
      } catch {
        toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
          retryLabel: 'Retry',
          onRetry: () => { void doWrite(); },
        });
      }
    };
    void doWrite();
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
    <FlatList
      data={presets}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={
        <ChromeButton
          label="+ New Preset"
          onPress={() => router.push('/(connected)/presets/new')}
          variant="primary"
          style={styles.newPresetBtn}
        />
      }
      renderItem={({ item }) => (
        <PresetCard
          preset={item}
          onApply={() => handleApply(item)}
          onDelete={() => handleDelete(item)}
          onEdit={() => router.push(`/(connected)/presets/${item.id}` as never)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  newPresetBtn: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  // Card
  card: {
    alignSelf: 'stretch',
    minHeight: 200,
    backgroundColor: 'rgba(22,16,35,0.4)',
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tempBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tempBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: 4,
  },
  builtInBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  builtInText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  cardCenter: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gemOrb: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    gap: spacing.sm,
  },
  cardName: {
    ...fonts.h2,
  },
  alarmRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  alarmLabel: {
    fontSize: 13,
  },
  alarmValue: {
    fontWeight: '600',
  },
  applyButton: {
    alignSelf: 'stretch',
  },
});
