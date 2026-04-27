import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import type { DeviceSettings } from '../ble/types';
import { DEFAULT_SETTINGS } from '../ble/types';
import { ThemeName, DEFAULT_THEME } from '../design/themes';

const storage = new MMKV();

function loadPersistedTheme(): ThemeName {
  const stored = storage.getString('app.theme');
  if (stored === 'obsidian') {
    return stored;
  }
  return DEFAULT_THEME;
}

interface SettingsState {
  settings: DeviceSettings;
  confirmed: boolean;
  dirty: boolean;
  theme: ThemeName;
  setSettings: (s: DeviceSettings) => void;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  markConfirmed: () => void;
  setTheme: (t: ThemeName) => void;
}

export const useSettingsStore = create<SettingsState>()(immer((set) => ({
  settings: DEFAULT_SETTINGS,
  confirmed: false,
  dirty: false,
  theme: loadPersistedTheme(),
  setSettings: (s) => set((st) => { st.settings = s; st.confirmed = true; st.dirty = false; }),
  updateSetting: (key, val) => set((st) => { (st.settings as Record<string, unknown>)[key as string] = val; st.dirty = true; }),
  markConfirmed: () => set((st) => { st.dirty = false; }),
  setTheme: (t) => {
    storage.set('app.theme', t);
    set((st) => { st.theme = t; });
  },
})));
