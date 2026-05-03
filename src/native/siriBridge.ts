import { siriBridge as nativeBridge, type PresetCatalogEntry } from 'quartzie-siri-bridge';

import type { Preset } from '../db/presets';

export type { PresetCatalogEntry };

function presetsToCatalog(presets: ReadonlyArray<Preset>): PresetCatalogEntry[] {
  return presets.map((p) => ({ id: p.id, name: p.name }));
}

export const siriBridge = {
  setPresetCatalog(presets: ReadonlyArray<Preset>): void {
    nativeBridge.setPresetCatalog(presetsToCatalog(presets));
  },
  setLastPresetId(id: string | null): void {
    nativeBridge.setLastPresetId(id);
  },
  isAvailable: nativeBridge.isAvailable,
};
