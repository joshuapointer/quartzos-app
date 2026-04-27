import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Share,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SVGGradient, Stop } from 'react-native-svg';

import { QBackground, GlassCard, ChromeButton, FloatingHeader } from '../../src/design';
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

function formatDateLabel(ts: number): string {
  const date = new Date(ts);
  const timeStr = format(date, 'h:mm a');
  if (isToday(date)) return `${timeStr} Today`;
  if (isYesterday(date)) return `${timeStr} Yesterday`;
  return `${timeStr} ${format(date, 'MMM d')}`;
}

function getCategoryFromTemp(peakTempF: number): {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
} {
  if (peakTempF >= 500) {
    return { icon: 'flare', label: 'DEEP FOCUS', color: colors.primary };
  }
  if (peakTempF >= 400) {
    return { icon: 'auto-awesome', label: 'RESTORATION', color: colors.onSurfaceVariant };
  }
  return { icon: 'water-drop', label: 'LOW TEMP', color: colors.secondary };
}

interface SparklineProps {
  samples: sessionsDb.TempSample[];
}

function Sparkline({ samples }: SparklineProps) {
  if (samples.length === 0) {
    return <View style={{ height: 60 }} />;
  }

  // Downsample: every 10th sample, max 30 points
  const downsampled: number[] = [];
  for (let i = 0; i < samples.length; i += 10) {
    downsampled.push(samples[i].f);
  }
  const dots = downsampled.slice(0, 30);

  const maxVal = Math.max(...dots, 1);
  const minVal = Math.min(...dots);
  const range = maxVal - minVal || 1;

  const svgHeight = 60;
  const svgWidth = 300; // logical width; SVG will scale via preserveAspectRatio

  const points = dots.map((val, i) => {
    const x = dots.length === 1 ? svgWidth / 2 : (i / (dots.length - 1)) * svgWidth;
    const normalized = (val - minVal) / range;
    const y = svgHeight - 4 - normalized * (svgHeight - 8);
    return { x, y };
  });

  // Build smooth cubic bezier path for line
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Build fill path (same curve, then close down to bottom)
  let fillPath = linePath;
  fillPath += ` L ${points[points.length - 1].x} ${svgHeight}`;
  fillPath += ` L ${points[0].x} ${svgHeight}`;
  fillPath += ' Z';

  return (
    <Svg
      width="100%"
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="none"
      style={styles.sparklineSvg}
    >
      <Defs>
        <SVGGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(232,146,64,0.20)" stopOpacity={1} />
          <Stop offset="1" stopColor="rgba(232,146,64,0)" stopOpacity={1} />
        </SVGGradient>
      </Defs>
      <Path d={fillPath} fill="url(#sparkFill)" />
      <Path
        d={linePath}
        stroke={colors.primaryContainer}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface SessionCardProps {
  session: SessionRecord;
  onPress: () => void;
}

function SessionCard({ session, onPress }: SessionCardProps) {
  const category = getCategoryFromTemp(session.peakTempF);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card} padding={16} borderRadius={radius.md}>
        {/* Category row */}
        <View style={styles.categoryRow}>
          <MaterialIcons name={category.icon} size={14} color={category.color} />
          <Text style={[styles.categoryLabel, { color: category.color }]}>
            {category.label}
          </Text>
        </View>

        {/* Date header */}
        <Text style={styles.dateText}>{formatDateLabel(session.startedAt)}</Text>

        {/* Peak temp display */}
        <View style={styles.peakTempBlock}>
          <Text style={styles.peakTempValue}>{session.peakTempF}</Text>
          <Text style={styles.peakTempUnit}>°F</Text>
        </View>
        <Text style={styles.peakTempLabel}>PEAK TEMP</Text>

        {/* Sparkline */}
        <Sparkline samples={session.samples} />

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.durationText}>
            {formatDuration(session.startedAt, session.endedAt)}
          </Text>
          <View style={styles.chevronButton}>
            <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const FILTER_CHIPS = ['All Sessions', 'High Temp', 'Low Temp'];

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState(0);

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
      title: 'Quartzie Session History',
    });
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 1) return s.peakTempF >= 500;
    if (activeFilter === 2) return s.peakTempF < 450;
    return true;
  });

  return (
    <View style={styles.root}>
      <QBackground />
      <FloatingHeader />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Session Logs</Text>
              <Text style={styles.subheading}>
                Review your recent rituals and temperature profiles.
              </Text>
            </View>
            <ChromeButton
              label="Clear All"
              onPress={handleClearAll}
              variant="ghost"
              disabled={sessions.length === 0}
            />
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {FILTER_CHIPS.map((label, i) => {
            const active = i === activeFilter;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveFilter(i)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  active
                    ? styles.chipActive
                    : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primaryContainer : colors.onSurfaceVariant },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList
          data={filteredSessions}
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
    marginBottom: 32,
    marginTop: 8,
  },
  pageHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
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
  chipsScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: 'rgba(232,146,64,0.12)',
    borderColor: colors.primaryContainer,
  },
  chipInactive: {
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
  },
  chipText: {
    ...fonts.caption,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  card: {
    alignSelf: 'stretch',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  categoryLabel: {
    ...fonts.labelCaps,
    fontSize: 11,
  },
  dateText: {
    ...fonts.h2,
    color: colors.onSurface,
    marginBottom: 12,
  },
  peakTempBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  peakTempValue: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1.92,
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  peakTempUnit: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.onSurface,
    marginBottom: 8,
    marginLeft: 2,
  },
  peakTempLabel: {
    ...fonts.labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  sparklineSvg: {
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  durationText: {
    ...fonts.body,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(244,237,228,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.outline,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
