import { useSettingsStore } from '../state/settingsStore';
export function useDeviceSettings() {
  return useSettingsStore((s) => ({ settings: s.settings, confirmed: s.confirmed }));
}
