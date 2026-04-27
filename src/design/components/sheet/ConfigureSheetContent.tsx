import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '../GlassCard';
import { ChromeButton } from '../ChromeButton';
import { CrystalToggle } from '../CrystalToggle';
import { SkeuSlider } from '../SkeuSlider';
import { ThemePicker } from '../ThemePicker';
import { useThemeColors } from '../../ThemeContext';
import { colors, fonts, radius, spacing } from '../../tokens';
import { useSettingsStore } from '../../../state/settingsStore';
import { useDabPreferencesStore } from '../../../state/dabPreferencesStore';
import { SENSORS } from '../../../data/sensors';
import { WALL_THICKNESSES } from '../../../data/wallThicknesses';
import type { SensorMethod } from '../../../data/sensors';
import type { WallThicknessId } from '../../../data/wallThicknesses';
import { bleManager } from '../../../ble/BleManager';
import { rgb565to888 } from '../../../ble/DabRiteProtocol';
import type { DeviceSettings } from '../../../ble/types';
import {
  DAB_SOUND_LABELS,
  DUNK_SOUND_LABELS,
  KEY_TONE_LABELS,
  OPAQUE_DAB_ALARM_F,
  OPAQUE_DUNK_ALARM_F,
  QUARTZ_DAB_ALARM_F,
  QUARTZ_DUNK_ALARM_F,
  SETTINGS_WRITE_DEBOUNCE_MS,
  OPAQUE_MODE_ALARM_DELAY_MS,
} from '../../../ble/constants';
import { cToF, fToC } from '../../../utils/temperature';

const COLOR_SLOT_LABELS = ['Menu Bar', 'Night Mode', 'Normal Nav', 'Night Mode Nav'] as const;

type WriteStatus = 'synced' | 'pending' | 'error';

function rgb565ToCss(value: number): string {
  const { r, g, b } = rgb565to888(value);
  return `rgb(${r}, ${g}, ${b})`;
}

