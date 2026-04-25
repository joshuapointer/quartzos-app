import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { QuartzBackground, TemperatureOrb, GlassCard, ChromeButton } from '../../src/design';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { colors, spacing, radius } from '../../src/design/tokens';
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
      : connectionState === 'RECONNECTING'
        ? colors.alertAmber
        : colors.alertRed;

  const connectionLabel =
    connectionState === 'READY'
      ? 'Dab Rite Connected'
      : connectionState === 'RECONNECTING'
        ? 'Reconnecting…'
        : connectionState;

  return (
    <View style={styles.root}>
      <QuartzBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Connection bar */}
        <GlassCard style={styles.connectionBar} padding={12} borderRadius={radius.md}>
          <View style={styles.connectionRow}>
            <View style={[styles.dot, { backgroundColor: stateColor }]} />
            <Text style={styles.connectionText}>{connectionLabel}</Text>
            {!confirmed && connectionState === 'READY' && (
              <Text style={styles.pendingText}> settings pending…</Text>
            )}
          </View>
        </GlassCard>

        {/* Temperature Orb — hero */}
        <View style={styles.orbContainer}>
          <TemperatureOrb
            tempF={tempF}
            dabAlarmF={settings.dabAlarmF}
            dunkAlarmF={settings.dunkAlarmF}
            sessionActive={sessionActive}
            useCelsius={useCelsius}
          />
        </View>

        {/* Alarm targets row */}
        <View style={styles.alarmRow}>
          <GlassCard style={styles.alarmCard} padding={12} borderRadius={radius.md}>
            <Text style={styles.alarmLabel}>DAB</Text>
            <Text style={[styles.alarmValue, { color: colors.activeAmber }]}>
              {formatTemp(settings.dabAlarmF, useCelsius)}
            </Text>
          </GlassCard>
          <GlassCard style={styles.alarmCard} padding={12} borderRadius={radius.md}>
            <Text style={styles.alarmLabel}>DUNK</Text>
            <Text style={[styles.alarmValue, { color: '#5AD9FF' }]}>
              {formatTemp(settings.dunkAlarmF, useCelsius)}
            </Text>
          </GlassCard>
        </View>

        {/* Session info (visible when active) */}
        {sessionActive && (
          <GlassCard style={styles.sessionCard} padding={14} borderRadius={radius.md}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionStat}>
                <Text style={styles.sessionLabel}>SESSION</Text>
                <Text style={styles.sessionValue}>
                  {Math.floor(elapsedSec / 60)}:
                  {String(elapsedSec % 60).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionStat}>
                <Text style={styles.sessionLabel}>PEAK</Text>
                <Text style={styles.sessionValue}>{formatTemp(peakF, useCelsius)}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <ChromeButton
            label="Settings"
            onPress={() => router.push('/(connected)/settings')}
            variant="secondary"
            style={styles.actionButton}
          />
          <ChromeButton
            label="Scan"
            onPress={() => router.push('/(modals)/scan')}
            variant="ghost"
            style={styles.actionButton}
          />
        </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  connectionBar: {
    alignSelf: 'stretch',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  connectionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pendingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  orbContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  alarmCard: {
    flex: 1,
    alignItems: 'center',
  },
  alarmLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  alarmValue: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  sessionCard: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sessionStat: {
    alignItems: 'center',
    flex: 1,
  },
  sessionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  sessionValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sessionDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.crystalEdge,
    marginHorizontal: spacing.md,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
