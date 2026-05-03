import { QuartzieSiriBridgeNativeModule } from './src/QuartzieSiriBridgeModule';
import type { PresetCatalogEntry } from './src/types';

export type { PresetCatalogEntry };

export const APP_GROUP_IDENTIFIER = 'group.com.quartzos.app';

function setPresetCatalog(presets: ReadonlyArray<PresetCatalogEntry>): void {
  if (!QuartzieSiriBridgeNativeModule) return;
  try {
    QuartzieSiriBridgeNativeModule.setPresetCatalog(JSON.stringify(presets));
  } catch {
    /* swallow — bridge is best-effort, JS state is source of truth */
  }
}

function setLastPresetId(id: string | null): void {
  if (!QuartzieSiriBridgeNativeModule) return;
  try {
    QuartzieSiriBridgeNativeModule.setLastPresetId(id);
  } catch {
    /* swallow */
  }
}

export const siriBridge = {
  setPresetCatalog,
  setLastPresetId,
  isAvailable: QuartzieSiriBridgeNativeModule != null,
};
