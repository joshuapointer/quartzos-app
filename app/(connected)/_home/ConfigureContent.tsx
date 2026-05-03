import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../../src/design/tokens';
import { SurfaceCard } from '../../../src/design/components/SurfaceCard';
import { toast } from '../../../src/design/components/Toast';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { formatTemp, fToC, cToF } from '../../../src/utils/temperature';
import { bleManager } from '../../../src/ble/BleManager';
import type { DeviceSettings } from '../../../src/ble/types';
import {
  SETTINGS_WRITE_DEBOUNCE_MS,
  QUARTZ_DAB_ALARM_F,
  QUARTZ_DUNK_ALARM_F,
  OPAQUE_DAB_ALARM_F,
  OPAQUE_DUNK_ALARM_F,
  DAB_SOUND_LABELS,
  DUNK_SOUND_LABELS,
  KEY_TONE_LABELS,
} from '../../../src/ble/constants';
import { Toggle } from './components/Toggle';

// ─── TempSlider ───────────────────────────────────────────────────────────────

function TempSlider({
  label, value, min, max, accent, useCelsius, onChange,
}: {
  label: string; value: number; min: number; max: number;
  accent: string; useCelsius: boolean; onChange: (v: number) => void;
}) {
  const progress = (value - min) / (max - min);

  const handleDecrease = () => {
    const step = useCelsius ? cToF(fToC(value) - 5) : value - 5;
    onChange(Math.max(min, step));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleIncrease = () => {
    const step = useCelsius ? cToF(fToC(value) + 5) : value + 5;
    onChange(Math.min(max, step));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color: accent }]}>{formatTemp(value, useCelsius)}</Text>
      </View>
      <View style={styles.sliderTrackRow}>
        <TouchableOpacity onPress={handleDecrease} style={styles.sliderBtn}>
          <Text style={[styles.sliderBtnText, { color: accent }]}>−</Text>
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <TouchableOpacity onPress={handleIncrease} style={styles.sliderBtn}>
          <Text style={[styles.sliderBtnText, { color: accent }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SimpleSlider ─────────────────────────────────────────────────────────────

function SimpleSlider({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step}
            onPress={() => { onChange(step); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.stepPip, value === step && styles.stepPipActive]}
          >
            <Text style={[styles.stepPipText, value === step && styles.stepPipTextActive]}>{step}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── SoundRow ─────────────────────────────────────────────────────────────────

function SoundRow({
  label, value, options, onChange,
}: {
  label: string; value: number; options: readonly string[]; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.soundRow}>
      <Text style={styles.soundRowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundPills}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => { onChange(idx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.soundPill, value === idx && styles.soundPillActive]}
          >
            <Text style={[styles.soundPillText, value === idx && styles.soundPillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── ConfigSection ────────────────────────────────────────────────────────────

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.configSection}>
      <Text style={styles.configSectionTitle}>{title}</Text>
      <SurfaceCard borderRadius={16} contentStyle={styles.configCardContent}>
        {children}
      </SurfaceCard>
    </View>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({
  label, value, onChange, last,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleRowLabel}>{label}</Text>
        <Toggle value={value} onChange={onChange} />
      </View>
      {!last && <View style={styles.hairline} />}
    </>
  );
}

// ─── ConfigureContent ─────────────────────────────────────────────────────────

export function ConfigureContent({
  settings,
  updateSetting,
  dirty,
  markConfirmed,
  writeDebounceRef,
}: {
  settings: DeviceSettings;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  dirty: boolean;
  markConfirmed: () => void;
  writeDebounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const syncedScale = useSharedValue(dirty ? 0 : 1);
  const syncedAnimStyle = useAnimatedStyle(() => ({
    opacity: syncedScale.value,
    transform: [{ scale: 0.72 + syncedScale.value * 0.28 }],
  }));

  useEffect(() => {
    if (!dirty) {
      syncedScale.value = 0;
      syncedScale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.6 });
    }
  }, [dirty, syncedScale]);

  useEffect(() => {
    return () => { if (writeDebounceRef.current) clearTimeout(writeDebounceRef.current); };
  }, []);

  const handleUpdate = useCallback(
    <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => {
      updateSetting(key, val);
      if (writeDebounceRef.current) clearTimeout(writeDebounceRef.current);
      writeDebounceRef.current = setTimeout(() => {
        const fresh = useSettingsStore.getState().settings;
        const next = { ...fresh, [key]: val };
        bleManager.writeSettings(next).catch(() => {
          toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
            retryLabel: 'Retry',
            onRetry: () => { void bleManager.writeSettings(next).catch(() => {}); },
          });
        });
      }, SETTINGS_WRITE_DEBOUNCE_MS);
    },
    [updateSetting],
  );

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bleManager.writeSettings(settings);
      markConfirmed();
    } catch {
      setSaveError("Couldn't save — is the device connected?");
      // Capture the snapshot used for this attempt so a Retry tap fires
      // the same write rather than picking up later edits.
      const retrySettings = settings;
      toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
        retryLabel: 'Retry',
        onRetry: () => { void bleManager.writeSettings(retrySettings).catch(() => {}); },
      });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, settings, markConfirmed]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.panelScroll, { paddingBottom: 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Configure</Text>
        </View>

        <ConfigSection title="Temperatures">
          <TempSlider
            label="Dab alarm" value={settings.dabAlarmF}
            min={400} max={700} accent={colors.emberBright} useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dabAlarmF', v)}
          />
          <View style={styles.hairline} />
          <TempSlider
            label="Dunk alarm" value={settings.dunkAlarmF}
            min={150} max={400} accent={colors.quartzBright} useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dunkAlarmF', v)}
          />
          <View style={styles.hairline} />
          <ToggleRow
            label="Display in °C" value={settings.useCelsius}
            onChange={(v) => handleUpdate('useCelsius', v)}
          />
          <View style={styles.hairline} />
          <View style={styles.defaultsRow}>
            <TouchableOpacity
              onPress={() => {
                handleUpdate('dabAlarmF', QUARTZ_DAB_ALARM_F);
                handleUpdate('dunkAlarmF', QUARTZ_DUNK_ALARM_F);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Quartz defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleUpdate('dabAlarmF', OPAQUE_DAB_ALARM_F);
                handleUpdate('dunkAlarmF', OPAQUE_DUNK_ALARM_F);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Opaque defaults</Text>
            </TouchableOpacity>
          </View>
        </ConfigSection>

        <ConfigSection title="Device">
          <ToggleRow label="Opaque mode" value={settings.opaqueMode} onChange={(v) => handleUpdate('opaqueMode', v)} />
          <ToggleRow label="Sound alert" value={settings.soundAlert} onChange={(v) => handleUpdate('soundAlert', v)} />
          <ToggleRow label="Light alert" value={settings.lightAlert} onChange={(v) => handleUpdate('lightAlert', v)} />
          <ToggleRow label="LED guide" value={settings.ledGuide} onChange={(v) => handleUpdate('ledGuide', v)} />
          <ToggleRow label="Night mode" value={settings.nightMode} onChange={(v) => handleUpdate('nightMode', v)} last />
        </ConfigSection>

        <ConfigSection title="Sound">
          <SimpleSlider
            label="Volume" value={settings.volume} min={1} max={5}
            onChange={(v) => handleUpdate('volume', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Key tone" value={settings.keyTone}
            options={KEY_TONE_LABELS} onChange={(v) => handleUpdate('keyTone', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dab sound" value={settings.dabSound}
            options={DAB_SOUND_LABELS} onChange={(v) => handleUpdate('dabSound', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dunk sound" value={settings.dunkSound}
            options={DUNK_SOUND_LABELS} onChange={(v) => handleUpdate('dunkSound', v)}
          />
        </ConfigSection>
      </ScrollView>

      {/* Save bar — sits at the bottom of the panel */}
      <View style={styles.saveBarOuter}>
        {saveError !== null && (
          <View style={[styles.applyErrorToast, { marginBottom: 8 }]}>
            <Text style={styles.applyErrorText}>{saveError}</Text>
            <TouchableOpacity onPress={() => setSaveError(null)} style={styles.applyErrorDismiss}>
              <Text style={styles.applyErrorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBarBtn} disabled={isSaving}>
          <LinearGradient
            colors={dirty ? [colors.emberBright, colors.ember] : [colors.surface4, colors.surface3]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBarGradient}
          >
            {dirty ? (
              isSaving ? (
                <ActivityIndicator size="small" color={colors.bone100} />
              ) : (
                <Text style={styles.saveBarText}>Save to device</Text>
              )
            ) : (
              <Animated.View style={[styles.syncedRow, syncedAnimStyle]}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Path d="M2 7 L5.5 10.5 L12 4" stroke={colors.bone50} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.syncedText}>SYNCED</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 0,
  },
  panelTitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 34,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.68,
  },
  configSection: {
    marginBottom: 28,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.bone50,
    marginBottom: 8,
    marginLeft: 0,
  },
  configCardContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  hairline: {
    height: 0.5,
    backgroundColor: colors.bone100 + '0F',
  },
  sliderRow: { paddingVertical: 14 },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 16,
    color: colors.bone90,
    fontWeight: '400',
  },
  sliderValue: {
    fontFamily: 'GeistMono_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sliderTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderBtn: {
    width: 28,
    height: 28,
    borderRadius: 100,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '300',
  },
  sliderTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surface4,
    borderRadius: 100,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 100,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRowLabel: {
    fontSize: 15,
    color: colors.bone90,
    fontWeight: '400',
  },
  defaultsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  defaultsBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  defaultsBtnText: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  stepPip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPipActive: {
    borderColor: colors.ember,
    backgroundColor: 'rgba(201,115,38,0.15)',
  },
  stepPipText: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '400',
  },
  stepPipTextActive: {
    color: colors.emberBright,
    fontWeight: '500',
  },
  soundRow: { paddingVertical: 12 },
  soundRowLabel: {
    fontSize: 16,
    color: colors.bone90,
    fontWeight: '400',
    marginBottom: 8,
  },
  soundPills: {
    flexDirection: 'row',
    gap: 6,
  },
  soundPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 36,
    borderRadius: 100,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.bone100 + '0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundPillActive: {
    borderColor: colors.ember,
    backgroundColor: 'rgba(201,115,38,0.12)',
  },
  soundPillText: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.2,
  },
  soundPillTextActive: {
    color: colors.emberBright,
    fontWeight: '500',
  },
  saveBarOuter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  saveBarBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.voidObsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBarGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveBarText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.bone100,
    letterSpacing: 0.4,
  },
  syncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    color: colors.bone50,
  },
  applyErrorToast: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.error,
    marginBottom: 8,
  },
  applyErrorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '400',
    flex: 1,
  },
  applyErrorDismiss: {
    paddingLeft: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyErrorDismissText: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
