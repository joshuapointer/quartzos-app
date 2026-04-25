import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { themes, ThemeName } from '../themes';

interface ThemePickerProps {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
}

const THEME_LABELS: Record<ThemeName, string> = {
  'warm-mineral': 'Warm Mineral',
  'smoke': 'Smoke',
  'cool-shell': 'Cool Shell',
};

const THEME_NAMES: ThemeName[] = ['warm-mineral', 'smoke', 'cool-shell'];

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const handleSelect = useCallback(
    (themeName: ThemeName) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(themeName);
    },
    [onChange],
  );

  return (
    <View style={styles.row}>
      {THEME_NAMES.map((themeName) => {
        const themeColors = themes[themeName];
        const isSelected = value === themeName;

        return (
          <Pressable
            key={themeName}
            onPress={() => handleSelect(themeName)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={THEME_LABELS[themeName]}
            style={[
              styles.tile,
              {
                backgroundColor: themeColors.bgDeep,
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected
                  ? themeColors.primary
                  : `${themeColors.primary}33`,
              },
            ]}
          >
            {/* Primary color dot in top-right area */}
            <View
              style={[
                styles.accentDot,
                { backgroundColor: themeColors.primary },
              ]}
            />

            {/* Selected indicator */}
            {isSelected && (
              <View
                style={[
                  styles.selectedDot,
                  { backgroundColor: themeColors.primary },
                ]}
              />
            )}

            {/* Theme name label */}
            <Text
              style={[
                styles.tileLabel,
                { color: themeColors.onSurfaceVariant },
              ]}
            >
              {THEME_LABELS[themeName].toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  accentDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.85,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
});
