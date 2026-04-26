import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuartzBackground, TemperatureOrb, FloatingHeader } from '../../src/design';
import { DataStrip } from '../../src/design/components/DataStrip';
import { PresetPill } from '../../src/design/components/PresetPill';
import { MainBottomSheet, MainBottomSheetHandle } from '../../src/design/components/MainBottomSheet';
import { PresetsSheetContent } from '../../src/design/components/sheet/PresetsSheetContent';
import { HistorySheetContent } from '../../src/design/components/sheet/HistorySheetContent';
import { ConfigureSheetContent } from '../../src/design/components/sheet/ConfigureSheetContent';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { useTheme, useThemeColors } from '../../src/design/ThemeContext';
import { colors, fonts } from '../../src/design/tokens';
import { formatTemp } from '../../src/utils/temperature';

export default function HomeScreen() {
  const tempF = useBleStore((s) => s.liveTempF);
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);

  const { theme } = useTheme();
  const themeColors = useThemeColors();

  const sheetRef = useRef<MainBottomSheetHandle>(null);

  // Session elapsed time display
  const [elapsedSec, setElapsedSec] = React.useState(0);
  useEffect(() => {
    if (!sessionActive || !startedAt) {
      setElapsedSec(0);
      return;
    }
    const interval = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [sessionActive, startedAt]);

  const statusColor =
    connectionState === 'READY'
      ? colors.success
      : connectionState === 'RECONNECTING' ||
          connectionState === 'SCANNING' ||
          connectionState === 'CONNECTING' ||
          connectionState === 'DISCOVERING'
        ? colors.warning
        : colors.error;

  const connectionLabel =
    connectionState === 'READY'
      ? 'Live'
      : connectionState === 'RECONNECTING'
        ? 'Reconnecting'
        : connectionState === 'SCANNING' ||
            connectionState === 'CONNECTING' ||
            connectionState === 'DISCOVERING'
          ? 'Connecting'
          : 'Offline';

  const elapsedFormatted = sessionActive
    ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
    : '0:00';

  const targetRangeText = `${formatTemp(settings.dabAlarmF - 20, settings.useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, settings.useCelsius)}`;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bgDeep }]}>
      <QuartzBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.flex}>

          {/* Content area (above bottom sheet peek) */}
          <View style={styles.contentArea}>

            {/* Status row — pinned below floating header */}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {connectionLabel}
              </Text>
            </View>

            {/* Orb area — flex:1 so orb stays centered in remaining space */}
            <View style={styles.orbArea}>
              <TemperatureOrb
                tempF={tempF}
                dabAlarmF={settings.dabAlarmF}
                dunkAlarmF={settings.dunkAlarmF}
                sessionActive={sessionActive}
                useCelsius={settings.useCelsius}
                size={260}
              />
            </View>

            {/* Data strip */}
            <DataStrip
              sessionTimeFormatted={elapsedFormatted}
              peakTempFormatted={formatTemp(peakF, settings.useCelsius)}
              targetRangeFormatted={targetRangeText}
              style={styles.dataStrip}
            />

            {/* Preset pill */}
            <PresetPill
              presetName={formatTemp(settings.dabAlarmF, settings.useCelsius)}
              gemColor={theme.primary}
              onPress={() => sheetRef.current?.openToPresets()}
              style={styles.presetPill}
            />
          </View>

          {/* MainBottomSheet — absolutely positioned over content */}
          <MainBottomSheet
            ref={sheetRef}
            presetsContent={<PresetsSheetContent />}
            historyContent={<HistorySheetContent />}
            configureContent={<ConfigureSheetContent />}
          />

        </View>
      </SafeAreaView>

      {/* FloatingHeader — sits on top of everything */}
      <FloatingHeader connectionState={connectionState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 180,
    alignItems: 'center',
  },
  orbArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...fonts.labelCaps,
    marginLeft: 6,
  },
  dataStrip: {
    width: '100%',
    marginTop: 20,
  },
  presetPill: {
    width: '100%',
    marginTop: 12,
  },
});
