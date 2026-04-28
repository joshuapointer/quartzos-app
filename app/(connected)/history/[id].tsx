import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';

import { QBackground, GlassCard, ChromeButton } from '../../../src/design';
import { colors, spacing, radius, fonts } from '../../../src/design/tokens';
import * as sessionsDb from '../../../src/db/sessions';
import type { SessionRecord, TempSample } from '../../../src/db/sessions';
import * as presetsDb from '../../../src/db/presets';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const CHART_PAD = { top: 12, bottom: 24, left: 8, right: 8 };

function formatDuration(startedAt: number, endedAt: number | null): string {
  const durationMs = (endedAt ?? Date.now()) - startedAt;
  const totalSec = Math.floor(durationMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

interface TempChartProps {
  samples: TempSample[];
  dabAlarmF: number;
  dunkAlarmF: number;
}

function TempChart({ samples, dabAlarmF, dunkAlarmF }: TempChartProps) {
  if (samples.length < 2) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>Not enough data</Text>
      </View>
    );
  }

  const innerW = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;

  const temps = samples.map((s) => s.f);
  const times = samples.map((s) => s.t);
  const minT = times[0];
  const maxT = times[times.length - 1];
  const timeRange = maxT - minT || 1;

  const allTemps = [...temps, dabAlarmF, dunkAlarmF];
  const minF = Math.max(0, Math.min(...allTemps) - 20);
  const maxF = Math.max(...allTemps) + 20;
  const tempRange = maxF - minF || 1;

  const toX = (t: number) =>
    CHART_PAD.left + ((t - minT) / timeRange) * innerW;
  const toY = (f: number) =>
    CHART_PAD.top + (1 - (f - minF) / tempRange) * innerH;

  // Build polyline points string
  const points = samples
    .map((s) => `${toX(s.t).toFixed(1)},${toY(s.f).toFixed(1)}`)
    .join(' ');

  // Alarm Y positions
  const dabY = toY(dabAlarmF);
  const dunkY = toY(dunkAlarmF);

  // Find alert crossing points
  const crossings: Array<{ x: number; y: number; kind: 'dab' | 'dunk' }> = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    // Dab alarm crossing (rising through dabAlarmF)
    if (prev.f < dabAlarmF && curr.f >= dabAlarmF) {
      crossings.push({ x: toX(curr.t), y: toY(dabAlarmF), kind: 'dab' });
    }
    // Dunk alarm crossing (falling through dunkAlarmF)
    if (prev.f > dunkAlarmF && curr.f <= dunkAlarmF) {
      crossings.push({ x: toX(curr.t), y: toY(dunkAlarmF), kind: 'dunk' });
    }
  }

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
      {/* Dab alarm line */}
      <Line
        x1={CHART_PAD.left}
        y1={dabY}
        x2={CHART_WIDTH - CHART_PAD.right}
        y2={dabY}
        stroke={colors.firedAmber}
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <SvgText
        x={CHART_WIDTH - CHART_PAD.right - 2}
        y={dabY - 3}
        fill={colors.firedAmber}
        fontSize={9}
        textAnchor="end"
        opacity={0.85}
      >
        {dabAlarmF}°
      </SvgText>

      {/* Dunk alarm line */}
      <Line
        x1={CHART_PAD.left}
        y1={dunkY}
        x2={CHART_WIDTH - CHART_PAD.right}
        y2={dunkY}
        stroke={colors.coldSlate}
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <SvgText
        x={CHART_WIDTH - CHART_PAD.right - 2}
        y={dunkY - 3}
        fill={colors.coldSlate}
        fontSize={9}
        textAnchor="end"
        opacity={0.85}
      >
        {dunkAlarmF}°
      </SvgText>

      {/* Temp curve */}
      <Polyline
        points={points}
        fill="none"
        stroke={colors.firedAmber}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Alert crossing markers */}
      {crossings.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={4}
          fill={c.kind === 'dab' ? colors.firedAmber : colors.coldSlate}
          stroke={colors.bgDeep}
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

const chartStyles = StyleSheet.create({
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.boneGhost,
    fontSize: 13,
  },
});

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [presetName, setPresetName] = useState<string | null>(null);

  useEffect(() => {
    void sessionsDb.getById(id).then((rec) => {
      if (rec) {
        setSession(rec);
        setNotes(rec.notes ?? '');
        if (rec.presetId) {
          void presetsDb.getById(rec.presetId).then((p) => {
            if (p) setPresetName(p.name);
          });
        }
      }
    });
  }, [id]);

  const handleSaveNotes = useCallback(async () => {
    if (!session) return;
    setSavingNotes(true);
    try {
      await sessionsDb.addNote(session.id, notes);
    } finally {
      setSavingNotes(false);
    }
  }, [session, notes]);

  if (!session) {
    return (
      <View style={styles.root}>
        <QBackground />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Text style={styles.loadingText}>Pulling the curve</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <QBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Back button */}
            <ChromeButton
              label="← Back"
              onPress={() => router.back()}
              variant="ghost"
              style={styles.backButton}
            />

            {/* Header card */}
            <GlassCard style={styles.card} padding={16} borderRadius={radius.md}>
              <Text style={styles.dateText}>
                {format(new Date(session.startedAt), 'EEEE, MMMM d yyyy · h:mm a')}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(session.startedAt, session.endedAt)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>PEAK</Text>
                  <Text style={[styles.statValue, styles.peakValue]}>
                    {session.peakTempF}°F
                  </Text>
                </View>
                {session.presetId && (
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>PRESET</Text>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {presetName ?? 'Session'}
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>

            {/* Chart card */}
            <GlassCard style={styles.card} padding={12} borderRadius={radius.md}>
              <Text style={styles.sectionLabel}>Temperature Curve</Text>
              <TempChart
                samples={session.samples}
                dabAlarmF={session.dabAlarmF}
                dunkAlarmF={session.dunkAlarmF}
              />
            </GlassCard>

            {/* Notes card */}
            <GlassCard style={styles.card} padding={16} borderRadius={radius.md}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Mark this session…"
                placeholderTextColor={colors.boneGhost}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <ChromeButton
                label="Save Notes"
                onPress={() => { void handleSaveNotes(); }}
                variant="secondary"
                loading={savingNotes}
                style={styles.saveNotesButton}
              />
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  kav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.boneGhost,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 0,
  },
  card: {
    alignSelf: 'stretch',
  },
  dateText: {
    color: colors.boneMid,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    ...fonts.labelCaps,
    color: colors.boneGhost,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.bone100,
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  peakValue: {
    color: colors.firedAmber,
    fontSize: 22,
    fontWeight: '700',
  },
  sectionLabel: {
    ...fonts.labelCaps,
    color: colors.boneMid,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.bone100,
    fontSize: 15,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  saveNotesButton: {
    alignSelf: 'stretch',
  },
});
