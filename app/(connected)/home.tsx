import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { toast } from '../../src/design/components/Toast';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import * as moltenRecentsDb from '../../src/db/moltenRecents';
import type { Preset } from '../../src/db/presets';
import type { MoltenRecent } from '../../src/db/moltenRecents';

import DwmFlow from '../../src/dwm/flow/DwmFlow';

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  // ── Stores ────────────────────────────────────────────────────────────────
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const activePresetId = useSettingsStore((s) => s.activePresetId);
  const setActivePresetId = useSettingsStore((s) => s.setActivePresetId);
  const sessionActive = useSessionStore((s) => s.active);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<Preset[]>([]);
  const [moltenRecents, setMoltenRecents] = useState<MoltenRecent[]>([]);
  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryInFlightRef = useRef<Promise<void> | null>(null);

  const refreshMoltenRecents = useCallback(() => {
    moltenRecentsDb.getRecent(4).then(setMoltenRecents).catch(() => {});
  }, []);

  useEffect(() => {
    presetsDb.getAll().then(setPresets).catch(() => {});
    refreshMoltenRecents();
  }, [refreshMoltenRecents]);

  // Refresh recents whenever a session ends
  useEffect(() => {
    if (sessionActive) return;
    refreshMoltenRecents();
    const t = setTimeout(() => {
      refreshMoltenRecents();
    }, 600);
    return () => clearTimeout(t);
  }, [sessionActive, refreshMoltenRecents]);

  // ── Preset apply ──────────────────────────────────────────────────────────
  const handleApplyPreset = useCallback(
    async (presetId: string): Promise<void> => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return;

      if (writeDebounceRef.current !== null) {
        clearTimeout(writeDebounceRef.current);
        writeDebounceRef.current = null;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await bleManager.writeSettings(preset.settings);
      } catch {
        toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
          retryLabel: 'Retry',
          onRetry: () => {
            if (retryInFlightRef.current) return;
            retryInFlightRef.current = handleApplyPreset(presetId)
              .catch(() => { /* toast already shown by inner failure */ })
              .finally(() => { retryInFlightRef.current = null; });
            void retryInFlightRef.current;
          },
        });
        throw new Error('write failed');
      }
      setActivePresetId(preset.id);
      updateSetting('dabAlarmF', preset.settings.dabAlarmF);
      updateSetting('dunkAlarmF', preset.settings.dunkAlarmF);
    },
    [presets, setActivePresetId, updateSetting],
  );

  // Siri / Shortcut deep-link entry
  const { applyPreset: applyPresetParam } = useLocalSearchParams<{ applyPreset?: string }>();
  const appliedPresetIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!applyPresetParam) return;
    if (appliedPresetIdsRef.current.has(applyPresetParam)) {
      router.setParams({ applyPreset: undefined });
      return;
    }
    if (presets.length === 0) return;
    appliedPresetIdsRef.current.add(applyPresetParam);
    router.setParams({ applyPreset: undefined });
    const target = presets.find((p) => p.id === applyPresetParam);
    if (!target) return;
    void handleApplyPreset(target.id).catch(() => { /* toast already shown */ });
  }, [applyPresetParam, presets, handleApplyPreset]);

  // Clear activePresetId when live settings drift from preset
  useEffect(() => {
    if (!activePresetId) return;
    const active = presets.find((p) => p.id === activePresetId);
    if (!active) return;
    const a = active.settings;
    const b = settings;
    const colorsEq =
      a.colors[0] === b.colors[0] &&
      a.colors[1] === b.colors[1] &&
      a.colors[2] === b.colors[2] &&
      a.colors[3] === b.colors[3];
    const equal =
      colorsEq &&
      a.dabAlarmF === b.dabAlarmF &&
      a.dunkAlarmF === b.dunkAlarmF &&
      a.useCelsius === b.useCelsius &&
      a.opaqueMode === b.opaqueMode &&
      a.soundAlert === b.soundAlert &&
      a.lightAlert === b.lightAlert &&
      a.ledGuide === b.ledGuide &&
      a.nightMode === b.nightMode &&
      a.volume === b.volume &&
      a.keyTone === b.keyTone &&
      a.dabSound === b.dabSound &&
      a.dunkSound === b.dunkSound;
    if (!equal) setActivePresetId(null);
  }, [settings, presets, activePresetId, setActivePresetId]);

  return (
    <DwmFlow
      presets={presets}
      recents={moltenRecents}
      onApplyPreset={handleApplyPreset}
    />
  );
}
