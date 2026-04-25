import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SVGGradient, Stop } from 'react-native-svg';

import { GlassCard } from '../GlassCard';
import { ChromeButton } from '../ChromeButton';
import { useThemeColors } from '../../ThemeContext';
import { colors, spacing, radius, fonts } from '../../tokens';
import * as sessionsDb from '../../../db/sessions';
import type { SessionRecord } from '../../../db/sessions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    return { icon: 'local-fire-department', label: 'High Temp', color: colors.warning };
  }
  if (peakTempF >= 400) {
    return { icon: 'auto-awesome', label: 'Mid Temp', color: colors.onSurfaceVariant };
  }
  return { icon: 'water-drop', label: 'Low Temp', color: colors.secondary };
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

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
          <Stop offset="0" stopColor="rgba(181,161,255,0.2)" stopOpacity={1} />
          <Stop offset="1" stopColor="rgba(181,161,255,0)" stopOpacity={1} />
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

// ─── SessionCard ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionRecord;
  onPress: () => void;
}

function SessionCard({ session, onPress }: SessionCardProps) {
  const themeColors = useThemeColors();
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
        <Text style={[styles.dateText, { color: themeColors.onSurface }]}>
          {formatDateLabel(session.startedAt)}
        </Text>

        {/* Peak temp display */}
        <View style={styles.peakTempBlock}>
          <Text style={[styles.peakTempValue, { color: themeColors.onSurface }]}>
            {session.peakTempF}
          </Text>
          <Text style={[styles.peakTempUnit, { color: themeColors.onSurface }]}>°F</Text>
        </View>
        <Text style={[styles.peakTempLabel, { color: themeColors.onSurfaceVariant }]}>
          PEAK TEMP
        </Text>

        {/* Sparkline */}
        <Sparkline samples={session.samples} />

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.durationText, { color: themeColors.onSurfaceVariant }]}>
            {formatDuration(session.startedAt, session.endedAt)}
          </Text>
          <View style={styles.chevronButton}>
            <MaterialIcons name="chevron-right" size={18} color={themeColors.onSurfaceVariant} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_CHIPS = ['All', 'High', 'Low'] as const;

// ─── HistorySheetContent ──────────────────────────────────────────────────────

export function HistorySheetContent() {
  const themeColors = useThemeColors();
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

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 1) return s.peakTempF >= 500;
    if (activeFilter === 2) return s.peakTempF < 450;
    return true;
  });

  const listHeader = (
    <View style={styles.listHeader}>
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
                  ? [styles.chipActive, { borderColor: themeColors.primaryContainer }]
                  : [styles.chipInactive, { backgroundColor: themeColors.glassFill, borderColor: themeColors.glassBorder }],
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? themeColors.primaryContainer : themeColors.onSurfaceVariant },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ChromeButton
        label="Clear All"
        onPress={handleClearAll}
        variant="ghost"
        disabled={sessions.length === 0}
      />
    </View>
  );

  return (
    <FlatList
      data={filteredSessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: themeColors.outline }]}>
          No sessions recorded yet.
        </Text>
      }
      renderItem={({ item }) => (
        <SessionCard
          session={item}
          onPress={() => router.push(`/(connected)/history/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: spacing.sm,
  },
  chipsScroll: {
    flex: 1,
    flexGrow: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: 'rgba(207,193,255,0.15)',
  },
  chipInactive: {},
  chipText: {
    ...fonts.caption,
    fontWeight: '500',
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
    fontVariant: ['tabular-nums'],
  },
  peakTempUnit: {
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 8,
    marginLeft: 2,
  },
  peakTempLabel: {
    ...fonts.labelCaps,
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
    fontVariant: ['tabular-nums'],
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(202,196,211,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
