import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  ChromeButton,
  GlassCard,
  QBackground,
} from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { rgb565to888, rgb888to565 } from '../../src/ble/DabRiteProtocol';
import { useSettingsStore } from '../../src/state/settingsStore';
import { bleManager } from '../../src/ble/BleManager';

// ---------- Types ------------------------------------------------------------

type MineralSwatch = {
  key: string;
  label: string;
  hex: string;
};

// ---------- Swatch palette ---------------------------------------------------

const SWATCHES: MineralSwatch[] = [
  { key: 'brass',       label: 'BRASS',        hex: colors.brass },
  { key: 'firedAmber',  label: 'FIRED AMBER',  hex: colors.firedAmber },
  { key: 'emberGlow',   label: 'EMBER GLOW',   hex: colors.emberGlow },
  { key: 'emberDeep',   label: 'EMBER DEEP',   hex: colors.emberDeep },
  { key: 'coldSlate',   label: 'COLD SLATE',   hex: colors.coldSlate },
  { key: 'quartzMid',   label: 'QUARTZ MID',   hex: colors.quartzMid },
  { key: 'quartzDim',   label: 'QUARTZ DIM',   hex: colors.quartzDim },
  { key: 'warmBone',    label: 'WARM BONE',    hex: colors.warmBone },
  { key: 'boneMid',     label: 'BONE MID',     hex: colors.boneMid },
];

const GRID_COLUMNS = 3;

// ---------- Helpers ----------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const n = parseInt(cleaned, 16);
  return { r: (n >> 16) & 0xFF, g: (n >> 8) & 0xFF, b: n & 0xFF };
}

function clampSlot(n: number): 0 | 1 | 2 | 3 {
  if (!Number.isFinite(n)) return 0;
  const i = Math.max(0, Math.min(3, Math.floor(n)));
  return i as 0 | 1 | 2 | 3;
}

/** Find the closest swatch to the stored RGB565 value (by Euclidean distance). */
function closestSwatch(stored565: number): string {
  const { r: sr, g: sg, b: sb } = rgb565to888(stored565);
  let bestKey = SWATCHES[0].key;
  let bestDist = Infinity;
  for (const sw of SWATCHES) {
    const rgb = hexToRgb(sw.hex);
    if (!rgb) continue;
    const d =
      (rgb.r - sr) ** 2 +
      (rgb.g - sg) ** 2 +
      (rgb.b - sb) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestKey = sw.key;
    }
  }
  return bestKey;
}

// ---------- SwatchCell -------------------------------------------------------

const COLOR_SLOT_LABELS = ['Menu Bar', 'Night Mode', 'Normal Nav', 'Night Mode Nav'] as const;

type SwatchCellProps = {
  swatch: MineralSwatch;
  selected: boolean;
  onSelect: (key: string) => void;
};

function SwatchCell({ swatch, selected, onSelect }: SwatchCellProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 14, stiffness: 280, mass: 0.5 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 280, mass: 0.5 });
  }, [scale, selected]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(swatch.key);
    scale.value = withSpring(1.06, { damping: 14, stiffness: 280, mass: 0.5 });
  }, [swatch.key, onSelect, scale]);

  // Keep selected cells scaled up
  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 280, mass: 0.5 });
  }, [selected, scale]);

  return (
    <Pressable
      style={styles.swatchCell}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={animatedStyle}>
        {/* Selection ring (outer) */}
        <View
          style={[
            styles.swatchRingOuter,
            selected && styles.swatchRingOuterSelected,
          ]}
        >
          {/* Circle */}
          <View
            style={[
              styles.swatchCircle,
              { backgroundColor: swatch.hex },
              !selected && styles.swatchCircleBorder,
            ]}
          />
        </View>
      </Animated.View>
      <Text style={styles.swatchLabel}>{swatch.label}</Text>
    </Pressable>
  );
}

// ---------- Component --------------------------------------------------------

