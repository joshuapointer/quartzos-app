import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePressScale } from '../../../src/design/hooks/usePressScale';
import Svg, { Circle as SvgCircle, Polyline } from 'react-native-svg';

import { colors } from '../../../src/design/tokens';
import type { SessionRecord } from '../../../src/db/sessions';
import { SessionCard } from './components/SessionCard';
import { HISTORY_FILTERS } from './constants';
import type { HistoryFilter, SettingsState } from './types';

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const press = usePressScale();
  return (
    <Animated.View style={press.animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.filterChip, active && styles.filterChipActive]}
      >
        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HistoryContent({
  sessions,
  settings,
  filter,
  onFilterChange,
  listProgress,
  onStartSession,
}: {
  sessions: SessionRecord[];
  settings: SettingsState;
  filter: HistoryFilter;
  onFilterChange: (f: HistoryFilter) => void;
  listProgress: SharedValue<number>;
  onStartSession: () => void;
}) {
  const ctaPress = usePressScale();
  const filtered = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions.filter((s) => {
      if (s.startedAt < sevenDaysAgo) return false;
      if (filter === 'all') return true;
      if (filter === 'high') return s.peakTempF >= 540;
      if (filter === 'mid') return s.peakTempF >= 500 && s.peakTempF < 540;
      if (filter === 'low') return s.peakTempF < 500;
      return true;
    });
  }, [sessions, filter]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.panelScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>History</Text>
          <Text style={styles.panelSubtitle}>{sessions.length} sessions · last 7 days</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {HISTORY_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onPress={() => { onFilterChange(f.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          />
        ))}
      </ScrollView>

      {filtered.map((session, index) => (
        <SessionCard
          key={session.id}
          session={session}
          index={index}
          listProgress={listProgress}
          settings={settings}
        />
      ))}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Svg width={44} height={44} viewBox="0 0 44 44" style={styles.emptyGlyph}>
            <SvgCircle cx={22} cy={22} r={16} stroke={colors.quartzBright} strokeWidth={1} fill="none" />
            <Polyline
              points="6,22 12,22 15,30 19,10 23,26 27,18 30,22 38,22"
              stroke={colors.quartzBright}
              strokeWidth={1}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.emptyStateText}>No sessions yet</Text>
          <Text style={styles.emptyStateSub}>Start a session to see your history</Text>
          <Animated.View style={ctaPress.animatedStyle}>
            <Pressable
              onPress={onStartSession}
              onPressIn={ctaPress.onPressIn}
              onPressOut={ctaPress.onPressOut}
              style={styles.emptyStateCta}
            >
              <Text style={styles.emptyStateCtaText}>Start a Session</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panelScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 0,
  },
  panelTitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 34,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.68,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    borderWidth: 0,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.surface4,
  },
  filterChipText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.bone50,
  },
  filterChipTextActive: {
    color: colors.bone100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyGlyph: {
    opacity: 0.28,
    marginBottom: 18,
  },
  emptyStateText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 24,
    color: colors.bone50,
    letterSpacing: -0.48,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 12,
    color: colors.bone35,
    letterSpacing: 0.4,
    marginBottom: 24,
  },
  emptyStateCta: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: colors.firedAmber + '1F',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCtaText: {
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ember,
  },
});
