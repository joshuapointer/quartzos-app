import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle as SvgCircle,
  Polygon,
  Polyline,
  Line as SvgLine,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

import { QBackground } from '../../src/design/components/QBackground';
import { TempDial } from '../../src/design/components/TempDial';
import { QWordmark } from '../../src/design/components/QWordmark';
import { QTabBar, type TabId } from '../../src/design/components/QTabBar';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { formatTemp, fToC, cToF } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import * as sessionsDb from '../../src/db/sessions';
import type { Preset } from '../../src/db/presets';
import type { SessionRecord } from '../../src/db/sessions';
import {
  SETTINGS_WRITE_DEBOUNCE_MS,
  QUARTZ_DAB_ALARM_F,
  QUARTZ_DUNK_ALARM_F,
  OPAQUE_DAB_ALARM_F,
  OPAQUE_DUNK_ALARM_F,
  DAB_SOUND_LABELS,
  DUNK_SOUND_LABELS,
  KEY_TONE_LABELS,
} from '../../src/ble/constants';

// ─── Heat-level color ────────────────────────────────────────────────────────

function peakTempColor(peakF: number): string {
  if (peakF >= 540) return '#E89240';
  if (peakF >= 500) return '#C97326';
  if (peakF >= 460) return '#9B6030';
  return '#9ABDD8';
}

// ─── Preset kind helper ──────────────────────────────────────────────────────

function presetKind(p: Preset): 'quartz' | 'opaque' | 'custom' | 'low' {
  let hash = 0;
  for (const ch of p.name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const kinds = ['quartz', 'opaque', 'custom', 'low'] as const;
  return kinds[Math.abs(hash) % 4];
}

// ─── Preset Glyph SVG ────────────────────────────────────────────────────────

const KIND_COLORS = {
  quartz: '#E89240',
  opaque: '#9ABDD8',
  custom: '#C4AC54',
  low: '#4A7490',
} as const;

function PresetGlyph({ kind }: { kind: 'quartz' | 'opaque' | 'custom' | 'low' }) {
  const color = KIND_COLORS[kind];
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      {kind === 'quartz' && (
        <Path
          d="M20 4 L36 20 L20 36 L4 20 Z"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
      )}
      {kind === 'opaque' && (
        <>
          <SvgCircle cx={20} cy={20} r={14} fill="none" stroke={color} strokeWidth={1.5} />
          <SvgCircle cx={20} cy={20} r={6} fill={color} opacity={0.5} />
        </>
      )}
      {kind === 'custom' && (
        <Path
          d="M20 6 L34 32 L6 32 Z"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
      )}
      {kind === 'low' && (
        <Path
          d="M20 8 L28 12 L32 20 L28 28 L20 32 L12 28 L8 20 L12 12 Z"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
        />
      )}
    </Svg>
  );
}

// ─── Waveform SVG ────────────────────────────────────────────────────────────

