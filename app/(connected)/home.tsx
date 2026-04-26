import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { formatTemp } from '../../src/utils/temperature';

// Bottom sheet peeks 180pt above the bottom of the screen
const SHEET_PEEK = 180;

export default function HomeScreen() {
  const tempF = useBleStore((s) => s.liveTempF);
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);

  const { theme } = useTheme();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

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

  const elapsedFormatted = sessionActive
    ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
    : '0:00';

  const targetRangeText = `${formatTemp(settings.dabAlarmF - 20, settings.useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, settings.useCelsius)}`;

  // Calculate exact pixel positions from the top of the screen
  // FloatingHeader: positioned at insets.top + 16, height 64
  const headerBottom = insets.top + 16 + 64 + 12; // 12pt gap below header
  // Bottom sheet peek: 180pt up from screen bottom
  const sheetTop = screenH - SHEET_PEEK;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bgDeep }]}>
      <QuartzBackground />

      {/* ORB LAYER — centered between header and sheet peek */}
      <View
        style={[
          styles.orbLayer,
          { top: headerBottom, bottom: SHEET_PEEK },
        ]}
        pointerEvents="none"
      >
        <TemperatureOrb
          tempF={tempF}
          dabAlarmF={settings.dabAlarmF}
          dunkAlarmF={settings.dunkAlarmF}
          sessionActive={sessionActive}
          useCelsius={settings.useCelsius}
          size={280}
        />
      </View>

      {/* CONTROLS LAYER — DataStrip + PresetPill pinned just above sheet */}
      <View
        style={[
          styles.controlsLayer,
          { bottom: SHEET_PEEK + 8 },
        ]}
        pointerEvents="box-none"
      >
        <DataStrip
          sessionTimeFormatted={elapsedFormatted}
          peakTempFormatted={formatTemp(peakF, settings.useCelsius)}
          targetRangeFormatted={targetRangeText}
        />
        <PresetPill
          presetName={formatTemp(settings.dabAlarmF, settings.useCelsius)}
          gemColor={theme.primary}
          onPress={() => sheetRef.current?.openToPresets()}
          style={styles.presetPill}
        />
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheetContainer} pointerEvents="box-none">
        <MainBottomSheet
          ref={sheetRef}
          presetsContent={<PresetsSheetContent />}
          historyContent={<HistorySheetContent />}
          configureContent={<ConfigureSheetContent />}
        />
      </View>

      {/* FloatingHeader — sits on top of everything */}
      <FloatingHeader connectionState={connectionState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  orbLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsLayer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  presetPill: {
    marginTop: 8,
  },
  sheetContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
