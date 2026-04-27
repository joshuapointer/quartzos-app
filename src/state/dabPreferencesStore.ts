import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import type { SensorMethod } from '../data/sensors';
import type { WallThicknessId } from '../data/wallThicknesses';

const storage = new MMKV();

function loadPersistedSensor(): SensorMethod {
  const stored = storage.getString('dab.sensor');
  if (stored === 'contact' || stored === 'ir' || stored === 'enail' || stored === 'visual') {
    return stored;
  }
  return 'ir';
}

function loadPersistedWall(): WallThicknessId {
  const stored = storage.getString('dab.wall');
  if (stored === 'thin' || stored === 'standard' || stored === 'thick' || stored === 'unknown') {
    return stored;
  }
  return 'standard';
}

function loadPersistedColdStart(): boolean {
  return storage.getBoolean('dab.coldStart') ?? false;
}

interface DabPreferencesState {
  preferredSensor: SensorMethod;
  preferredWall: WallThicknessId;
  coldStartByDefault: boolean;
  setPreferredSensor: (s: SensorMethod) => void;
  setPreferredWall: (w: WallThicknessId) => void;
  setColdStartByDefault: (b: boolean) => void;
}

export const useDabPreferencesStore = create<DabPreferencesState>()(
  immer((set) => ({
    preferredSensor: loadPersistedSensor(),
    preferredWall: loadPersistedWall(),
    coldStartByDefault: loadPersistedColdStart(),
    setPreferredSensor: (s) => {
      storage.set('dab.sensor', s);
      set((st) => { st.preferredSensor = s; });
    },
    setPreferredWall: (w) => {
      storage.set('dab.wall', w);
      set((st) => { st.preferredWall = w; });
    },
    setColdStartByDefault: (b) => {
      storage.set('dab.coldStart', b);
      set((st) => { st.coldStartByDefault = b; });
    },
  })),
);
