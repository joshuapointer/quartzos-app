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

// design.md — warm obsidian (apr 2026)
export const themes: Record<ThemeName, ThemeColors> = {
  obsidian: {
    bgDeep:           '#0e0905',
    surface1:         '#080503',
    surface3:         '#291d16',
    surface6:         '#45362e',  // matches tokens.surface6 / surfaceBright
    surfaceBright:    '#45362e',
    glassFill:        'rgba(28,17,10,0.6)',
    glassBorder:      'rgba(246,222,210,0.08)',
    primary:          '#ffb68b',
    primaryContainer: '#ff7a00',
    onSurface:        '#f6ded2',
    onSurfaceVariant: '#e0c0af',
    outline:          '#a78b7c',
  },
};

export const DEFAULT_THEME: ThemeName = 'obsidian';