export function ConfigureSheetContent({
  onOpenReference,
}: {
  onOpenReference?: () => void;
}) {
  const router = useRouter();
  const theme = useThemeColors();

  const settings = useSettingsStore((s) => s.settings);
  const dirty = useSettingsStore((s) => s.dirty);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const markConfirmed = useSettingsStore((s) => s.markConfirmed);
  const themeName = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const preferredSensor = useDabPreferencesStore((s) => s.preferredSensor);
  const preferredWall = useDabPreferencesStore((s) => s.preferredWall);
  const coldStartByDefault = useDabPreferencesStore((s) => s.coldStartByDefault);
  const setPreferredSensor = useDabPreferencesStore((s) => s.setPreferredSensor);
  const setPreferredWall = useDabPreferencesStore((s) => s.setPreferredWall);
  const setColdStartByDefault = useDabPreferencesStore((s) => s.setColdStartByDefault);

  const [status, setStatus] = useState<WriteStatus>('synced');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opaqueFollowupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushWrite = useCallback(async (next: DeviceSettings) => {
    setStatus('pending');
    try {
      await bleManager.writeSettings(next);
      markConfirmed();
      setStatus('synced');
    } catch {
      setStatus('error');
    }
  }, [markConfirmed]);

  // Debounce writes when settings become dirty.
  useEffect(() => {
    if (!dirty) return;
    setStatus('pending');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void flushWrite(useSettingsStore.getState().settings);
    }, SETTINGS_WRITE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [dirty, settings, flushWrite]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (opaqueFollowupRef.current) clearTimeout(opaqueFollowupRef.current);
    };
  }, []);

  const handleSaveNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void flushWrite(useSettingsStore.getState().settings);
  }, [flushWrite]);

  const handleOpaqueToggle = useCallback((v: boolean) => {
    const current = useSettingsStore.getState().settings;
    const updated = { ...current, opaqueMode: v };
    updateSetting('opaqueMode', v);
    // Immediately flush the config change (cancel any pending debounce).
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void flushWrite(updated);
    // Schedule recommended alarm temps ~10s later.
    if (opaqueFollowupRef.current) clearTimeout(opaqueFollowupRef.current);
    opaqueFollowupRef.current = setTimeout(() => {
      opaqueFollowupRef.current = null;
      const dabF = v ? OPAQUE_DAB_ALARM_F : QUARTZ_DAB_ALARM_F;
      const dunkF = v ? OPAQUE_DUNK_ALARM_F : QUARTZ_DUNK_ALARM_F;
      updateSetting('dabAlarmF', dabF);
      updateSetting('dunkAlarmF', dunkF);
      // Let the dirty effect pick it up for debounced write.
    }, OPAQUE_MODE_ALARM_DELAY_MS);
  }, [flushWrite, updateSetting]);

  const applyQuartzDefaults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    updateSetting('dabAlarmF', QUARTZ_DAB_ALARM_F);
    updateSetting('dunkAlarmF', QUARTZ_DUNK_ALARM_F);
  }, [updateSetting]);

  const applyOpaqueDefaults = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    updateSetting('dabAlarmF', OPAQUE_DAB_ALARM_F);
    updateSetting('dunkAlarmF', OPAQUE_DUNK_ALARM_F);
  }, [updateSetting]);

  const openColorPicker = useCallback((slot: number) => {
    router.push({ pathname: '/(modals)/color-picker', params: { slot: String(slot) } });
  }, [router]);

  // --- temperature slider values in the selected unit ------------------------

  const useCelsius = settings.useCelsius;
  const dabAlarmDisplay = useCelsius ? fToC(settings.dabAlarmF) : settings.dabAlarmF;
  const dunkAlarmDisplay = useCelsius ? fToC(settings.dunkAlarmF) : settings.dunkAlarmF;

  const dabMin = useCelsius ? fToC(100) : 100;
  const dabMax = useCelsius ? fToC(900) : 900;
  const dunkMin = useCelsius ? fToC(100) : 100;
  const dunkMax = useCelsius ? fToC(settings.dabAlarmF - 10) : settings.dabAlarmF - 10;

  const onChangeDab = useCallback((v: number) => {
    const f = useCelsius ? cToF(v) : Math.round(v);
    updateSetting('dabAlarmF', f);
    // Keep dunk below dab.
    const curDunk = useSettingsStore.getState().settings.dunkAlarmF;
    if (curDunk > f - 10) updateSetting('dunkAlarmF', f - 10);
  }, [useCelsius, updateSetting]);

  const onChangeDunk = useCallback((v: number) => {
    const f = useCelsius ? cToF(v) : Math.round(v);
    updateSetting('dunkAlarmF', f);
  }, [useCelsius, updateSetting]);

  const onToggleCelsius = useCallback((v: boolean) => {
    updateSetting('useCelsius', v);
  }, [updateSetting]);

  const statusText = useMemo(() => {
    if (status === 'synced') return '✓ Synced';
    if (status === 'pending') return '⏳ Pending';
    return '✗ Error';
  }, [status]);

  const statusColor = useMemo(() => {
    if (status === 'synced') return colors.success;
    if (status === 'pending') return colors.warning;
    return colors.error;
  }, [status]);

  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, { color: theme.primary }],
    [theme.primary],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* DABBING DEFAULTS */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Dabbing Defaults</Text>
        <SensorPicker
          value={preferredSensor}
          onChange={setPreferredSensor}
        />
        <WallPicker
          value={preferredWall}
          onChange={setPreferredWall}
        />
        <ToggleRow
          label="Cold Start by Default"
          value={coldStartByDefault}
          onChange={setColdStartByDefault}
        />
      </GlassCard>

      {/* TEMPERATURES */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Temperatures</Text>
        <SkeuSlider
          label="Dab Alarm"
          value={dabAlarmDisplay}
          min={dabMin}
          max={dabMax}
          step={useCelsius ? 1 : 5}
          onValueChange={onChangeDab}
          unit={useCelsius ? '°C' : '°F'}
          style={styles.slider}
          variant="primary"
        />
        <SkeuSlider
          label="Dunk Alarm"
          value={dunkAlarmDisplay}
          min={dunkMin}
          max={dunkMax}
          step={useCelsius ? 1 : 5}
          onValueChange={onChangeDunk}
          unit={useCelsius ? '°C' : '°F'}
          style={styles.slider}
          variant="secondary"
        />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.onSurface }]}>°F / °C</Text>
          <CrystalToggle value={settings.useCelsius} onValueChange={onToggleCelsius} />
        </View>
        <View style={styles.btnRow}>
          <ChromeButton
            label="Quartz defaults"
            variant="secondary"
            onPress={applyQuartzDefaults}
            style={styles.btnHalf}
          />
          <ChromeButton
            label="Opaque defaults"
            variant="secondary"
            onPress={applyOpaqueDefaults}
            style={styles.btnHalf}
          />
        </View>
      </GlassCard>

      {/* DISPLAY COLORS */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Display Colors</Text>
        <View style={styles.swatchRow}>
          {COLOR_SLOT_LABELS.map((label, idx) => (
            <Pressable
              key={label}
              onPress={() => openColorPicker(idx)}
              style={styles.swatchCell}
              accessibilityLabel={`Edit ${label} color`}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: rgb565ToCss(settings.colors[idx]) },
                ]}
              />
              <Text style={[styles.swatchLabel, { color: theme.onSurface }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      {/* DEVICE */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Device</Text>
        <ToggleRow
          label="Opaque Mode"
          value={settings.opaqueMode}
          onChange={handleOpaqueToggle}
        />
        <ToggleRow
          label="Sound Alert"
          value={settings.soundAlert}
          onChange={(v) => updateSetting('soundAlert', v)}
        />
        <ToggleRow
          label="Light Alert"
          value={settings.lightAlert}
          onChange={(v) => updateSetting('lightAlert', v)}
        />
        <ToggleRow
          label="LED Guide"
          value={settings.ledGuide}
          onChange={(v) => updateSetting('ledGuide', v)}
        />
        <ToggleRow
          label="Night Mode"
          value={settings.nightMode}
          onChange={(v) => updateSetting('nightMode', v)}
        />
      </GlassCard>

      {/* SOUND */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Sound</Text>
        <SkeuSlider
          label={`Volume — Level ${settings.volume}`}
          value={settings.volume}
          min={1}
          max={3}
          step={1}
          onValueChange={(v) => updateSetting('volume', Math.round(v))}
          style={styles.slider}
        />
        <SegmentedPicker
          label="Key Tone"
          options={KEY_TONE_LABELS}
          value={settings.keyTone}
          onChange={(v) => updateSetting('keyTone', v)}
        />
        <SegmentedPicker
          label="Dab Sound"
          options={DAB_SOUND_LABELS}
          value={settings.dabSound}
          onChange={(v) => updateSetting('dabSound', v)}
        />
        <SegmentedPicker
          label="Dunk Sound"
          options={DUNK_SOUND_LABELS}
          value={settings.dunkSound}
          onChange={(v) => updateSetting('dunkSound', v)}
        />
      </GlassCard>

      {/* ALERTS */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Alerts</Text>
        <ChromeButton
          label="Configure Phone Alerts"
          variant="secondary"
          onPress={() => router.push('/(modals)/notification-config')}
        />
      </GlassCard>

      {/* APPEARANCE */}
      <GlassCard style={styles.card} padding={spacing.md}>
        <Text style={sectionTitleStyle}>Appearance</Text>
        <ThemePicker
          value={themeName}
          onChange={(t) => setTheme(t)}
        />
      </GlassCard>

      {/* SAVE */}
      <View style={styles.saveRow}>
        <ChromeButton
          label="Save to Device"
          onPress={handleSaveNow}
          style={styles.saveBtn}
        />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>

      {/* REFERENCE LINK */}
      {onOpenReference !== undefined && (
        <Pressable
          onPress={onOpenReference}
          style={styles.referenceLink}
          accessibilityRole="button"
          accessibilityLabel="Open calibration reference"
        >
          <Text style={[styles.referenceLinkText, { color: theme.onSurfaceVariant }]}>
            Calibration reference &amp; data sources
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.onSurface }]}>{label}</Text>
      <CrystalToggle value={value} onValueChange={onChange} />
    </View>
  );
}

function SegmentedPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: number;
  onChange: (v: number) => void;
}) {
  const theme = useThemeColors();
  return (
    <View style={styles.segmentedWrap}>
      <Text style={[styles.segmentedLabel, { color: theme.onSurfaceVariant }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentedScroll}
      >
        {options.map((opt, idx) => {
          const active = idx === value;
          return (
            <Pressable
              key={`${label}-${opt}-${idx}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(idx);
              }}
              style={[
                styles.segment,
                { borderColor: theme.glassBorder, backgroundColor: theme.glassFill },
                active && { backgroundColor: theme.primary + '33', borderColor: theme.primaryContainer },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[
                styles.segmentText,
                { color: theme.onSurfaceVariant },
                active && { color: theme.primary },
              ]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SensorPicker({
  value,
  onChange,
}: {
  value: SensorMethod;
  onChange: (s: SensorMethod) => void;
}) {
  const theme = useThemeColors();
  return (
    <View style={styles.segmentedWrap}>
      <Text style={[styles.segmentedLabel, { color: theme.onSurfaceVariant }]}>Sensor</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentedScroll}
      >
        {SENSORS.map((sensor) => {
          const active = sensor.method === value;
          return (
            <Pressable
              key={sensor.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(sensor.method);
              }}
              style={[
                styles.segment,
                { borderColor: theme.glassBorder, backgroundColor: theme.glassFill },
                active && { backgroundColor: theme.primary + '33', borderColor: theme.primaryContainer },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[
                styles.segmentText,
                { color: theme.onSurfaceVariant },
                active && { color: theme.primary },
              ]}>
                {sensor.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function WallPicker({
  value,
  onChange,
}: {
  value: WallThicknessId;
  onChange: (w: WallThicknessId) => void;
}) {
  const theme = useThemeColors();
  return (
    <View style={styles.segmentedWrap}>
      <Text style={[styles.segmentedLabel, { color: theme.onSurfaceVariant }]}>Wall Thickness</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentedScroll}
      >
        {WALL_THICKNESSES.map((wall) => {
          const active = wall.id === value;
          return (
            <Pressable
              key={wall.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(wall.id);
              }}
              style={[
                styles.segment,
                { borderColor: theme.glassBorder, backgroundColor: theme.glassFill },
                active && { backgroundColor: theme.primary + '33', borderColor: theme.primaryContainer },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[
                styles.segmentText,
                { color: theme.onSurfaceVariant },
                active && { color: theme.primary },
              ]}>
                {wall.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatchCell: {
    width: '46%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
  },
  swatchLabel: {
    ...fonts.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  slider: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...fonts.body,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnHalf: {
    flex: 1,
  },
  segmentedWrap: {
    marginBottom: spacing.md,
  },
  segmentedLabel: {
    ...fonts.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  segmentedScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  segmentText: {
    ...fonts.caption,
    fontWeight: '600',
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  saveBtn: {
    flex: 1,
  },
  statusText: {
    ...fonts.caption,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
  referenceLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  referenceLinkText: {
    ...fonts.caption,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
