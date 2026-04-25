import React, { createContext, useContext, useMemo } from 'react';
import { colors } from './tokens';
import { themes, ThemeName, ThemeColors, DEFAULT_THEME } from './themes';
import { useSettingsStore } from '../state/settingsStore';

interface ThemeContextValue {
  themeName: ThemeName;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: DEFAULT_THEME,
  theme: themes[DEFAULT_THEME],
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeName = useSettingsStore((s) => s.theme);
  const theme = themes[themeName] ?? themes[DEFAULT_THEME];
  const value = useMemo(() => ({ themeName, theme }), [themeName, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Returns colors object merged with current theme overrides.
// Use this in components that need theme-aware colors.
export function useThemeColors() {
  const { theme } = useTheme();
  return useMemo(() => ({ ...colors, ...theme }), [theme]);
}
