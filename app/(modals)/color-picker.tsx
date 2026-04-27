import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {
  ChromeButton,
  GlassCard,
  QBackground,
  SkeuSlider,
} from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { rgb565to888, rgb888to565 } from '../../src/ble/DabRiteProtocol';
import { useSettingsStore } from '../../src/state/settingsStore';
import { bleManager } from '../../src/ble/BleManager';

const COLOR_SLOT_LABELS = ['Menu Bar', 'Night Mode', 'Normal Nav', 'Night Mode Nav'] as const;

// ---------- HSL <-> RGB --------------------------------------------------

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h / 60) % 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1)      { r1 = c; g1 = x; b1 = 0; }
  else if (hp < 2) { r1 = x; g1 = c; b1 = 0; }
  else if (hp < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (hp < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (hp < 5) { r1 = x; g1 = 0; b1 = c; }
  else             { r1 = c; g1 = 0; b1 = x; }
  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      case bn: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const n = parseInt(cleaned, 16);
  return { r: (n >> 16) & 0xFF, g: (n >> 8) & 0xFF, b: n & 0xFF };
}

// ---------- Component ----------------------------------------------------

const HUE_STOPS = [
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#FF00FF',
  '#FF0000',
] as const;

const PLANE_HEIGHT = 180;

export default function ColorPickerModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string }>();
  const slotIdx = clampSlot(Number(params.slot ?? 0));

  const currentStored = useSettingsStore((s) => s.settings.colors[slotIdx]);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  // Derive initial HSL from stored RGB565.
  const initial = useMemo(() => {
    const { r, g, b } = rgb565to888(currentStored);
    const { h, s } = rgbToHsl(r, g, b);
    return { h, s };
  }, [currentStored]);

  const initialBrightness = useMemo(() => {
    const { r, g, b } = rgb565to888(currentStored);
    const { l } = rgbToHsl(r, g, b);
    return Math.round(l * 100);
  }, [currentStored]);

  const [hue, setHue] = useState(initial.h); // 0..360
  const [sat, setSat] = useState(initial.s); // 0..1 (we'll reuse as vertical axis)
  const [brightness, setBrightness] = useState(initialBrightness); // 0..100
  const [hexInput, setHexInput] = useState(() => {
    const { r, g, b } = rgb565to888(currentStored);
    return rgbToHex(r, g, b);
  });

  // Live RGB from HSL
  const rgb = useMemo(() => {
    // We interpret the plane's Y axis as lightness (top=light, bottom=dark),
    // overridden by the brightness slider for final lightness.
    return hslToRgb(hue, clamp01(sat), brightness / 100);
  }, [hue, sat, brightness]);

  const rgb565 = useMemo(() => rgb888to565(rgb.r, rgb.g, rgb.b), [rgb]);
  const quantized = useMemo(() => rgb565to888(rgb565), [rgb565]);
  const hexDisplay = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb]);

  // Keep hex input text in sync when user drags the plane / slider.
  useEffect(() => {
    setHexInput(hexDisplay);
  }, [hexDisplay]);

  const handleHexChange = useCallback((text: string) => {
    setHexInput(text);
    const parsed = hexToRgb(text);
    if (parsed) {
      const { h, s, l } = rgbToHsl(parsed.r, parsed.g, parsed.b);
      setHue(h);
      setSat(s);
      setBrightness(Math.round(l * 100));
    }
  }, []);

  // --- Plane gesture -------------------------------------------------------
  const [planeSize, setPlaneSize] = useState({ w: 0, h: PLANE_HEIGHT });
  const planeX = useSharedValue(0);
  const planeY = useSharedValue(0);

  const onPlaneLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPlaneSize({ w: width, h: height });
    planeX.value = (hue / 360) * width;
    planeY.value = (1 - clamp01(sat)) * height;
  }, [hue, sat, planeX, planeY]);

  useEffect(() => {
    if (planeSize.w === 0) return;
    planeX.value = (hue / 360) * planeSize.w;
    planeY.value = (1 - clamp01(sat)) * planeSize.h;
  }, [hue, sat, planeSize, planeX, planeY]);

  const commitPlane = useCallback((x: number, y: number) => {
    if (planeSize.w === 0) return;
    const h = clamp(x / planeSize.w, 0, 1) * 360;
    const s = 1 - clamp(y / planeSize.h, 0, 1);
    setHue(h);
    setSat(s);
  }, [planeSize]);

  const planePan = Gesture.Pan()
    .onBegin((e) => {
      planeX.value = clamp(e.x, 0, planeSize.w);
      planeY.value = clamp(e.y, 0, planeSize.h);
      runOnJS(commitPlane)(planeX.value, planeY.value);
    })
    .onUpdate((e) => {
      planeX.value = clamp(e.x, 0, planeSize.w);
      planeY.value = clamp(e.y, 0, planeSize.h);
      runOnJS(commitPlane)(planeX.value, planeY.value);
    });

  const planeTap = Gesture.Tap().onEnd((e) => {
    planeX.value = clamp(e.x, 0, planeSize.w);
    planeY.value = clamp(e.y, 0, planeSize.h);
    runOnJS(commitPlane)(planeX.value, planeY.value);
  });

  const planeGesture = Gesture.Race(planePan, planeTap);

  const cursorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: planeX.value - 10 },
      { translateY: planeY.value - 10 },
    ],
  }));

  // --- Actions -------------------------------------------------------------

  const handleApply = useCallback(() => {
    const currentColors = useSettingsStore.getState().settings.colors;
    const next: [number, number, number, number] = [
      currentColors[0],
      currentColors[1],
      currentColors[2],
      currentColors[3],
    ];
    next[slotIdx] = rgb565;
    updateSetting('colors', next);
    // Fire-and-forget color write to device so it takes effect immediately.
    void bleManager.writeColors(next).catch(() => {});
    router.back();
  }, [rgb565, slotIdx, router, updateSetting]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const livePreviewCss = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const quantizedCss = `rgb(${quantized.r}, ${quantized.g}, ${quantized.b})`;

  return (
    <View style={styles.root}>
      <QBackground />
      <View style={styles.screen}>
        <GlassCard padding={spacing.md} style={styles.card}>
          <Text style={styles.title}>{COLOR_SLOT_LABELS[slotIdx]}</Text>

          {/* Hue/saturation plane */}
          <GestureDetector gesture={planeGesture}>
            <View style={styles.plane} onLayout={onPlaneLayout}>
              {/* Horizontal hue gradient */}
              <LinearGradient
                colors={HUE_STOPS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Vertical lightness overlay */}
              <LinearGradient
                colors={['rgba(244,237,228,1)', 'rgba(244,237,228,0)', 'rgba(5,4,3,1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.cursor, cursorStyle]} pointerEvents="none" />
            </View>
          </GestureDetector>

          {/* Brightness slider */}
          <View style={styles.sliderWrap}>
            <SkeuSlider
              label="Brightness"
              value={brightness}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => setBrightness(Math.round(v))}
              unit="%"
            />
          </View>

          {/* Hex input + preview */}
          <View style={styles.previewRow}>
            <View style={styles.hexWrap}>
              <Text style={styles.hexLabel}>HEX</Text>
              <TextInput
                value={hexInput}
                onChangeText={handleHexChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                style={styles.hexInput}
                placeholder="#RRGGBB"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={styles.swatchCol}>
              <View style={[styles.previewSwatch, { backgroundColor: livePreviewCss }]} />
              <Text style={styles.previewCaption}>Live</Text>
            </View>
            <View style={styles.swatchCol}>
              <View style={[styles.previewSwatch, { backgroundColor: quantizedCss }]} />
              <Text style={styles.previewCaption}>
                0x{rgb565.toString(16).toUpperCase().padStart(4, '0')}
              </Text>
            </View>
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
              variant="primary"
              onPress={handleApply}
              style={styles.btnHalf}
            />
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

// ---------- helpers ------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

function clampSlot(n: number): 0 | 1 | 2 | 3 {
  if (!Number.isFinite(n)) return 0;
  const i = Math.max(0, Math.min(3, Math.floor(n)));
  return i as 0 | 1 | 2 | 3;
}

// ---------- styles -------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050403' },
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
  plane: {
    width: '100%',
    height: PLANE_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.crystalEdge,
    backgroundColor: colors.bgDeep,
  },
  cursor: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.bone100,
    backgroundColor: 'transparent',
    shadowColor: 'rgba(5,4,3,0.9)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  sliderWrap: {
    marginTop: spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  hexWrap: {
    flex: 1,
  },
  hexLabel: {
    ...fonts.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  hexInput: {
    backgroundColor: 'rgba(5,4,3,0.35)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.crystalEdge,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  swatchCol: {
    alignItems: 'center',
  },
  previewSwatch: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.crystalEdge,
    marginBottom: spacing.xs,
  },
  previewCaption: {
    ...fonts.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnHalf: {
    flex: 1,
  },
});
