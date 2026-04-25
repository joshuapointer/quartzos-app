import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DeviceSettings } from '../ble/types';
import { DEFAULT_SETTINGS } from '../ble/types';

interface SettingsState {
  settings: DeviceSettings;
  confirmed: boolean;
  dirty: boolean;
  setSettings: (s: DeviceSettings) => void;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  markConfirmed: () => void;
}

export const useSettingsStore = create<SettingsState>()(immer((set) => ({
  settings: DEFAULT_SETTINGS,
  confirmed: false,
  dirty: false,
  setSettings: (s) => set((st) => { st.settings = s; st.confirmed = true; st.dirty = false; }),
  updateSetting: (key, val) => set((st) => { (st.settings as any)[key] = val; st.dirty = true; }),
  markConfirmed: () => set((st) => { st.dirty = false; }),
})));
