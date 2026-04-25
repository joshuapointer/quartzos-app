import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';

import { QuartzBackground, GlassCard, ChromeButton } from '../../src/design';
import { colors, spacing, radius, fonts } from '../../src/design/tokens';
import * as sessionsDb from '../../src/db/sessions';
import type { SessionRecord } from '../../src/db/sessions';

function formatDuration(startedAt: number, endedAt: number | null): string {
  const durationMs = (endedAt ?? Date.now()) - startedAt;
  const totalSec = Math.floor(durationMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface SparklineProps {
  samples: sessionsDb.TempSample[];
}

function Sparkline({ samples }: SparklineProps) {
  if (samples.length === 0) {
    return <View style={sparklineStyles.row} />;
  }

  // Downsample: every 10th sample
  const downsampled: number[] = [];
  for (let i = 0; i < samples.length; i += 10) {
    downsampled.push(samples[i].f);
  }

  // Take at most 30 dots for display
  const dots = downsampled.slice(0, 30);
  const maxVal = Math.max(...dots, 1);
  const minVal = Math.min(...dots);
  const range = maxVal - minVal || 1;

  return (
    <View style={sparklineStyles.row}>
      {dots.map((val, i) => {
        const normalized = (val - minVal) / range;
        const height = 2 + normalized * 22; // 2–24px
        return (
          <View
            key={i}
            style={[
              sparklineStyles.dot,
              {
                height,
                backgroundColor: colors.activeAmber,
                opacity: 0.5 + normalized * 0.5,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const sparklineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 2,
    marginVertical: spacing.sm,
  },
  dot: {
    width: 3,
    borderRadius: 1.5,
  },
});

interface SessionCardProps {
  session: SessionRecord;
  onPress: () => void;
}

function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card} padding={14} borderRadius={radius.md}>
        {/* Date/time + duration */}
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            {format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}
          </Text>
          <Text style={styles.durationText}>
            {formatDuration(session.startedAt, session.endedAt)}
          </Text>
        </View>

        {/* Peak temp */}
        <Text style={styles.peakTemp}>{session.peakTempF}°F</Text>

        {/* Sparkline */}
        <Sparkline samples={session.samples} />
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const load = useCallback(async () => {
    const all = await sessionsDb.getAll();
    setSessions(all);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Delete all session history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await sessionsDb.clearAll();
            setSessions([]);
          },
        },
      ],
    );
  }, []);

  const handleExport = useCallback(async () => {
    const json = await sessionsDb.exportAllJson();
    await Share.share({
      message: json,
      title: 'QuartzOS Session History',
    });
  }, []);

  return (
    <View style={styles.root}>
      <QuartzBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Text style={styles.heading}>History</Text>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sessions recorded yet.</Text>
          }
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onPress={() => router.push(`/(connected)/history/${item.id}`)}
            />
          )}
        />

        <View style={styles.bottomActions}>
          <ChromeButton
            label="Clear All"
            onPress={handleClearAll}
            variant="ghost"
            style={styles.actionButton}
            disabled={sessions.length === 0}
          />
          <ChromeButton
            label="Export JSON"
            onPress={() => { void handleExport(); }}
            variant="secondary"
            style={styles.actionButton}
            disabled={sessions.length === 0}
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
  heading: {
    color: colors.textPrimary,
    ...fonts.h1,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  card: {
    alignSelf: 'stretch',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  durationText: {
    color: colors.textDim,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  peakTemp: {
    color: colors.activeAmber,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
