import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { MMKV } from 'react-native-mmkv';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChromeButton,
  CrystalToggle,
  GlassCard,
  QBackground,
  SkeuSlider,
} from '../../src/design';
import { colors, fonts, spacing, radius } from '../../src/design/tokens';
import { useSettingsStore } from '../../src/state/settingsStore';

const storage = new MMKV({ id: 'quartzos' });

const MIN_TEMP_F = 100;
const MAX_TEMP_F = 900;

export default function NotificationConfigModal() {
  const router = useRouter();
  const deviceDabF = useSettingsStore((s) => s.settings.dabAlarmF);
  const deviceDunkF = useSettingsStore((s) => s.settings.dunkAlarmF);

  const [phoneDabF, setPhoneDabF] = useState<number>(
    () => storage.getNumber('phoneDabAlarmF') ?? deviceDabF,
  );
  const [phoneDunkF, setPhoneDunkF] = useState<number>(
    () => storage.getNumber('phoneDunkAlarmF') ?? deviceDunkF,
  );
  const [dabEnabled, setDabEnabled] = useState<boolean>(
    () => storage.getBoolean('dabAlertEnabled') ?? true,
  );
  const [dunkEnabled, setDunkEnabled] = useState<boolean>(
    () => storage.getBoolean('dunkAlertEnabled') ?? true,
  );

  const handleDabChange = useCallback((v: number) => {
    setPhoneDabF(v);
    storage.set('phoneDabAlarmF', v);
  }, []);

  const handleDunkChange = useCallback((v: number) => {
    setPhoneDunkF(v);
    storage.set('phoneDunkAlarmF', v);
  }, []);

  const handleDabToggle = useCallback((v: boolean) => {
    setDabEnabled(v);
    storage.set('dabAlertEnabled', v);
  }, []);

  const handleDunkToggle = useCallback((v: boolean) => {
    setDunkEnabled(v);
    storage.set('dunkAlertEnabled', v);
  }, []);

  const handleTestDab = useCallback(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Dab Temp Reached',
        body: 'Test: your quartz is ready.',
        sound: 'dab_alarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 200, 100, 200],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(),
        channelId: 'alarms',
      },
    }).catch(console.warn);
  }, []);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <QBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Phone Alerts</Text>
          <Text style={styles.subtitle}>
            Configure independent phone-side alarm thresholds.
          </Text>

          {/* Dab alert card */}
          <GlassCard padding={spacing.md} borderRadius={radius.md} style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={styles.sectionLabel}>Enable dab alert</Text>
              <CrystalToggle
                value={dabEnabled}
                onValueChange={handleDabToggle}
                accessibilityLabel="Enable dab alert"
              />
            </View>

            <View style={styles.sliderWrap}>
              <SkeuSlider
                label="Phone Dab Alert"
                value={phoneDabF}
                min={MIN_TEMP_F}
                max={MAX_TEMP_F}
                step={5}
                onValueChange={handleDabChange}
                unit="°F"
                disabled={!dabEnabled}
                accessibilityLabel="Phone dab alert temperature"
              />
            </View>

            <ChromeButton
              label="Test Dab Alert"
              variant="ghost"
              onPress={handleTestDab}
              style={styles.testBtn}
              accessibilityLabel="Test dab alert notification"
            />
          </GlassCard>

          {/* Dunk alert card */}
          <GlassCard padding={spacing.md} borderRadius={radius.md} style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={styles.sectionLabel}>Enable dunk alert</Text>
              <CrystalToggle
                value={dunkEnabled}
                onValueChange={handleDunkToggle}
                accessibilityLabel="Enable dunk alert"
              />
            </View>

            <View style={styles.sliderWrap}>
              <SkeuSlider
                label="Phone Dunk Alert"
                value={phoneDunkF}
                min={MIN_TEMP_F}
                max={MAX_TEMP_F}
                step={5}
                onValueChange={handleDunkChange}
                unit="°F"
                disabled={!dunkEnabled}
                accessibilityLabel="Phone dunk alert temperature"
              />
            </View>
          </GlassCard>

          <ChromeButton
            label="Done"
            variant="primary"
            onPress={handleDone}
            style={styles.doneBtn}
            accessibilityLabel="Done"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050403',
  },
  safe: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    ...fonts.h1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  card: {
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...fonts.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sliderWrap: {
    marginBottom: spacing.sm,
  },
  testBtn: {
    marginTop: spacing.xs,
  },
  doneBtn: {
    marginTop: spacing.sm,
  },
});
