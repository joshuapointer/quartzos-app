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
import { MaterialIcons } from '@expo/vector-icons';

import { QuartzBackground, GlassCard, ChromeButton, FloatingHeader } from '../../src/design';
import { colors, spacing, radius, fonts } from '../../src/design/tokens';
import { formatTemp } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import { useBleStore } from '../../src/state/bleStore';
import * as presetsDb from '../../src/db/presets';
import type { Preset } from '../../src/db/presets';

// ─── Gem color helper ────────────────────────────────────────────────────────

const GEM_COLORS = [
  colors.sapphire,
  colors.amethyst,
  colors.citrine,
  colors.emerald,
  colors.ruby,
] as const;

const GEM_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [colors.sapphire]:  'water-drop',
  [colors.amethyst]:  'diamond',
  [colors.citrine]:   'local-fire-department',
  [colors.emerald]:   'eco',
  [colors.ruby]:      'favorite',
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
        <View style={styles.tempBadge}>
          <Text style={styles.tempBadgeText}>
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
                <MaterialIcons name="edit" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <MaterialIcons name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
          {preset.isBuiltIn && (
            <View style={styles.builtInBadge}>
              <Text style={styles.builtInText}>Built-in</Text>
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
        <Text style={styles.cardName} numberOfLines={1}>{preset.name}</Text>

        <View style={styles.alarmRow}>
          <Text style={styles.alarmLabel}>
            Dab: <Text style={styles.alarmValue}>{formatTemp(settings.dabAlarmF, settings.useCelsius)}</Text>
          </Text>
          <Text style={styles.alarmLabel}>
            Dunk: <Text style={[styles.alarmValue, { color: colors.sapphire }]}>{formatTemp(settings.dunkAlarmF, settings.useCelsius)}</Text>
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PresetsScreen() {
  const connectionState = useBleStore((s) => s.connectionState);
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
      <FloatingHeader connectionState={connectionState} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Page header */}
        <Text style={styles.displayTitle}>Presets</Text>
        <Text style={styles.subtitle}>Your saved transcendental states.</Text>

        {/* Crystallize New button */}
        <ChromeButton
          label="+ Crystallize New"
          onPress={() => router.push('/(connected)/presets/new')}
          variant="primary"
          style={styles.crystallizeBtn}
        />

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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  safe: {
    flex: 1,
    paddingTop: 88,
    paddingBottom: 120,
    paddingHorizontal: spacing.md,
  },
  displayTitle: {
    ...fonts.display,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
    marginBottom: 24,
  },
  crystallizeBtn: {
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  listContent: {
    paddingBottom: spacing.lg,
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
    backgroundColor: colors.surfaceBright + '66',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tempBadgeText: {
    color: colors.onSurface,
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
    backgroundColor: colors.glassFill,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  builtInText: {
    color: colors.onSurfaceVariant,
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
    color: colors.onSurface,
    ...fonts.h2,
  },
  alarmRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  alarmLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  alarmValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    alignSelf: 'stretch',
  },
});
