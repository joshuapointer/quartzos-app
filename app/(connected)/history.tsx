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
import Svg, { Path, Defs, LinearGradient as SVGGradient, Stop } from 'react-native-svg';

import { QBackground, ChromeButton, FloatingHeader } from '../../src/design';
import { colors, spacing, fonts } from '../../src/design/tokens';
import * as sessionsDb from '../../src/db/sessions';
import type { SessionRecord } from '../../src/db/sessions';
import * as presetsDb from '../../src/db/presets';
import type { Preset } from '../../src/db/presets';

function formatDuration(startedAt: number, endedAt: number | null): string {
  const durationMs = (endedAt ?? Date.now()) - startedAt;
  const totalSec = Math.floor(durationMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

interface InlineSparklineProps {
  samples: sessionsDb.TempSample[];
  width?: number;
  height?: number;
}

function InlineSparkline({ samples, width = 70, height = 16 }: InlineSparklineProps) {
  if (samples.length < 2) return <View style={{ width, height }} />;

  const downsampled: number[] = [];
  for (let i = 0; i < samples.length; i += 10) {
    downsampled.push(samples[i].f);
  }
  const dots = downsampled.slice(0, 30);

  const maxVal = Math.max(...dots, 1);
  const minVal = Math.min(...dots);
  const range = maxVal - minVal || 1;

  const svgW = 300;
  const svgH = 60;

  const points = dots.map((val, i) => {
    const x = dots.length === 1 ? svgW / 2 : (i / (dots.length - 1)) * svgW;
    const normalized = (val - minVal) / range;
    const y = svgH - 4 - normalized * (svgH - 8);
    return { x, y };
  });

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  let fillPath = linePath;
  fillPath += ` L ${points[points.length - 1].x} ${svgH}`;
  fillPath += ` L ${points[0].x} ${svgH}`;
  fillPath += ' Z';

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="none"
    >
      <Defs>
        <SVGGradient id="inlineSparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.firedAmber} stopOpacity={0.22} />
          <Stop offset="1" stopColor={colors.firedAmber} stopOpacity={0} />
        </SVGGradient>
      </Defs>
      <Path d={fillPath} fill="url(#inlineSparkFill)" />
      <Path
        d={linePath}
        stroke={colors.emberBright}
        strokeWidth={2.4}
        strokeOpacity={0.85}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface JournalRowProps {
  session: SessionRecord;
  isActive?: boolean;
  presetName: string;
  onPress: () => void;
}

function JournalRow({ session, isActive, presetName, onPress }: JournalRowProps) {
  const date = new Date(session.startedAt);
  const dayOfMonth = format(date, 'd');
  const month = format(date, 'MMM').toUpperCase();
  const time = format(date, 'h:mm a');
  const duration = formatDuration(session.startedAt, session.endedAt);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.row, isActive && styles.rowActive]}>
      {/* Left: tabular date stack */}
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{dayOfMonth}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateTime}>{time}</Text>
      </View>

      {/* Right: name + stats */}
      <View style={styles.contentCol}>
        <View style={styles.nameLine}>
          <Text style={[styles.presetName, isActive && styles.presetNameActive]} numberOfLines={1} ellipsizeMode="tail">
            {presetName}
          </Text>
          {isActive && (
            <Text style={styles.activePill}>ACTIVE</Text>
          )}
        </View>
        <View style={styles.statsLine}>
          <Text style={styles.statsText}>
            {session.peakTempF}°F{'·'}{duration}
          </Text>
          <InlineSparkline samples={session.samples} width={70} height={16} />
        </View>
      </View>

      {/* Trailing chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      {/* Ember-tinted circle glyph */}
      <View style={styles.emptyGlyph} />
      <Text style={styles.emptyPrimary}>The journal is empty.</Text>
      <Text style={styles.emptySecondary}>Your next session lands here.</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);

  const load = useCallback(async () => {
    const [allSessions, allPresets] = await Promise.all([
      sessionsDb.getAll(),
      presetsDb.getAll(),
    ]);
    setSessions(allSessions);
    setPresets(allPresets);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const presetNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of presets) map.set(p.id, p.name);
    return map;
  }, [presets]);

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
      title: 'Quartzie Session History',
    });
  }, []);

  return (
    <View style={styles.root}>
      <QBackground />
      <FloatingHeader />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Journal</Text>
              <Text style={styles.subheading}>
                Past sessions, peak temps, and the curves that got you there.
              </Text>
            </View>
            <View style={styles.headerActions}>
              <ChromeButton
                label="Export"
                onPress={handleExport}
                variant="ghost"
                disabled={sessions.length === 0}
              />
              <ChromeButton
                label="Clear All"
                onPress={handleClearAll}
                variant="ghost"
                disabled={sessions.length === 0}
              />
            </View>
          </View>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            sessions.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item, index }) => (
            <JournalRow
              session={item}
              isActive={index === 0 && item.endedAt === null}
              presetName={
                (item.presetId && presetNameById.get(item.presetId)) || 'Session'
              }
              onPress={() => router.push(`/(connected)/history/${item.id}`)}
            />
          )}
        />
      </SafeAreaView>
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
    paddingBottom: 120,
    paddingHorizontal: spacing.md,
  },
  pageHeader: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  pageHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  heading: {
    ...fonts.h1,
    color: colors.onSurface,
    marginBottom: 4,
  },
  subheading: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
    flexWrap: 'wrap',
  },
  listContent: {
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: 'flex-start',
    paddingTop: '20%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    opacity: 0.55,
  },

  // Journal row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 10,
    paddingRight: spacing.sm,
  },
  rowActive: {
    backgroundColor: colors.firedAmber + '1F',
  },
  dateCol: {
    width: 44,
    alignItems: 'center',
    marginRight: 14,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.bone100,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  dateMonth: {
    ...fonts.labelCaps,
    color: colors.boneMid,
    lineHeight: 14,
  },
  dateTime: {
    ...fonts.caption,
    fontSize: 10,
    color: colors.boneGhost,
    lineHeight: 14,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  presetName: {
    flex: 1,
    ...fonts.body,
    fontWeight: '400',
    color: colors.bone100,
  },
  presetNameActive: {
    fontWeight: '600',
  },
  activePill: {
    ...fonts.labelCaps,
    color: colors.firedAmber,
    lineHeight: 12,
  },
  statsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsText: {
    ...fonts.caption,
    color: colors.boneMid,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 18,
    color: colors.boneGhost,
    marginLeft: spacing.sm,
    lineHeight: 24,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 12,
  },
  emptyGlyph: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.firedAmber + '26',
    borderWidth: 1.5,
    borderColor: colors.firedAmber + '66',
    shadowColor: colors.firedAmber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  emptyPrimary: {
    ...fonts.body,
    color: colors.boneMid,
    textAlign: 'center',
  },
  emptySecondary: {
    ...fonts.caption,
    color: colors.boneGhost,
    textAlign: 'center',
  },
});
