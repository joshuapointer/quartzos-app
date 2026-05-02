import type { SharedValue } from 'react-native-reanimated';
import type { Preset } from '../../../src/db/presets';
import type { SessionRecord } from '../../../src/db/sessions';
import type { useSettingsStore } from '../../../src/state/settingsStore';

export type SceneId = 'session' | 'presets' | 'history' | 'configure' | 'walkthrough' | 'new-preset';
export type HistoryFilter = 'all' | 'high' | 'mid' | 'low';

export type SettingsState = ReturnType<typeof useSettingsStore.getState>['settings'];

export interface PresetCardProps {
  preset: Preset;
  index: number;
  listProgress: SharedValue<number>;
  settings: SettingsState;
  isActive: boolean;
  isApplying: boolean;
  onApply: (preset: Preset) => Promise<void>;
}

export interface SessionCardProps {
  session: SessionRecord;
  index: number;
  listProgress: SharedValue<number>;
  settings: SettingsState;
}
