import { requireOptionalNativeModule } from 'expo-modules-core';

interface NativeModule {
  setPresetCatalog(json: string): void;
  setLastPresetId(id: string | null): void;
  getAppGroupIdentifier(): string;
}

// Optional: returns null on platforms without the native module (Android, web, Expo Go).
export const QuartzieSiriBridgeNativeModule =
  requireOptionalNativeModule<NativeModule>('QuartzieSiriBridgeModule');