function Waveform({ data, target }: { data: number[]; target: number }) {
  const W = 320;
  const H = 50;

  if (!data || data.length < 2) {
    return <View style={{ width: '100%', height: H }} />;
  }

  const minVal = Math.min(...data) - 10;
  const maxVal = Math.max(...data) + 10;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => (i / (data.length - 1)) * W;
  const toY = (v: number) => H - ((v - minVal) / range) * H;

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const targetY = toY(target);

  // Build polygon fill (close at bottom)
  const firstX = toX(0).toFixed(1);
  const lastX = toX(data.length - 1).toFixed(1);
  const polyPoints = `${firstX},${H} ${points} ${lastX},${H}`;

  // Determine stroke color: ember bright if any reading within 5° of target
  const near = data.some((v) => Math.abs(v - target) <= 5);
  const strokeColor = near ? '#E89240' : '#C97326';

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <SvgLine
        x1={0}
        y1={targetY}
        x2={W}
        y2={targetY}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <Polygon points={polyPoints} fill="url(#waveGrad)" />
      <Polyline points={points} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const translateX = useSharedValue(value ? 16 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 16 : 0, { damping: 14, stiffness: 220, mass: 0.6 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
      activeOpacity={0.8}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <Animated.View style={[styles.toggleThumbWrap, thumbStyle]}>
        <LinearGradient
          colors={value ? ['#f4ede4', '#d8cfc2'] : ['#2a2320', '#1c1714']}
          style={styles.toggleThumb}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── TempSlider component ────────────────────────────────────────────────────

function TempSlider({
  label,
  value,
  min,
  max,
  accent,
  useCelsius,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  accent: string;
  useCelsius: boolean;
  onChange: (v: number) => void;
}) {
  const progress = (value - min) / (max - min);

  const handleDecrease = () => {
    const step = useCelsius ? cToF(fToC(value) - 5) : value - 5;
    onChange(Math.max(min, step));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleIncrease = () => {
    const step = useCelsius ? cToF(fToC(value) + 5) : value + 5;
    onChange(Math.min(max, step));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color: accent }]}>{formatTemp(value, useCelsius)}</Text>
      </View>
      <View style={styles.sliderTrackRow}>
        <TouchableOpacity onPress={handleDecrease} style={styles.sliderBtn}>
          <Text style={[styles.sliderBtnText, { color: accent }]}>−</Text>
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <TouchableOpacity onPress={handleIncrease} style={styles.sliderBtn}>
          <Text style={[styles.sliderBtnText, { color: accent }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SimpleSlider component ──────────────────────────────────────────────────

function SimpleSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step}
            onPress={() => { onChange(step); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[
              styles.stepPip,
              value === step && styles.stepPipActive,
            ]}
          >
            <Text style={[styles.stepPipText, value === step && styles.stepPipTextActive]}>{step}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── SoundRow component ───────────────────────────────────────────────────────

function SoundRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: readonly string[];
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.soundRow}>
      <Text style={styles.soundRowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundPills}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => { onChange(idx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.soundPill, value === idx && styles.soundPillActive]}
          >
            <Text style={[styles.soundPillText, value === idx && styles.soundPillTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── ConfigSection wrapper ────────────────────────────────────────────────────

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.configSection}>
      <Text style={styles.configSectionTitle}>{title}</Text>
      <LinearGradient colors={['#100e0c', '#0a0806']} style={styles.configCard}>
        {children}
      </LinearGradient>
    </View>
  );
}

// ─── ToggleRow component ──────────────────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleRowLabel}>{label}</Text>
        <Toggle value={value} onChange={onChange} />
      </View>
      {!last && <View style={styles.hairline} />}
    </>
  );
}

// ─── Theme swatch ─────────────────────────────────────────────────────────────

const THEME_SWATCHES = [
  { id: 'warm-mineral' as const, label: 'Warm Mineral', colors: ['#3D1E0A', '#9B6030'] as const },
  { id: 'smoke' as const, label: 'Smoke', colors: ['#1a1a1a', '#4a4a4a'] as const },
  { id: 'cool-shell' as const, label: 'Cool Shell', colors: ['#0a1a28', '#2A3C52'] as const },
];

// ─── SessionPanel ─────────────────────────────────────────────────────────────

function SessionPanel({ onOpenPresets }: { onOpenPresets?: () => void }) {
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const tempF = useBleStore((s) => s.liveTempF) ?? 72;
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);

  const [elapsedSec, setElapsedSec] = useState(0);

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

  const dialSize = Math.min(screenW - 64, 310);
  const targetRangeText = `${formatTemp(settings.dabAlarmF - 20, settings.useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, settings.useCelsius)}`;

  return (
    <View style={styles.sessionRoot}>
      <View style={[styles.sessionContent, { paddingTop: insets.top + 8 }]}>
        {/* Wordmark */}
        <QWordmark connected={connectionState === 'READY'} />

        {/* TempDial centered */}
        <View style={styles.dialContainer}>
          <TempDial
            tempF={tempF}
            dabAlarmF={settings.dabAlarmF}
            dunkAlarmF={settings.dunkAlarmF}
            sessionActive={sessionActive}
            useCelsius={settings.useCelsius}
            size={dialSize}
          />
        </View>

        {/* Metrics strip */}
        <View style={styles.metricsOuter}>
          <View style={styles.hairline} />
          <View style={styles.metricsStrip}>
            <View style={styles.metricCol}>
              <Text style={styles.metricValue}>{elapsedFormatted}</Text>
              <Text style={styles.metricLabel}>SESSION</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricValue}>{formatTemp(peakF || tempF, settings.useCelsius)}</Text>
              <Text style={styles.metricLabel}>PEAK</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {targetRangeText}
              </Text>
              <Text style={styles.metricLabel}>WINDOW</Text>
            </View>
          </View>
        </View>

        {/* Active preset card */}
        <View style={styles.presetBarOuter}>
          <LinearGradient
            colors={['#1e170e', '#0f0b06']}
            style={styles.presetBarCard}
          >
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.presetBarBorder,
              ]}
              pointerEvents="none"
            />
            <View style={styles.presetBarLeft}>
              <View style={styles.presetGemWrap}>
                <Svg width={12} height={12} viewBox="0 0 12 12">
                  <Path d="M6 1 L11 6 L6 11 L1 6 Z" fill="#E89240" />
                </Svg>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.presetBarName}>
                  {formatTemp(settings.dabAlarmF, settings.useCelsius)}
                </Text>
                <Text style={styles.presetBarSub}>Active preset</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenPresets?.();
              }}
              style={styles.presetChangeBtn}
            >
              <Text style={styles.presetChangeBtnText}>Change</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

