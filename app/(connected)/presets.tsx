import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { QBackground, ChromeButton, FloatingHeader } from '../../src/design';
import { colors, spacing, radius, fonts } from '../../src/design/tokens';
import { formatTemp } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import { useBleStore } from '../../src/state/bleStore';
import * as presetsDb from '../../src/db/presets';
import type { Preset } from '../../src/db/presets';
import { PresetPill } from '../../src/design/components/PresetPill';

// ─── Gem color helper ────────────────────────────────────────────────────────

const GEM_COLORS = [
  colors.sapphire,
  colors.amethyst,
  colors.citrine,
  colors.emerald,
  colors.ruby,
] as const;

function gemColorFor(preset: Preset): string {
  let hash = 0;
  for (const ch of preset.name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return GEM_COLORS[Math.abs(hash) % GEM_COLORS.length];
}

// ─── PresetRow ────────────────────────────────────────────────────────────────
// Wraps PresetPill with an overflow menu (Option A: three-dot inline expand).
// Active indicator: 1px firedAmber ring around gem dot.

interface PresetRowProps {
  preset: Preset;
  isActive: boolean;
  onApply: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function PresetRow({ preset, isActive, onApply, onDelete, onEdit }: PresetRowProps) {
  const gemColor = gemColorFor(preset);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = useCallback(() => {
    const toValue = menuOpen ? 0 : 1;
    Animated.timing(menuAnim, {
      toValue,
      duration: 160,
      useNativeDriver: true,
    }).start();
    setMenuOpen((prev) => !prev);
  }, [menuOpen, menuAnim]);

  const menuHeight = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });
  const menuOpacity = menuAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const gemDotStyle = isActive
    ? [styles.gemDotWrapper, styles.gemDotActive]
    : styles.gemDotWrapper;

  return (
    <View>
      {/* Row: PresetPill + active ring overlay + overflow button */}
      <View style={styles.rowContainer}>
        {/* Active ring around gem dot — rendered as an absolute overlay on the left edge */}
        {isActive && (
          <View
            style={[styles.activeRing, { borderColor: colors.firedAmber }]}
            pointerEvents="none"
          />
        )}

        {/* The canonical pill — tap = apply */}
        <View style={styles.pillWrapper}>
          <PresetPill
            presetName={preset.name}
            gemColor={gemColor}
            onPress={onApply}
            style={styles.pill}
          />
        </View>

        {/* Three-dot overflow — only for non-built-in presets */}
        {!preset.isBuiltIn ? (
          <TouchableOpacity
            onPress={toggleMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.overflowBtn}
            accessibilityLabel="Preset options"
          >
            <MaterialIcons name="more-vert" size={20} color={colors.boneGhost} />
          </TouchableOpacity>
        ) : (
          <View style={styles.builtInSpacer}>
            <Text style={styles.builtInText}>Built-in</Text>
          </View>
        )}
      </View>

      {/* Inline action row — height-animated, opacity-animated */}
      <Animated.View
        style={[
          styles.actionRow,
          { height: menuHeight, opacity: menuOpacity, overflow: 'hidden' },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setMenuOpen(false);
            menuAnim.setValue(0);
            onEdit();
          }}
          style={styles.actionItem}
          accessibilityLabel="Edit preset"
        >
          <MaterialIcons name="edit" size={14} color={colors.boneMid} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setMenuOpen(false);
            menuAnim.setValue(0);
            onDelete();
          }}
          style={styles.actionItem}
          accessibilityLabel="Delete preset"
        >
          <MaterialIcons name="delete-outline" size={14} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onCrystallize: () => void;
}

function EmptyState({ onCrystallize }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      {/* Ember-outlined Q monogram circle */}
      <View style={styles.emptyOrb}>
        <Text style={styles.emptyGlyph}>Q</Text>
      </View>
      <Text style={styles.emptyTitle}>No presets yet</Text>
      <Text style={styles.emptyCaption}>Crystallize your first ritual.</Text>
      <ChromeButton
        label="Crystallize New"
        onPress={onCrystallize}
        variant="secondary"
        style={styles.emptyCrystallizeBtn}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PresetsScreen() {
  const connectionState = useBleStore((s) => s.connectionState);
  const [presets, setPresets] = useState<Preset[]>([]);
  // TODO: replace with shared activePresetId from a cross-screen store when available.
  // Currently activePresetId is local to home.tsx only.
  const [activePresetId] = useState<string | null>(null);

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

  const handleCrystallize = useCallback(() => {
    router.push('/(connected)/presets/new');
  }, []);

  return (
    <View style={styles.root}>
      <QBackground />
      <FloatingHeader connectionState={connectionState} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Page header */}
        <Text style={styles.displayTitle}>Presets</Text>
        <Text style={styles.subtitle}>Your saved transcendental states.</Text>

        {presets.length === 0 ? (
          <EmptyState onCrystallize={handleCrystallize} />
        ) : (
          <>
            {/* Crystallize New — secondary variant (no amber) */}
            <ChromeButton
              label="+ Crystallize New"
              onPress={handleCrystallize}
              variant="secondary"
              style={styles.crystallizeBtn}
            />

            <FlatList
              data={presets}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <PresetRow
                  preset={item}
                  isActive={item.id === activePresetId}
                  onApply={() => handleApply(item)}
                  onDelete={() => handleDelete(item)}
                  onEdit={() => router.push(`/(connected)/presets/${item.id}` as never)}
                />
              )}
            />
          </>
        )}
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
  // Row layout
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    // PresetPill handles its own height (48px) and border radius
  },
  overflowBtn: {
    marginLeft: spacing.sm,
    padding: 4,
  },
  builtInSpacer: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.glassFill,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  builtInText: {
    color: colors.boneGhost,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  // Active ring — absolutely positioned over the left side of the pill
  activeRing: {
    position: 'absolute',
    left: 9,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    zIndex: 1,
    pointerEvents: 'none',
  },
  gemDotWrapper: {},
  gemDotActive: {},
  // Inline action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    gap: spacing.lg,
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    color: colors.boneMid,
    fontSize: 13,
    fontWeight: '500',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: spacing.sm,
  },
  emptyOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.firedAmber + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyGlyph: {
    color: colors.firedAmber + '80',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  emptyTitle: {
    ...fonts.body,
    color: colors.boneMid,
  },
  emptyCaption: {
    ...fonts.caption,
    color: colors.boneGhost,
    marginBottom: spacing.md,
  },
  emptyCrystallizeBtn: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.xl,
  },
});
