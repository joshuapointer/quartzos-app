import type { BangerCategory } from '../../../data/bangers';
import type { ConcentrateCategory } from '../../../data/concentrates';
import type { SensorMethod } from '../../../data/sensors';
import type { WallThicknessId } from '../../../data/wallThicknesses';
import { colors } from '../../tokens';
import { MaterialIcons } from '@expo/vector-icons';

export const BANGER_CATEGORY_ORDER: readonly BangerCategory[] = [
  'classic',
  'slurper',
  'specialty',
  'premium',
];

export const BANGER_CATEGORY_LABELS: Readonly<Record<BangerCategory, string>> = {
  classic: 'Classic',
  slurper: 'Slurper Class',
  specialty: 'Specialty',
  premium: 'Premium',
};

export const CONCENTRATE_CATEGORY_ORDER: readonly ConcentrateCategory[] = [
  'solventless',
  'hydrocarbon',
];

export const CONCENTRATE_CATEGORY_LABELS: Readonly<Record<ConcentrateCategory, string>> = {
  solventless: 'Solventless',
  hydrocarbon: 'Hydrocarbon',
};

export const CATEGORY_SWATCH_COLORS: Readonly<Record<ConcentrateCategory, readonly [string, string]>> = {
  solventless: ['#C4A860', '#886030'],
  hydrocarbon: ['#B8782C', '#704820'],
};

export const SENSOR_ORDER: readonly SensorMethod[] = ['ir', 'contact', 'enail', 'visual'];

export const SENSOR_SHORT_LABEL: Readonly<Record<SensorMethod, string>> = {
  ir: 'IR',
  contact: 'Probe',
  enail: 'E-nail',
  visual: 'Visual',
};

export const WALL_ORDER: readonly WallThicknessId[] = ['thin', 'standard', 'thick', 'unknown'];

export const GEM_COLORS = [
  colors.sapphire,
  colors.amethyst,
  colors.citrine,
  colors.emerald,
  colors.ruby,
];

export const GEM_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [colors.sapphire]: 'water-drop',
  [colors.amethyst]: 'diamond',
  [colors.citrine]: 'local-fire-department',
  [colors.emerald]: 'eco',
  [colors.ruby]: 'favorite',
};

export const CARD_W = 240;
export const CARD_H = 280;
export const CARD_GAP = 16;
export const STEP_COUNT = 6;
export const TEMP_RANGE = 30;
export const PX_PER_DEGREE = 4;

export const STEP_TITLES: readonly string[] = [
  'Pick your hardware',
  'How do you measure?',
  'Wall thickness',
  'What are you dabbing?',
  'Tune your window',
  'Save your preset',
];

export const GAUGE_W = 216;
export const GAUGE_PAD = 20;
export const GAUGE_TRACK_Y = 14;
export const GAUGE_PX_PER_DEG = (GAUGE_W - GAUGE_PAD * 2) / (TEMP_RANGE * 2);
