import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { QuartzBackground, GlassCard, ChromeButton } from '../../../src/design';
import { colors, spacing, radius, fonts } from '../../../src/design/tokens';
import { useSettingsStore } from '../../../src/state/settingsStore';
import * as presetsDb from '../../../src/db/presets';
import type { DeviceSettings } from '../../../src/ble/types';
import { DEFAULT_SETTINGS } from '../../../src/ble/types';

export default function PresetEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const liveSettings = useSettingsStore((s) => s.settings);

  const [name, setName] = useState('');
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      void presetsDb.getById(id).then((preset) => {
        if (preset) {
          setName(preset.name);
          setSettings(preset.settings);
        }
      });
    }
  }, [id, isNew]);

  const handleLoadFromDevice = useCallback(() => {
    setSettings(liveSettings);
  }, [liveSettings]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (isNew) {
        await presetsDb.create(trimmed, settings);
      } else {
        await presetsDb.update(id, { name: trimmed, settings });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }, [id, isNew, name, settings]);

  return (
    <View style={styles.root}>
      <QuartzBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{isNew ? 'New Preset' : 'Edit Preset'}</Text>

            <GlassCard style={styles.card} padding={16} borderRadius={radius.md}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Preset name…"
                placeholderTextColor={colors.textDim}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </GlassCard>

            <GlassCard style={styles.card} padding={16} borderRadius={radius.md}>
              <Text style={styles.fieldLabel}>Settings</Text>
              <Text style={styles.settingsSummary}>
                Dab alarm: <Text style={styles.settingsValue}>{settings.dabAlarmF}°F</Text>
                {'  '}Dunk alarm: <Text style={styles.settingsValue}>{settings.dunkAlarmF}°F</Text>
              </Text>
              <ChromeButton
                label="Load from current device"
                onPress={handleLoadFromDevice}
                variant="ghost"
                style={styles.loadButton}
              />
            </GlassCard>

            <View style={styles.actions}>
              <ChromeButton
                label="Cancel"
                onPress={() => router.back()}
                variant="ghost"
                style={styles.actionButton}
              />
              <ChromeButton
                label="Save"
                onPress={() => { void handleSave(); }}
                variant="secondary"
                disabled={name.trim().length === 0}
                loading={saving}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.idleDeep,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heading: {
    color: colors.textPrimary,
    ...fonts.h1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  card: {
    alignSelf: 'stretch',
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.crystalEdge,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
  },
  settingsSummary: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  settingsValue: {
    color: colors.activeAmber,
    fontWeight: '600',
  },
  loadButton: {
    alignSelf: 'stretch',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