// ─── PresetsPanel ─────────────────────────────────────────────────────────────

function PresetsPanel() {
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const connectionState = useBleStore((s) => s.connectionState);
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    presetsDb.getAll().then(setPresets).catch(() => {});
  }, []);

  const handleApply = useCallback(async (preset: Preset) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bleManager.writeSettings(preset.settings);
    } catch {
      Alert.alert('Error', 'Failed to apply preset. Is the device connected?');
    }
  }, []);

  const isActive = (preset: Preset) =>
    preset.settings.dabAlarmF === settings.dabAlarmF &&
    preset.settings.dunkAlarmF === settings.dunkAlarmF;

  return (
    <View style={styles.panelRoot}>
      <View style={{ paddingTop: insets.top }}>
        <QWordmark connected={connectionState === 'READY'} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Presets</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(connected)/presets/new');
            }}
            style={styles.newBtn}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {presets.map((preset) => {
          const kind = presetKind(preset);
          const active = isActive(preset);
          return (
            <View key={preset.id} style={styles.presetCardOuter}>
              <LinearGradient
                colors={active ? ['#1e170e', '#0f0b06'] : ['#110d0a', '#0a0806']}
                style={styles.presetCard}
              >
                <View style={[StyleSheet.absoluteFillObject, styles.presetCardBorder]} pointerEvents="none" />
                <View style={styles.presetCardLeft}>
                  <PresetGlyph kind={kind} />
                </View>
                <View style={styles.presetCardMid}>
                  <Text style={styles.presetCardName}>{preset.name}</Text>
                  <View style={styles.presetTempPills}>
                    <View style={[styles.tempPill, { borderColor: '#C97326' }]}>
                      <Text style={[styles.tempPillText, { color: '#C97326' }]}>
                        DAB {formatTemp(preset.settings.dabAlarmF, settings.useCelsius)}
                      </Text>
                    </View>
                    <View style={[styles.tempPill, { borderColor: '#7BA8C4' }]}>
                      <Text style={[styles.tempPillText, { color: '#7BA8C4' }]}>
                        DUNK {formatTemp(preset.settings.dunkAlarmF, settings.useCelsius)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.presetCardRight}>
                  {active ? (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleApply(preset)}
                      style={styles.applyBtn}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}

        {presets.length === 0 && (
          <View style={styles.emptyState}>
            <Svg width={44} height={44} viewBox="0 0 44 44" style={styles.emptyGlyph}>
              <Path d="M22 4 L40 22 L22 40 L4 22 Z" stroke="#E89240" strokeWidth={1} fill="none" />
              <Path d="M22 13 L31 22 L22 31 L13 22 Z" stroke="#E89240" strokeWidth={0.5} fill="none" opacity={0.5} />
              <SvgCircle cx={22} cy={22} r={2} fill="#E89240" opacity={0.6} />
            </Svg>
            <Text style={styles.emptyStateText}>No presets yet</Text>
            <Text style={styles.emptyStateSub}>Tap + New to save a session configuration</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── HistoryPanel ─────────────────────────────────────────────────────────────

type HistoryFilter = 'all' | 'high' | 'mid' | 'low';

function HistoryPanel() {
  const insets = useSafeAreaInsets();
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    sessionsDb.getAll().then(setSessions).catch(() => {});
  }, []);

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

  const FILTERS: { id: HistoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High · 540°+' },
    { id: 'mid', label: 'Mid · 500–540°' },
    { id: 'low', label: 'Low · <500°' },
  ];

  const formatDuration = (s: SessionRecord) => {
    if (!s.endedAt) return '–';
    const sec = Math.round((s.endedAt - s.startedAt) / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.panelRoot}>
      <View style={{ paddingTop: insets.top }}>
        <QWordmark connected={connectionState === 'READY'} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>History</Text>
            <Text style={styles.panelSubtitle}>{sessions.length} sessions · last 7 days</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => { setFilter(f.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Session cards */}
        {filtered.map((session) => {
          const dur = formatDuration(session);
          const waveData = session.samples.map((s) => s.f);
          return (
            <View key={session.id} style={styles.sessionCardOuter}>
              <LinearGradient colors={['#100e0c', '#0a0806']} style={styles.sessionCard}>
                <View style={[StyleSheet.absoluteFillObject, styles.sessionCardBorder]} pointerEvents="none" />
                <View style={styles.sessionCardHeader}>
                  <Text style={styles.sessionCardDate}>{formatDate(session.startedAt)} · {formatTime(session.startedAt)}</Text>
                  <Text style={styles.sessionCardDur}>{dur}</Text>
                </View>
                <Text style={[styles.sessionPeakTemp, { color: peakTempColor(session.peakTempF) }]}>{formatTemp(session.peakTempF, settings.useCelsius)}</Text>
                <View style={styles.waveformWrap}>
                  <Waveform data={waveData} target={session.dabAlarmF} />
                </View>
                <View style={styles.sessionTimeRange}>
                  <Text style={styles.sessionTimeMono}>0:00</Text>
                  <Text style={styles.sessionTimeMono}>{dur}</Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Svg width={44} height={44} viewBox="0 0 44 44" style={styles.emptyGlyph}>
              <SvgCircle cx={22} cy={22} r={16} stroke="#9ABDD8" strokeWidth={1} fill="none" />
              <Polyline
                points="6,22 12,22 15,30 19,10 23,26 27,18 30,22 38,22"
                stroke="#9ABDD8"
                strokeWidth={1}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.emptyStateText}>No sessions yet</Text>
            <Text style={styles.emptyStateSub}>Connect your device to begin</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── ConfigurePanel ───────────────────────────────────────────────────────────

function ConfigurePanel() {
  const insets = useSafeAreaInsets();
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const dirty = useSettingsStore((s) => s.dirty);
  const markConfirmed = useSettingsStore((s) => s.markConfirmed);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const theme = useSettingsStore((s) => s.theme);

  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdate = useCallback(
    <K extends keyof typeof settings>(key: K, val: (typeof settings)[K]) => {
      updateSetting(key, val);
      if (writeDebounceRef.current) clearTimeout(writeDebounceRef.current);
      writeDebounceRef.current = setTimeout(() => {
        bleManager.writeSettings({ ...settings, [key]: val }).catch(() => {});
      }, SETTINGS_WRITE_DEBOUNCE_MS);
    },
    [settings, updateSetting],
  );

  const handleSave = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bleManager.writeSettings(settings);
      markConfirmed();
    } catch {
      Alert.alert('Error', 'Failed to save settings. Is the device connected?');
    }
  }, [settings, markConfirmed]);

  const handleQuartzDefaults = useCallback(() => {
    handleUpdate('dabAlarmF', QUARTZ_DAB_ALARM_F);
    handleUpdate('dunkAlarmF', QUARTZ_DUNK_ALARM_F);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [handleUpdate]);

  const handleOpaqueDefaults = useCallback(() => {
    handleUpdate('dabAlarmF', OPAQUE_DAB_ALARM_F);
    handleUpdate('dunkAlarmF', OPAQUE_DUNK_ALARM_F);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [handleUpdate]);

  return (
    <View style={styles.panelRoot}>
      <View style={{ paddingTop: insets.top }}>
        <QWordmark connected={connectionState === 'READY'} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Configure</Text>
        </View>

        {/* Thresholds */}
        <ConfigSection title="Thresholds">
          <TempSlider
            label="Dab alarm"
            value={settings.dabAlarmF}
            min={400}
            max={700}
            accent="#E89240"
            useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dabAlarmF', v)}
          />
          <View style={styles.hairline} />
          <TempSlider
            label="Dunk alarm"
            value={settings.dunkAlarmF}
            min={150}
            max={400}
            accent="#9ABDD8"
            useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dunkAlarmF', v)}
          />
          <View style={styles.hairline} />
          <ToggleRow
            label="Display in °C"
            value={settings.useCelsius}
            onChange={(v) => handleUpdate('useCelsius', v)}
          />
          <View style={styles.hairline} />
          <View style={styles.defaultsRow}>
            <TouchableOpacity
              onPress={handleQuartzDefaults}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Quartz defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpaqueDefaults}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Opaque defaults</Text>
            </TouchableOpacity>
          </View>
        </ConfigSection>

        {/* Device */}
        <ConfigSection title="Device">
          <ToggleRow label="Opaque mode" value={settings.opaqueMode} onChange={(v) => handleUpdate('opaqueMode', v)} />
          <ToggleRow label="Sound alert" value={settings.soundAlert} onChange={(v) => handleUpdate('soundAlert', v)} />
          <ToggleRow label="Light alert" value={settings.lightAlert} onChange={(v) => handleUpdate('lightAlert', v)} />
          <ToggleRow label="LED guide" value={settings.ledGuide} onChange={(v) => handleUpdate('ledGuide', v)} />
          <ToggleRow label="Night mode" value={settings.nightMode} onChange={(v) => handleUpdate('nightMode', v)} last />
        </ConfigSection>

        {/* Sound */}
        <ConfigSection title="Sound">
          <SimpleSlider
            label="Volume"
            value={settings.volume}
            min={1}
            max={5}
            onChange={(v) => handleUpdate('volume', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Key tone"
            value={settings.keyTone}
            options={KEY_TONE_LABELS}
            onChange={(v) => handleUpdate('keyTone', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dab sound"
            value={settings.dabSound}
            options={DAB_SOUND_LABELS}
            onChange={(v) => handleUpdate('dabSound', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dunk sound"
            value={settings.dunkSound}
            options={DUNK_SOUND_LABELS}
            onChange={(v) => handleUpdate('dunkSound', v)}
          />
        </ConfigSection>

        {/* Appearance */}
        <ConfigSection title="Appearance">
          <View style={styles.swatchRow}>
            {THEME_SWATCHES.map((swatch) => (
              <TouchableOpacity
                key={swatch.id}
                onPress={() => { setTheme(swatch.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.swatchItem, theme === swatch.id && styles.swatchItemActive]}
              >
                <LinearGradient
                  colors={[...swatch.colors]}
                  style={styles.swatchGradient}
                />
                <Text style={[styles.swatchLabel, theme === swatch.id && styles.swatchLabelActive]}>
                  {swatch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ConfigSection>
      </ScrollView>

      {/* Save bar — sits above the tab bar */}
      <View style={[styles.saveBarOuter, { bottom: Math.max(100, insets.bottom + 84) }]}>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBarBtn}>
          <LinearGradient
            colors={dirty ? ['#E89240', '#C97326'] : ['#2a2320', '#1c1714']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBarGradient}
          >
            {dirty ? (
              <Text style={styles.saveBarText}>Save to device</Text>
            ) : (
              <View style={styles.syncedRow}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Path d="M2 7 L5.5 10.5 L12 4" stroke="#9e907e" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.syncedText}>SYNCED</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('session');
  const panelOpacity = useSharedValue(1);

  const panelStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: panelOpacity.value,
  }));

  useEffect(() => {
    panelOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [activeTab]);

  const handleTabChange = useCallback((tab: TabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    panelOpacity.value = withTiming(0, { duration: 70, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(setActiveTab)(tab);
    });
  }, []);

  return (
    <View style={styles.root}>
      <QBackground />

      <Animated.View style={panelStyle}>
        {activeTab === 'session' && <SessionPanel onOpenPresets={() => handleTabChange('presets')} />}
        {activeTab === 'presets' && <PresetsPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'configure' && <ConfigurePanel />}
      </Animated.View>

      <QTabBar active={activeTab} onChange={handleTabChange} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050403',
  },

  // Session panel
  sessionRoot: {
    flex: 1,
  },
  sessionContent: {
    flex: 1,
    paddingBottom: 110,
  },
  dialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
  },
  metricsOuter: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: '#e8dfd2',
    letterSpacing: -0.44,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: '#9e907e',
    marginTop: 2,
  },
  metricDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(244,237,228,0.06)',
  },

  // Preset bar (session panel)
  presetBarOuter: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  presetBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  presetBarBorder: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.08)',
  },
  presetBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetGemWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(232,146,64,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBarName: {
    fontFamily: 'Georgia',
    fontSize: 16,
    color: '#f4ede4',
    letterSpacing: -0.32,
  },
  presetBarSub: {
    fontSize: 10,
    color: '#9e907e',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  presetChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetChangeBtnText: {
    fontSize: 11,
    color: '#9e907e',
    letterSpacing: 0.88,
  },

  // Shared panel
  panelRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  panelTitle: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    color: '#f4ede4',
    letterSpacing: -0.64,
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#9e907e',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  newBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C97326',
    letterSpacing: 0.2,
  },

  // Preset card
  presetCardOuter: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 22,
  },
  presetCardBorder: {
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.08)',
  },
  presetCardLeft: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  presetCardMid: {
    flex: 1,
  },
  presetCardName: {
    fontFamily: 'Georgia',
    fontSize: 17,
    color: '#f4ede4',
    letterSpacing: -0.34,
    marginBottom: 6,
  },
  presetTempPills: {
    flexDirection: 'row',
    gap: 6,
  },
  tempPill: {
    borderWidth: 0.5,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tempPillText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    fontFamily: 'Menlo',
  },
  presetCardRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  activePill: {
    borderWidth: 0.5,
    borderColor: '#E89240',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.8,
    color: '#E89240',
  },
  applyBtn: {
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  applyBtnText: {
    fontSize: 12,
    color: '#e8dfd2',
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // History filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(28,23,20,0.6)',
  },
  filterChipActive: {
    borderColor: '#C97326',
    backgroundColor: '#1c1714',
  },
  filterChipText: {
    fontSize: 12,
    color: '#9e907e',
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: '#f4ede4',
    fontWeight: '500',
  },

  // Session card (history)
  sessionCardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  sessionCard: {
    borderRadius: 18,
    padding: 16,
  },
  sessionCardBorder: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionCardDate: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#9e907e',
    letterSpacing: 0.3,
  },
  sessionCardDur: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: '#9e907e',
    letterSpacing: 0.3,
  },
  sessionPeakTemp: {
    fontFamily: 'Georgia',
    fontSize: 24,
    color: '#f4ede4',
    letterSpacing: -0.48,
    marginBottom: 10,
  },
  waveformWrap: {
    width: '100%',
    height: 50,
    marginBottom: 6,
  },
  sessionTimeRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionTimeMono: {
    fontFamily: 'Menlo',
    fontSize: 10,
    color: '#6d6050',
    letterSpacing: 0.3,
  },

  // Configure panel
  configSection: {
    marginBottom: 24,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: '#9e907e',
    marginBottom: 8,
    marginLeft: 2,
  },
  configCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
  },
  hairline: {
    height: 0.5,
    backgroundColor: 'rgba(244,237,228,0.06)',
  },
  sliderRow: {
    paddingVertical: 14,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#e8dfd2',
    fontWeight: '400',
  },
  sliderValue: {
    fontFamily: 'Menlo',
    fontSize: 13,
    color: '#9e907e',
    letterSpacing: 0.3,
  },
  sliderTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderBtn: {
    width: 28,
    height: 28,
    borderRadius: 100,
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '300',
  },
  sliderTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#2a2320',
    borderRadius: 100,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 100,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRowLabel: {
    fontSize: 14,
    color: '#e8dfd2',
    fontWeight: '400',
  },
  toggleTrack: {
    width: 42,
    height: 25,
    borderRadius: 100,
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.08)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: 'rgba(232,146,64,0.20)',
    borderColor: 'rgba(232,146,64,0.30)',
  },
  toggleThumbWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  defaultsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  defaultsBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.08)',
  },
  defaultsBtnText: {
    fontSize: 13,
    color: '#9e907e',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  stepPip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPipActive: {
    borderColor: '#C97326',
    backgroundColor: 'rgba(201,115,38,0.15)',
  },
  stepPipText: {
    fontSize: 13,
    color: '#9e907e',
    fontWeight: '400',
  },
  stepPipTextActive: {
    color: '#E89240',
    fontWeight: '500',
  },
  soundRow: {
    paddingVertical: 12,
  },
  soundRowLabel: {
    fontSize: 14,
    color: '#e8dfd2',
    fontWeight: '400',
    marginBottom: 8,
  },
  soundPills: {
    flexDirection: 'row',
    gap: 6,
  },
  soundPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#1c1714',
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
  },
  soundPillActive: {
    borderColor: '#C97326',
    backgroundColor: 'rgba(201,115,38,0.12)',
  },
  soundPillText: {
    fontSize: 12,
    color: '#9e907e',
    letterSpacing: 0.2,
  },
  soundPillTextActive: {
    color: '#E89240',
    fontWeight: '500',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  swatchItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  swatchItemActive: {},
  swatchGradient: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
  },
  swatchLabel: {
    fontSize: 10,
    color: '#9e907e',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  swatchLabelActive: {
    color: '#e8dfd2',
    fontWeight: '500',
  },
  saveBarOuter: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
  },
  saveBarBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBarGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4ede4',
    letterSpacing: 0.4,
  },
  syncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncedText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.8,
    color: '#9e907e',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyGlyph: {
    opacity: 0.28,
    marginBottom: 18,
  },
  emptyStateText: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: '#9e907e',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#6d6050',
    letterSpacing: 0.2,
  },
});
