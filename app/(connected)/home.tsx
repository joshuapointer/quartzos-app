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
const SHEET_PEEK = 120;

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
  const { width: screenW, height: screenH } = useWindowDimensions();

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

  // FloatingHeader: positioned at insets.top + 16, height 64
  const headerBottom = insets.top + 16 + 64 + 8;

  // The orb should be as large as possible while fitting the available space.
  // Available vertical space: from header bottom to the controls above the sheet.
  // DataStrip (56pt) + gap (8pt) + PresetPill (48pt) + gap (8pt) = 120pt above sheet peek.
  const controlsHeight = 56 + 8 + 48 + 8;
  const availableHeight = screenH - headerBottom - SHEET_PEEK - controlsHeight;

  // Orb size fills up to 90% of available height (or screen width - 40, whichever is smaller)
  const orbSize = Math.min(
    Math.floor(availableHeight * 0.85),
    screenW - 40,
    340, // cap for very large screens
  );

  // Center the orb between header and controls
  const orbCenterY = headerBottom + availableHeight / 2;
  // The orb container is ring2Size = orbSize + 96
  const orbContainerSize = orbSize + 96;
  const orbTop = orbCenterY - orbContainerSize / 2;

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bgDeep }]}>
      <QuartzBackground />

      {/* ORB LAYER — the hero, centered in the visible space */}
      <View
        style={[
          styles.orbLayer,
          {
            top: orbTop,
            left: (screenW - orbContainerSize) / 2,
            width: orbContainerSize,
            height: orbContainerSize,
          },
        ]}
        pointerEvents="none"
      >
        <TemperatureOrb
          tempF={tempF}
          dabAlarmF={settings.dabAlarmF}
          dunkAlarmF={settings.dunkAlarmF}
          sessionActive={sessionActive}
          useCelsius={settings.useCelsius}
          size={orbSize}
        />
      </View>

      {/* CONTROLS — pinned just above the bottom sheet */}
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
