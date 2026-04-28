import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import type { DeviceSettings } from '../ble/types';
import { DEFAULT_SETTINGS } from '../ble/types';
import { ThemeName, DEFAULT_THEME } from '../design/themes';
import { validateAlarms } from '../utils/temperature';

const storage = new MMKV();

const ACTIVE_PRESET_KEY = 'app.activePresetId';

function loadPersistedTheme(): ThemeName {
  const stored = storage.getString('app.theme');
  if (stored === 'obsidian') {
    return stored;
  }
  return DEFAULT_THEME;
}

function loadPersistedActivePresetId(): string | null {
  const stored = storage.getString(ACTIVE_PRESET_KEY);
  return stored ?? null;
}

interface SettingsState {
  settings: DeviceSettings;
  confirmed: boolean;
  dirty: boolean;
  theme: ThemeName;
  /**
   * The id of the preset currently driving on-device alarm temps.
   * Persisted via MMKV so it survives app restart. Cleared whenever the
   * user edits any setting that diverges from the active preset
   * (so the indicator fades to "custom").
   */
  activePresetId: string | null;
  setSettings: (s: DeviceSettings) => void;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  markConfirmed: () => void;
  setTheme: (t: ThemeName) => void;
  setActivePresetId: (id: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(immer((set) => ({
  settings: DEFAULT_SETTINGS,
  confirmed: false,
  dirty: false,
  theme: loadPersistedTheme(),
  activePresetId: loadPersistedActivePresetId(),
  setSettings: (s) => set((st) => {
    // Defense-in-depth: clamp the (dab, dunk) pair so any path through the
    // store lands a valid alarm pair. The BLE encoder also clamps, but
    // doing it here keeps the in-memory state coherent for the UI.
    const { dab, dunk } = validateAlarms(s.dabAlarmF, s.dunkAlarmF);
    st.settings = { ...s, dabAlarmF: dab, dunkAlarmF: dunk };
    st.confirmed = true;
    st.dirty = false;
  }),
  updateSetting: (key, val) => set((st) => {
    (st.settings as Record<string, unknown>)[key as string] = val;
    // Re-clamp the alarm pair if the user just edited one of them so that
    // dunk can never sit ≥ dab - 10 in memory.
    if (key === 'dabAlarmF' || key === 'dunkAlarmF') {
      const { dab, dunk } = validateAlarms(st.settings.dabAlarmF, st.settings.dunkAlarmF);
      st.settings.dabAlarmF = dab;
      st.settings.dunkAlarmF = dunk;
    }
    st.dirty = true;
  }),
  markConfirmed: () => set((st) => { st.dirty = false; }),
  setTheme: (t) => {
    storage.set('app.theme', t);
    set((st) => { st.theme = t; });
  },
  setActivePresetId: (id) => {
    if (id == null) {
      storage.delete(ACTIVE_PRESET_KEY);
    } else {
      storage.set(ACTIVE_PRESET_KEY, id);
    }
    set((st) => { st.activePresetId = id; });
  },
})));
