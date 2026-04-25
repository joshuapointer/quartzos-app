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

import {
  ChromeButton,
  CrystalToggle,
  GlassCard,
  QuartzBackground,
  SkeuSlider,
} from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { useSettingsStore } from '../../src/state/settingsStore';
import { bleManager } from '../../src/ble/BleManager';
import { rgb565to888 } from '../../src/ble/DabRiteProtocol';
import type { DeviceSettings } from '../../src/ble/types';
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
} from '../../src/ble/constants';
import { cToF, fToC } from '../../src/utils/temperature';

const COLOR_SLOT_LABELS = ['Menu Bar', 'Night Mode', 'Normal Nav', 'Night Mode Nav'] as const;

type WriteStatus = 'synced' | 'pending' | 'error';

function rgb565ToCss(value: number): string {
  const { r, g, b } = rgb565to888(value);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const dirty = useSettingsStore((s) => s.dirty);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const markConfirmed = useSettingsStore((s) => s.markConfirmed);

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
    if (status === 'pending') return colors.activeAmber;
    return colors.alertRed;
  }, [status]);

  return (
    <QuartzBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* DISPLAY COLORS */}
        <GlassCard style={styles.card} padding={spacing.md}>
          <Text style={styles.sectionTitle}>Display Colors</Text>
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
                <Text style={styles.swatchLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* TEMPERATURES */}
        <GlassCard style={styles.card} padding={spacing.md}>
          <Text style={styles.sectionTitle}>Temperatures</Text>
          <SkeuSlider
            label="Dab Alarm"
            value={dabAlarmDisplay}
            min={dabMin}
            max={dabMax}
            step={useCelsius ? 1 : 5}
            onValueChange={onChangeDab}
            unit={useCelsius ? '°C' : '°F'}
            style={styles.slider}
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
          />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>°F / °C</Text>
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

        {/* DEVICE CONFIG */}
        <GlassCard style={styles.card} padding={spacing.md}>
          <Text style={styles.sectionTitle}>Device Config</Text>
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
          <Text style={styles.sectionTitle}>Sound</Text>
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

        {/* PHONE ALERTS */}
        <GlassCard style={styles.card} padding={spacing.md}>
          <Text style={styles.sectionTitle}>Phone Alerts</Text>
          <ChromeButton
            label="Configure Phone Alerts"
            variant="secondary"
            onPress={() => router.push('/(modals)/notification-config')}
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
      </ScrollView>
    </QuartzBackground>
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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
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
  return (
    <View style={styles.segmentedWrap}>
      <Text style={styles.segmentedLabel}>{label}</Text>
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
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...fonts.h1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...fonts.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
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
    borderColor: colors.crystalEdge,
    marginBottom: spacing.sm,
  },
  swatchLabel: {
    ...fonts.caption,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
    color: colors.textSecondary,
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
    borderColor: colors.crystalEdge,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segmentActive: {
    backgroundColor: 'rgba(255,169,60,0.35)',
    borderColor: colors.activeAmber,
  },
  segmentText: {
    ...fonts.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.textPrimary,
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
});
