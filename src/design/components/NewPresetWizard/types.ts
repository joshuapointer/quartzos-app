import type { Banger, BangerCategory } from '../../../data/bangers';
import type { Concentrate } from '../../../data/concentrates';
import type { Sensor } from '../../../data/sensors';
import type { WallThicknessId } from '../../../data/wallThicknesses';
import type { computeDisplayedTarget } from '../../../utils/calibration';

export interface NewPresetWizardProps {
  onClose: () => void;
  onSaved: () => void;
}

export interface BangerGroup {
  readonly category: BangerCategory;
  readonly bangers: readonly Banger[];
}

export interface BangerStepProps {
  bangerId: string | null;
  onSelect: (id: string) => void;
}

export interface SensorStepProps {
  sensorId: string;
  onSelect: (id: string) => void;
  banger: Banger | null;
  sensor: Sensor;
}

export interface WallStepProps {
  wallId: WallThicknessId;
  onSelect: (id: WallThicknessId) => void;
}

export interface ConcentrateStepProps {
  concentrateId: string | null;
  onSelect: (id: string) => void;
}

export interface TuneStepProps {
  calibration: ReturnType<typeof computeDisplayedTarget> | null;
  tempOffset: number;
  onChangeOffset: (n: number) => void;
}

export interface SaveStepProps {
  presetName: string;
  onChangeName: (s: string) => void;
  banger: Banger | null;
  concentrate: Concentrate | null;
  finalTemp: number;
  dunkTemp: number;
  gemColor: string;
  onSelectGem: (c: string) => void;
  coldStartCompatible: boolean;
  useColdStart: boolean;
  onToggleColdStart: () => void;
}
