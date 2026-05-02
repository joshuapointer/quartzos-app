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

// design.md — OLED white-hot neon edge (may 2026)
export const themes: Record<ThemeName, ThemeColors> = {
  obsidian: {
    bgDeep:           '#000000',
    surface1:         '#000000',
    surface3:         '#111111',
    surface6:         '#262626',
    surfaceBright:    '#262626',
    glassFill:        'rgba(0,0,0,0.6)',
    glassBorder:      'rgba(255,255,255,0.10)',
    primary:          '#ffffff',
    primaryContainer: '#e6e6e6',
    onSurface:        '#ffffff',
    onSurfaceVariant: '#a0a0a0',
    outline:          '#666666',
  },
};

export const DEFAULT_THEME: ThemeName = 'obsidian';
