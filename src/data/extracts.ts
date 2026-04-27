export type ExtractType = 'Solventless' | 'Hydrocarbon' | 'Isolate';

export interface Extract {
  id: string;
  name: string;
  type: ExtractType;
  baseTemp: number;
  color1: string;
  color2: string;
}

export const EXTRACTS: readonly Extract[] = [
  // Solventless
  { id: 'fullMelt', name: '6-Star Melt', type: 'Solventless', baseTemp: 450, color1: '#E8DEC0', color2: '#C0AC78' },
  { id: 'rosin', name: 'Rosin', type: 'Solventless', baseTemp: 465, color1: '#B8944C', color2: '#7A5C28' },
  { id: 'liveRosin', name: 'Live Rosin', type: 'Solventless', baseTemp: 460, color1: '#C4A860', color2: '#886030' },
  { id: 'hashRosin', name: 'Hash Rosin', type: 'Solventless', baseTemp: 455, color1: '#C09050', color2: '#7C5420' },
  { id: 'freshPress', name: 'Fresh Press', type: 'Solventless', baseTemp: 470, color1: '#D4C278', color2: '#A58C50' },
  { id: 'coldCure', name: 'Cold Cure', type: 'Solventless', baseTemp: 485, color1: '#C4AC74', color2: '#7D6840' },
  // Hydrocarbon
  { id: 'liveResin', name: 'Live Resin', type: 'Hydrocarbon', baseTemp: 505, color1: '#B8782C', color2: '#704820' },
  { id: 'badder', name: 'Badder', type: 'Hydrocarbon', baseTemp: 495, color1: '#CC9038', color2: '#885820' },
  { id: 'terpSauce', name: 'Terp Sauce', type: 'Hydrocarbon', baseTemp: 510, color1: '#A86C24', color2: '#5C3810' },
  { id: 'shatter', name: 'Shatter', type: 'Hydrocarbon', baseTemp: 515, color1: '#A06830', color2: '#604030' },
  { id: 'crumble', name: 'Crumble', type: 'Hydrocarbon', baseTemp: 520, color1: '#946040', color2: '#583828' },
  // Isolate
  { id: 'diamonds', name: 'Diamonds', type: 'Isolate', baseTemp: 530, color1: '#D8E4EC', color2: '#A8C0D4' },
  { id: 'thca', name: 'THCa Powder', type: 'Isolate', baseTemp: 540, color1: '#F0ECD8', color2: '#C8C0A8' },
  { id: 'distillate', name: 'Distillate', type: 'Isolate', baseTemp: 545, color1: '#C8D8E8', color2: '#8898A8' },
];
