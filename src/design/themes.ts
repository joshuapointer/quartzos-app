export type ThemeName = 'warm-mineral' | 'smoke' | 'cool-shell';

export interface ThemeColors {
  bgDeep: string;
  surface1: string;
  surface3: string;
  surface6: string;
  surfaceBright: string;
  glassFill: string;
  glassBorder: string;
  primary: string;
  primaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  'warm-mineral': {
    bgDeep:           '#0E0B08',
    surface1:         '#171009',
    surface3:         '#22180D',
    surface6:         '#302212',
    surfaceBright:    '#3A2B17',
    glassFill:        'rgba(30,18,8,0.45)',
    glassBorder:      'rgba(210,185,145,0.10)',
    primary:          '#D2B990',
    primaryContainer: '#E8D0A8',
    onSurface:        '#F5EBD8',
    onSurfaceVariant: '#C4AD8A',
    outline:          '#8C7458',
  },
  'smoke': {
    bgDeep:           '#0D0918',
    surface1:         '#110C1D',
    surface3:         '#1A1528',
    surface6:         '#2E2840',
    surfaceBright:    '#3A3450',
    glassFill:        'rgba(18,12,31,0.40)',
    glassBorder:      'rgba(207,193,255,0.10)',
    primary:          '#b5a1ff',
    primaryContainer: '#cfc1ff',
    onSurface:        '#e9def9',
    onSurfaceVariant: '#cac4d3',
    outline:          '#938e9c',
  },
  'cool-shell': {
    bgDeep:           '#0B0B12',
    surface1:         '#0F0F1A',
    surface3:         '#181826',
    surface6:         '#272738',
    surfaceBright:    '#323248',
    glassFill:        'rgba(15,15,26,0.45)',
    glassBorder:      'rgba(160,160,220,0.09)',
    primary:          '#B4B4DC',
    primaryContainer: '#CACAEE',
    onSurface:        '#DCDCF0',
    onSurfaceVariant: '#9898C0',
    outline:          '#6868A0',
  },
};

export const DEFAULT_THEME: ThemeName = 'warm-mineral';
