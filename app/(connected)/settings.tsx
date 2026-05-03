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
  FloatingHeader,
  QBackground,
  SkeuSlider,
  toast,
} from '../../src/design';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useBleStore } from '../../src/state/bleStore';
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
  const connectionState = useBleStore((s) => s.connectionState);
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
      toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
        retryLabel: 'Retry',
        onRetry: () => { void flushWrite(next); },
      });
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
    if (status === 'synced') return 'SYNCED';
    if (status === 'pending') return 'PENDING';
    return 'ERROR';
  }, [status]);

  const statusColor = useMemo(() => {
    if (status === 'synced') return colors.success;
    if (status === 'pending') return colors.bone50;
    return colors.error;
  }, [status]);

  return (
    <View style={styles.root}>
      <QBackground />
      <FloatingHeader connectionState={connectionState} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Device Config</Text>
        <Text style={styles.screenSubtitle}>Calibrate your rig parameters.</Text>

        {/* LCD COLORS */}
        <Text style={styles.sectionHeading}>LCD COLORS</Text>
        <View style={styles.section}>
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
        </View>

        <View style={styles.sectionDivider} />

        {/* TEMPERATURE */}
        <Text style={styles.sectionHeading}>TEMPERATURE</Text>
        <View style={styles.section}>
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
        </View>

        <View style={styles.sectionDivider} />

        {/* DEVICE CONFIG */}
        <Text style={styles.sectionHeading}>DEVICE CONFIG</Text>
        <View style={styles.section}>
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
        </View>

        <View style={styles.sectionDivider} />

        {/* SOUND */}
        <Text style={styles.sectionHeading}>SOUND</Text>
        <View style={styles.section}>
          <SkeuSlider
            label={`Volume: Level ${settings.volume}`}
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
        </View>

        <View style={styles.sectionDivider} />

        {/* PHONE ALERTS */}
        <Text style={styles.sectionHeading}>PHONE ALERTS</Text>
        <View style={styles.section}>
          <ChromeButton
            label="Configure Phone Alerts"
            variant="secondary"
            onPress={() => router.push('/(modals)/notification-config')}
          />
        </View>

        {/* SAVE */}
        <View style={styles.saveRow}>
          <ChromeButton
            label="Save to Device"
            variant="secondary"
            onPress={handleSaveNow}
            style={styles.saveBtn}
          />
          <View style={styles.statusRow}>
            <View style={[styles.stateDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: 88,
    paddingBottom: 120,
  },
  screenTitle: {
    ...fonts.h1,
    color: colors.onSurface,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
    marginBottom: 32,
  },
  sectionHeading: {
    ...fonts.labelCaps,
    color: colors.boneGhost,
    marginBottom: 12,
  },
  section: {
    backgroundColor: colors.surface3,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(109,96,80,0.15)',
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(109,96,80,0.2)',
    marginBottom: spacing.lg,
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
    color: colors.onSurface,
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
    color: colors.onSurface,
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
    ...fonts.labelCaps,
    color: colors.onSurfaceVariant,
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
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  segmentActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.bone35,
  },
  segmentText: {
    ...fonts.caption,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.bone100,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...fonts.labelCaps,
  },
});
