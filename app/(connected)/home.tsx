import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { toast } from '../../src/design/components/Toast';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import * as sessionsDb from '../../src/db/sessions';
import * as moltenRecentsDb from '../../src/db/moltenRecents';
import type { Preset } from '../../src/db/presets';
import type { SessionRecord } from '../../src/db/sessions';
import type { MoltenRecent } from '../../src/db/moltenRecents';
import { BANGERS } from '../../src/data/bangers';
import { CONCENTRATES } from '../../src/data/concentrates';

import { MoltenSurface } from '../../src/molten/MoltenSurface';
import type {
  MoltenSurfacePreset,
  MoltenSurfaceRecent,
} from '../../src/molten/MoltenSurface';

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
  const [, setSessions] = useState<SessionRecord[]>([]);
  const [moltenRecents, setMoltenRecents] = useState<MoltenRecent[]>([]);
  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against re-entrant retries: if the user mashes the toast's
  // "Retry" button while a retry write is still in-flight, those taps
  // are no-ops. Otherwise N taps would queue N WRITE_ALL frames.
  const retryInFlightRef = useRef<Promise<void> | null>(null);

  const refreshSessions = useCallback(() => {
    sessionsDb.getAll().then(setSessions).catch(() => {});
  }, []);

  const refreshMoltenRecents = useCallback(() => {
    moltenRecentsDb.getRecent(4).then(setMoltenRecents).catch(() => {});
  }, []);

  useEffect(() => {
    presetsDb.getAll().then(setPresets).catch(() => {});
    refreshSessions();
    refreshMoltenRecents();
  }, [refreshSessions, refreshMoltenRecents]);

  // Refresh history whenever a session ends. BleManager flips active=false
  // BEFORE its async sessionsDb.end() write completes, so we refresh once
  // immediately (catches any prior writes) and again after a short delay
  // to read the just-persisted endedAt + peakTempF + samples.
  useEffect(() => {
    if (sessionActive) return;
    refreshSessions();
    refreshMoltenRecents();
    const t = setTimeout(() => {
      refreshSessions();
      refreshMoltenRecents();
    }, 600);
    return () => clearTimeout(t);
  }, [sessionActive, refreshSessions, refreshMoltenRecents]);

  // ── Preset apply ──────────────────────────────────────────────────────────
  const handleApplyPreset = useCallback(
    async (presetId: string): Promise<void> => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return;

      // Cancel any pending settings debounce so it doesn't fire AFTER the preset write.
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
            // Guard: ignore re-entrant taps while a retry is in flight.
            if (retryInFlightRef.current) return;
            retryInFlightRef.current = handleApplyPreset(presetId)
              .catch(() => {
                /* toast already shown by inner failure */
              })
              .finally(() => {
                retryInFlightRef.current = null;
              });
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

  // Siri / Shortcut deep-link entry: when the route arrives with
  // `?applyPreset=<id>`, find the matching preset and run the canonical
  // apply path, then clear the param. The `appliedRef` guard makes the
  // effect idempotent against expo-router rehydration on remount.
  const { applyPreset: applyPresetParam } = useLocalSearchParams<{ applyPreset?: string }>();
  const appliedPresetIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!applyPresetParam) return;
    if (appliedPresetIdsRef.current.has(applyPresetParam)) {
      router.setParams({ applyPreset: undefined });
      return;
    }
    if (presets.length === 0) return; // wait for hydration; effect re-runs when presets load
    appliedPresetIdsRef.current.add(applyPresetParam);
    router.setParams({ applyPreset: undefined });
    const target = presets.find((p) => p.id === applyPresetParam);
    if (!target) return;
    void handleApplyPreset(target.id).catch(() => { /* toast already shown */ });
  }, [applyPresetParam, presets, handleApplyPreset]);

  // Clear activePresetId whenever the live settings drift away from the
  // active preset's settings (so the indicator fades to "custom"). Cheap
  // shallow-equal across the small DeviceSettings shape — colors get a
  // per-index check.
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

  // ── MoltenSurface preset shape ────────────────────────────────────────────
  // Preset doesn't carry banger/concentrate IDs natively, so we forward
  // id/name/createdAt only. The recents row will skip rows that don't
  // resolve cleanly; that's the documented behavior in MoltenSurface.
  const moltenPresets: ReadonlyArray<MoltenSurfacePreset> = presets.map(
    (p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
    }),
  );

  // ── Build the recents row from moltenRecents ──────────────────────────────
  const moltenRecentEntries: ReadonlyArray<MoltenSurfaceRecent> = useMemo(() => {
    const now = Date.now();
    const out: MoltenSurfaceRecent[] = [];
    for (const recent of moltenRecents) {
      const banger = BANGERS.find((b) => b.id === recent.bangerId);
      const concentrate = CONCENTRATES.find(
        (c) => c.id === recent.concentrateId,
      );
      if (!banger || !concentrate) continue; // skip unresolvable rows
      out.push({
        id: recent.id,
        bangerId: banger.id,
        concentrateId: concentrate.id,
        bangerName: banger.name,
        concentrateName: concentrate.name,
        optimalF: concentrate.surface_temp_optimal_f ?? 480,
        whenLabel: whenLabelFromMs(now - recent.completedAt, recent.completedAt),
      });
    }
    return out;
  }, [moltenRecents]);

  return (
    <MoltenSurface
      presets={moltenPresets}
      recents={moltenRecentEntries}
      onApplyPreset={handleApplyPreset}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function whenLabelFromMs(deltaMs: number, completedAt: number): string {
  if (deltaMs < 2 * 60 * 1000) return 'JUST NOW';
  if (deltaMs < 24 * 60 * 60 * 1000) return 'TODAY';
  if (deltaMs < 48 * 60 * 60 * 1000) return 'YESTERDAY';
  const date = new Date(completedAt);
  return new Intl.DateTimeFormat('en', { weekday: 'short' })
    .format(date)
    .toUpperCase();
}