export default function ColorPickerModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string }>();
  const slotIdx = clampSlot(Number(params.slot ?? 0));

  const currentStored = useSettingsStore((s) => s.settings.colors[slotIdx]);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [selectedKey, setSelectedKey] = React.useState<string>(
    () => closestSwatch(currentStored),
  );

  const selectedSwatch = useMemo(
    () => SWATCHES.find((s) => s.key === selectedKey) ?? SWATCHES[0],
    [selectedKey],
  );

  // --- Actions ---------------------------------------------------------------

  const handleApply = useCallback(() => {
    const rgb = hexToRgb(selectedSwatch.hex);
    if (!rgb) return;
    const rgb565 = rgb888to565(rgb.r, rgb.g, rgb.b);
    const currentColors = useSettingsStore.getState().settings.colors;
    const next: [number, number, number, number] = [
      currentColors[0],
      currentColors[1],
      currentColors[2],
      currentColors[3],
    ];
    next[slotIdx] = rgb565;
    updateSetting('colors', next);
    void bleManager.writeColors(next).catch(() => {});
    router.back();
  }, [selectedSwatch, slotIdx, router, updateSetting]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // --- Render ----------------------------------------------------------------

  const rows: MineralSwatch[][] = [];
  for (let i = 0; i < SWATCHES.length; i += GRID_COLUMNS) {
    rows.push(SWATCHES.slice(i, i + GRID_COLUMNS));
  }

  return (
    <View style={styles.root}>
      <QBackground />
      <View style={styles.screen}>
        <GlassCard padding={spacing.md} style={styles.card}>
          <Text style={styles.title}>{COLOR_SLOT_LABELS[slotIdx]}</Text>

          {/* Preview bar */}
          <View style={styles.previewBlock}>
            <View
              style={[styles.previewBar, { backgroundColor: selectedSwatch.hex }]}
            />
            <Text style={styles.previewCaption}>
              {'PREVIEW — ' + COLOR_SLOT_LABELS[slotIdx].toUpperCase()}
            </Text>
          </View>

          {/* Swatch grid */}
          <View style={styles.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map((swatch) => (
                  <SwatchCell
                    key={swatch.key}
                    swatch={swatch}
                    selected={swatch.key === selectedKey}
                    onSelect={setSelectedKey}
                  />
                ))}
                {/* Pad last row if fewer than GRID_COLUMNS */}
                {row.length < GRID_COLUMNS &&
                  Array.from({ length: GRID_COLUMNS - row.length }).map((_, pi) => (
                    <View key={`pad-${pi}`} style={styles.swatchCell} />
                  ))}
              </View>
            ))}
          </View>

          <View style={styles.btnRow}>
            <ChromeButton
              label="Cancel"
              variant="ghost"
              onPress={handleCancel}
              style={styles.btnHalf}
            />
            <ChromeButton
              label="Apply"
              variant="secondary"
              onPress={handleApply}
              style={styles.btnHalf}
            />
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

// ---------- styles -----------------------------------------------------------

const SWATCH_SIZE = 60;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
  },
  title: {
    ...fonts.h2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  // Preview bar
  previewBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewBar: {
    width: 144,
    height: 32,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  previewCaption: {
    ...fonts.labelCaps,
    color: colors.boneGhost,
  },

  // Grid
  grid: {
    marginBottom: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  swatchCell: {
    alignItems: 'center',
    flex: 1,
  },

  // Ring outer — selected gets firedAmber ring, unselected transparent
  swatchRingOuter: {
    width: SWATCH_SIZE + 6,
    height: SWATCH_SIZE + 6,
    borderRadius: (SWATCH_SIZE + 6) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  swatchRingOuterSelected: {
    borderColor: colors.firedAmber,
  },

  // Circle fill
  swatchCircle: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  swatchCircleBorder: {
    borderWidth: 1,
    borderColor: colors.boneGhost,
  },

  // Label below swatch
  swatchLabel: {
    ...fonts.labelCaps,
    color: colors.boneGhost,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1.6,
  },

  // Preserved style from prior pass (hexLabel role — kept for reference, used elsewhere if needed)
  hexLabel: {
    ...fonts.labelCaps,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnHalf: {
    flex: 1,
  },
});
