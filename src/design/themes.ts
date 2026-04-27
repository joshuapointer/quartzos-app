export type ThemeName = 'obsidian';

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
  obsidian: {
    bgDeep:           '#050403',
    surface1:         '#0c0908',
    surface3:         '#1c1714',
    surface6:         '#3d342e',
    surfaceBright:    '#3d342e',
    glassFill:        'rgba(5,4,3,0.6)',
    glassBorder:      'rgba(244,237,228,0.08)',
    primary:          '#E89240',
    primaryContainer: '#9ABDD8',
    onSurface:        '#f4ede4',
    onSurfaceVariant: '#c7b8a4',
    outline:          '#6d6050',
  },
};

export const DEFAULT_THEME: ThemeName = 'obsidian';
