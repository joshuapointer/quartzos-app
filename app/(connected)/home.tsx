import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { QuartzBackground, TemperatureOrb, GlassCard, FloatingHeader } from '../../src/design';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { colors, fonts, radius, spacing } from '../../src/design/tokens';
import { formatTemp } from '../../src/utils/temperature';

export default function HomeScreen() {
  const tempF = useBleStore((s) => s.liveTempF);
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const confirmed = useSettingsStore((s) => s.confirmed);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);
  const useCelsius = settings.useCelsius;

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

  const stateColor =
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
      ? 'LIVE SYNC'
      : connectionState === 'RECONNECTING'
        ? 'RECONNECTING'
        : connectionState === 'SCANNING' ||
            connectionState === 'CONNECTING' ||
            connectionState === 'DISCOVERING'
          ? 'CONNECTING'
          : 'OFFLINE';

  const elapsedFormatted = sessionActive
    ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
    : '0:00';

  const rangeText = `${formatTemp(settings.dabAlarmF - 20, useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, useCelsius)}`;

  return (
    <View style={styles.root}>
      <QuartzBackground />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live status pill */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: stateColor }]} />
            <Text style={styles.statusLabel}>{connectionLabel}</Text>
          </View>

          {/* TemperatureOrb hero */}
          <View style={styles.orbContainer}>
            <TemperatureOrb
              tempF={tempF}
              dabAlarmF={settings.dabAlarmF}
              dunkAlarmF={settings.dunkAlarmF}
              sessionActive={sessionActive}
              useCelsius={useCelsius}
            />
          </View>

          {/* Data cards grid - 2 column */}
          <View style={styles.cardsRow}>
            {/* Session Time card */}
            <GlassCard style={styles.squareCard} padding={16} borderRadius={radius.lg}>
              <MaterialIcons name="schedule" size={20} color={colors.secondaryContainer} />
              <View style={styles.cardBottom}>
                <Text style={styles.cardLabel}>Session</Text>
                <Text style={styles.cardValue}>{elapsedFormatted}</Text>
              </View>
            </GlassCard>

            {/* Peak Temp card */}
            <GlassCard style={styles.squareCard} padding={16} borderRadius={radius.lg}>
              <View style={styles.peakHeader}>
                <MaterialIcons name="local-fire-department" size={20} color={colors.primaryContainer} />
                <View style={styles.maxBadge}>
                  <Text style={styles.maxBadgeText}>Max</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardLabel}>Peak Temp</Text>
                <Text style={styles.cardValue}>{formatTemp(peakF, useCelsius)}</Text>
              </View>
            </GlassCard>
          </View>

          {/* Optimal Range card - full width */}
          <GlassCard padding={16} borderRadius={radius.lg}>
            <View style={styles.rangeRow}>
              <View style={styles.rangeLeft}>
                <View style={styles.rangeIcon}>
                  <MaterialIcons name="tune" size={20} color={colors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.cardLabel}>Optimal Range</Text>
                  <Text style={styles.rangeValue}>{rangeText}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>

      {/* Floating header (absolutely positioned) */}
      <FloatingHeader connectionState={connectionState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  safe: {
    flex: 1,
    paddingTop: 88,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    ...fonts.labelCaps,
    color: colors.primary,
    letterSpacing: 1.6,
    marginLeft: spacing.sm,
  },
  orbContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  squareCard: {
    flex: 1,
    aspectRatio: 1,
  },
  peakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maxBadge: {
    backgroundColor: 'rgba(207,193,255,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  maxBadgeText: {
    ...fonts.labelCaps,
    color: colors.primary,
    fontSize: 10,
  },
  cardBottom: {
    marginTop: 'auto' as unknown as number,
  },
  cardLabel: {
    ...fonts.labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  cardValue: {
    ...fonts.h1,
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeValue: {
    ...fonts.bodyLg,
    color: colors.onSurface,
  },
});
