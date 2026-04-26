import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
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

import { colors } from '../../src/design/tokens';
import { SessionWalkthrough } from '../../src/design/components/SessionWalkthrough';
import { QBackground } from '../../src/design/components/QBackground';
import { TempDial } from '../../src/design/components/TempDial';
import { QWordmark } from '../../src/design/components/QWordmark';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { formatTemp, fToC, cToF } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import * as sessionsDb from '../../src/db/sessions';
import type { Preset } from '../../src/db/presets';
import type { SessionRecord } from '../../src/db/sessions';
import type { DeviceSettings } from '../../src/ble/types';
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

// ─── Scene ────────────────────────────────────────────────────────────────────

type SceneId = 'session' | 'presets' | 'history' | 'configure';
type HistoryFilter = 'all' | 'high' | 'mid' | 'low';

// ─── Layout constants ─────────────────────────────────────────────────────────

const DIAL_MINI_SCALE = 0.42;
const WORDMARK_H = 40;  // QWordmark intrinsic height (paddingTop:8 + text~24 + paddingBottom:4 + lineHeight)
const NAV_HEIGHT = 72;

// ─── Heat-level color ─────────────────────────────────────────────────────────

function peakTempColor(peakF: number): string {
  if (peakF >= 540) return colors.emberBright;
  if (peakF >= 500) return colors.ember;
  if (peakF >= 460) return '#9B6030';
  return colors.quartzBright;
}

// ─── Preset Glyph SVG ─────────────────────────────────────────────────────────

const GEM_COLORS_ORDERED = ['#7BA8C4', '#9ABDD8', '#C4AC54', '#7EC8A0', '#E07070'];
const GEM_SHAPES = ['diamond', 'circle', 'triangle', 'hexagon', 'diamond'] as const;

function PresetGlyph({ preset }: { preset: Preset }) {
  const idx = preset.iconSlot ?? 0;
  const color = GEM_COLORS_ORDERED[idx % GEM_COLORS_ORDERED.length] ?? GEM_COLORS_ORDERED[0];
  const shape = GEM_SHAPES[idx % 4];
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      {shape === 'diamond' && (
        <Path d="M20 4 L36 20 L20 36 L4 20 Z" fill="none" stroke={color} strokeWidth={1.5} />
      )}
      {shape === 'circle' && (
        <>
          <SvgCircle cx={20} cy={20} r={14} fill="none" stroke={color} strokeWidth={1.5} />
          <SvgCircle cx={20} cy={20} r={6} fill={color} opacity={0.5} />
        </>
      )}
      {shape === 'triangle' && (
        <Path d="M20 6 L34 32 L6 32 Z" fill="none" stroke={color} strokeWidth={1.5} />
      )}
      {shape === 'hexagon' && (
        <Path d="M20 8 L28 12 L32 20 L28 28 L20 32 L12 28 L8 20 L12 12 Z" fill="none" stroke={color} strokeWidth={1.5} />
      )}
    </Svg>
  );
}

// ─── Waveform SVG ─────────────────────────────────────────────────────────────

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

  const firstX = toX(0).toFixed(1);
  const lastX = toX(data.length - 1).toFixed(1);
  const polyPoints = `${firstX},${H} ${points} ${lastX},${H}`;

  const near = data.some((v) => Math.abs(v - target) <= 5);
  const strokeColor = near ? colors.emberBright : colors.ember;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <SvgLine
        x1={0} y1={targetY} x2={W} y2={targetY}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4"
      />
      <Polygon points={polyPoints} fill="url(#waveGrad)" />
      <Polyline points={points} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

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
          colors={value ? [colors.bone100, '#d8cfc2'] : ['#2a2320', colors.surface3]}
          style={styles.toggleThumb}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── TempSlider ───────────────────────────────────────────────────────────────

function TempSlider({
  label, value, min, max, accent, useCelsius, onChange,
}: {
  label: string; value: number; min: number; max: number;
  accent: string; useCelsius: boolean; onChange: (v: number) => void;
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

// ─── SimpleSlider ─────────────────────────────────────────────────────────────

function SimpleSlider({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
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
            style={[styles.stepPip, value === step && styles.stepPipActive]}
          >
            <Text style={[styles.stepPipText, value === step && styles.stepPipTextActive]}>{step}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── SoundRow ─────────────────────────────────────────────────────────────────

function SoundRow({
  label, value, options, onChange,
}: {
  label: string; value: number; options: readonly string[]; onChange: (v: number) => void;
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

// ─── ConfigSection ────────────────────────────────────────────────────────────

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

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({
  label, value, onChange, last,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
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

// ─── PresetCard ───────────────────────────────────────────────────────────────

interface PresetCardProps {
  preset: Preset;
  index: number;
  listProgress: SharedValue<number>;
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  isActive: boolean;
  onApply: (preset: Preset) => void;
}

function PresetCard({ preset, index, listProgress, settings, isActive, onApply }: PresetCardProps) {
  const delay = Math.min(index * 0.1, 0.4);
  const cardStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, (listProgress.value - delay) / (1 - delay || 0.001)));
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 10 }],
    };
  });

  return (
    <Animated.View style={[styles.presetCardOuter, cardStyle]}>
      <LinearGradient
        colors={isActive ? ['#1e170e', '#0f0b06'] : ['#110d0a', '#0a0806']}
        style={styles.presetCard}
      >
        <View style={[StyleSheet.absoluteFillObject, styles.presetCardBorder]} pointerEvents="none" />
        <View style={styles.presetCardLeft}>
          <PresetGlyph preset={preset} />
        </View>
        <View style={styles.presetCardMid}>
          <Text style={styles.presetCardName}>{preset.name}</Text>
          <View style={styles.presetTempPills}>
            <View style={[styles.tempPill, { borderColor: colors.ember }]}>
              <Text style={[styles.tempPillText, { color: colors.ember }]}>
                DAB {formatTemp(preset.settings.dabAlarmF, settings.useCelsius)}
              </Text>
            </View>
            <View style={[styles.tempPill, { borderColor: colors.quartz }]}>
              <Text style={[styles.tempPillText, { color: colors.quartz }]}>
                DUNK {formatTemp(preset.settings.dunkAlarmF, settings.useCelsius)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.presetCardRight}>
          {isActive ? (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => onApply(preset)} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Nav Node Icon ────────────────────────────────────────────────────────────

function NavNodeIcon({ sceneId, active }: { sceneId: SceneId; active: boolean }) {
  const c = active ? colors.emberBright : colors.bone50;

  if (sceneId === 'presets') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M10 2 L18 10 L10 18 L2 10 Z" stroke={c} strokeWidth={1.3} fill="none" />
        <Path d="M10 6 L14 10 L10 14 L6 10 Z" stroke={c} strokeWidth={0.7} fill="none" opacity={0.5} />
        <SvgCircle cx={10} cy={10} r={1.5} fill={c} opacity={0.7} />
      </Svg>
    );
  }

  if (sceneId === 'history') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Polyline
          points="1,10 4,10 6,14 9,4 12,12 14,8 16,10 19,10"
          stroke={c}
          strokeWidth={1.4}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // configure
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <SvgLine x1={3} y1={6} x2={17} y2={6} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgLine x1={3} y1={10} x2={17} y2={10} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgLine x1={3} y1={14} x2={17} y2={14} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
      <SvgCircle cx={7} cy={6} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
      <SvgCircle cx={13} cy={10} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
      <SvgCircle cx={8} cy={14} r={2.2} fill={colors.bgDeep} stroke={c} strokeWidth={1.3} />
    </Svg>
  );
}

// ─── Nav Node ─────────────────────────────────────────────────────────────────

function NavNode({ sceneId, active, onPress }: { sceneId: SceneId; active: boolean; onPress: () => void }) {
  const glow = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    glow.value = withSpring(active ? 1 : 0, { damping: 14, stiffness: 200 });
  }, [active]);

  const iconAnim = useAnimatedStyle(() => ({
    opacity: 0.22 + glow.value * 0.72,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={styles.navNodeTouch}
      hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
    >
      <Animated.View style={iconAnim}>
        <NavNodeIcon sceneId={sceneId} active={active} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── PresetsContent ───────────────────────────────────────────────────────────

function PresetsContent({
  settings,
  presets,
  onApply,
  listProgress,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  presets: Preset[];
  onApply: (preset: Preset) => void;
  listProgress: SharedValue<number>;
}) {
  const floatY = useSharedValue(0);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(floatY); };
  }, [floatY]);

  const isActive = (preset: Preset) =>
    preset.settings.dabAlarmF === settings.dabAlarmF &&
    preset.settings.dunkAlarmF === settings.dunkAlarmF;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.panelScroll}
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

      {presets.map((preset, index) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          index={index}
          listProgress={listProgress}
          settings={settings}
          isActive={isActive(preset)}
          onApply={onApply}
        />
      ))}

      {presets.length === 0 && (
        <View style={styles.emptyState}>
          <Animated.View style={[styles.emptyGlyph, floatStyle]}>
            <Svg width={44} height={44} viewBox="0 0 44 44">
              <Path d="M22 4 L40 22 L22 40 L4 22 Z" stroke={colors.emberBright} strokeWidth={1} fill="none" />
              <Path d="M22 13 L31 22 L22 31 L13 22 Z" stroke={colors.emberBright} strokeWidth={0.5} fill="none" opacity={0.5} />
              <SvgCircle cx={22} cy={22} r={2} fill={colors.emberBright} opacity={0.6} />
            </Svg>
          </Animated.View>
          <Text style={styles.emptyStateText}>No presets yet</Text>
          <Text style={styles.emptyStateSub}>Tap + New to save a session configuration</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── HistoryContent ───────────────────────────────────────────────────────────

const HISTORY_FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High · 540°+' },
  { id: 'mid', label: 'Mid · 500–540°' },
  { id: 'low', label: 'Low · <500°' },
];

function HistoryContent({
  sessions,
  settings,
  filter,
  onFilterChange,
}: {
  sessions: SessionRecord[];
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  filter: HistoryFilter;
  onFilterChange: (f: HistoryFilter) => void;
}) {
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
          <TouchableOpacity
            key={f.id}
            onPress={() => { onFilterChange(f.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={[styles.sessionPeakTemp, { color: peakTempColor(session.peakTempF) }]}>
                {formatTemp(session.peakTempF, settings.useCelsius)}
              </Text>
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
          <Text style={styles.emptyStateSub}>Connect your device to begin</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── ConfigureContent ─────────────────────────────────────────────────────────

function ConfigureContent({
  settings,
  updateSetting,
  dirty,
  markConfirmed,
}: {
  settings: DeviceSettings;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  dirty: boolean;
  markConfirmed: () => void;
}) {
  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (writeDebounceRef.current) clearTimeout(writeDebounceRef.current); };
  }, []);

  const handleUpdate = useCallback(
    <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => {
      updateSetting(key, val);
      if (writeDebounceRef.current) clearTimeout(writeDebounceRef.current);
      writeDebounceRef.current = setTimeout(() => {
        const fresh = useSettingsStore.getState().settings;
        bleManager.writeSettings({ ...fresh, [key]: val }).catch(() => {});
      }, SETTINGS_WRITE_DEBOUNCE_MS);
    },
    [updateSetting],
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.panelScroll, { paddingBottom: 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Configure</Text>
        </View>

        <ConfigSection title="Thresholds">
          <TempSlider
            label="Dab alarm" value={settings.dabAlarmF}
            min={400} max={700} accent={colors.emberBright} useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dabAlarmF', v)}
          />
          <View style={styles.hairline} />
          <TempSlider
            label="Dunk alarm" value={settings.dunkAlarmF}
            min={150} max={400} accent={colors.quartzBright} useCelsius={settings.useCelsius}
            onChange={(v) => handleUpdate('dunkAlarmF', v)}
          />
          <View style={styles.hairline} />
          <ToggleRow
            label="Display in °C" value={settings.useCelsius}
            onChange={(v) => handleUpdate('useCelsius', v)}
          />
          <View style={styles.hairline} />
          <View style={styles.defaultsRow}>
            <TouchableOpacity
              onPress={() => {
                handleUpdate('dabAlarmF', QUARTZ_DAB_ALARM_F);
                handleUpdate('dunkAlarmF', QUARTZ_DUNK_ALARM_F);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Quartz defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleUpdate('dabAlarmF', OPAQUE_DAB_ALARM_F);
                handleUpdate('dunkAlarmF', OPAQUE_DUNK_ALARM_F);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={styles.defaultsBtn}
            >
              <Text style={styles.defaultsBtnText}>Opaque defaults</Text>
            </TouchableOpacity>
          </View>
        </ConfigSection>

        <ConfigSection title="Device">
          <ToggleRow label="Opaque mode" value={settings.opaqueMode} onChange={(v) => handleUpdate('opaqueMode', v)} />
          <ToggleRow label="Sound alert" value={settings.soundAlert} onChange={(v) => handleUpdate('soundAlert', v)} />
          <ToggleRow label="Light alert" value={settings.lightAlert} onChange={(v) => handleUpdate('lightAlert', v)} />
          <ToggleRow label="LED guide" value={settings.ledGuide} onChange={(v) => handleUpdate('ledGuide', v)} />
          <ToggleRow label="Night mode" value={settings.nightMode} onChange={(v) => handleUpdate('nightMode', v)} last />
        </ConfigSection>

        <ConfigSection title="Sound">
          <SimpleSlider
            label="Volume" value={settings.volume} min={1} max={5}
            onChange={(v) => handleUpdate('volume', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Key tone" value={settings.keyTone}
            options={KEY_TONE_LABELS} onChange={(v) => handleUpdate('keyTone', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dab sound" value={settings.dabSound}
            options={DAB_SOUND_LABELS} onChange={(v) => handleUpdate('dabSound', v)}
          />
          <View style={styles.hairline} />
          <SoundRow
            label="Dunk sound" value={settings.dunkSound}
            options={DUNK_SOUND_LABELS} onChange={(v) => handleUpdate('dunkSound', v)}
          />
        </ConfigSection>
      </ScrollView>

      {/* Save bar — sits at the bottom of the panel */}
      <View style={styles.saveBarOuter}>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBarBtn}>
          <LinearGradient
            colors={dirty ? [colors.emberBright, colors.ember] : ['#2a2320', colors.surface3]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBarGradient}
          >
            {dirty ? (
              <Text style={styles.saveBarText}>Save to device</Text>
            ) : (
              <View style={styles.syncedRow}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Path d="M2 7 L5.5 10.5 L12 4" stroke={colors.bone50} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [scene, setScene] = useState<SceneId>('session');
  const sceneRef = useRef<SceneId>('session');
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // ── BLE / Store ────────────────────────────────────────────────────────────
  const tempF = useBleStore((s) => s.liveTempF) ?? 72;
  const connectionState = useBleStore((s) => s.connectionState);
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const dirty = useSettingsStore((s) => s.dirty);
  const markConfirmed = useSettingsStore((s) => s.markConfirmed);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    presetsDb.getAll().then(setPresets).catch(() => {});
    sessionsDb.getAll().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionActive || !startedAt) { setElapsedSec(0); return; }
    const interval = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [sessionActive, startedAt]);

  // ── Layout math ────────────────────────────────────────────────────────────
  const DIAL_FULL = Math.min(screenW - 64, 280);
  const DIAL_MINI = DIAL_FULL * DIAL_MINI_SCALE;
  // translateY that moves dial visual top to 8pt below wordmark
  const DIAL_DELTA_Y = DIAL_FULL * (1 - DIAL_MINI_SCALE) / 2 - 8;
  // panel content sits 16pt below the mini-dial's visual bottom
  const panelTop = insets.top + WORDMARK_H + 8 + DIAL_MINI + 16;
  const panelBottom = NAV_HEIGHT + insets.bottom;

  // ── Animation values ───────────────────────────────────────────────────────
  const dialScale = useSharedValue(1);
  const dialTranslateY = useSharedValue(0);
  const sessionAlpha = useSharedValue(1);
  const panelAlpha = useSharedValue(0);
  const panelTranslateY = useSharedValue(52);
  const listProgress = useSharedValue(0);

  // ── Scene navigation ───────────────────────────────────────────────────────
  const applyScene = useCallback((nextScene: SceneId) => {
    sceneRef.current = nextScene;
    setScene(nextScene);
    if (nextScene !== 'session') {
      listProgress.value = 0;
      listProgress.value = withDelay(200, withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }));
    }
  }, [listProgress]);

  const navigateTo = useCallback((nextScene: SceneId) => {
    const current = sceneRef.current;
    if (nextScene === current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (nextScene === 'session') {
      // Panel → session: fade panel, restore dial, then reveal session
      panelAlpha.value = withTiming(0, { duration: 130 }, (done) => {
        'worklet';
        if (done) runOnJS(applyScene)('session');
      });
      panelTranslateY.value = withTiming(28, { duration: 130 });
      dialScale.value = withDelay(50, withSpring(1, { damping: 16, stiffness: 200 }));
      dialTranslateY.value = withDelay(50, withSpring(0, { damping: 16, stiffness: 200 }));
      sessionAlpha.value = withDelay(180, withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }));

    } else if (current === 'session') {
      // Session → panel: shrink dial, fade session, bloom panel
      sessionAlpha.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      dialScale.value = withDelay(60, withSpring(DIAL_MINI_SCALE, { damping: 18, stiffness: 220 }));
      dialTranslateY.value = withDelay(60, withSpring(-DIAL_DELTA_Y, { damping: 18, stiffness: 220 }));
      panelAlpha.value = 0;
      panelTranslateY.value = 52;
      panelAlpha.value = withDelay(150, withTiming(1, { duration: 230, easing: Easing.out(Easing.quad) }));
      panelTranslateY.value = withDelay(130, withSpring(0, { damping: 16, stiffness: 180 }));
      applyScene(nextScene);

    } else {
      // Panel → panel: cross-fade content, dial stays mini
      panelAlpha.value = withTiming(0, { duration: 110 }, (done) => {
        'worklet';
        if (done) {
          runOnJS(applyScene)(nextScene);
          panelTranslateY.value = 28;
          panelAlpha.value = withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) });
          panelTranslateY.value = withSpring(0, { damping: 16, stiffness: 180 });
        }
      });
      panelTranslateY.value = withTiming(16, { duration: 110 });
    }
  }, [DIAL_DELTA_Y, applyScene, dialScale, dialTranslateY, sessionAlpha, panelAlpha, panelTranslateY]);

  // ── Preset apply ───────────────────────────────────────────────────────────
  const handleApplyPreset = useCallback(async (preset: Preset) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bleManager.writeSettings(preset.settings);
    } catch {
      Alert.alert('Error', 'Failed to apply preset. Is the device connected?');
    }
  }, []);

  // ── Animated styles ────────────────────────────────────────────────────────
  const dialAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dialTranslateY.value }, { scale: dialScale.value }],
  }));

  const sessionContentStyle = useAnimatedStyle(() => ({
    opacity: sessionAlpha.value,
  }));

  const panelContentStyle = useAnimatedStyle(() => ({
    opacity: panelAlpha.value,
    transform: [{ translateY: panelTranslateY.value }],
  }));

  // ── Derived ────────────────────────────────────────────────────────────────
  const elapsedFormatted = sessionActive
    ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
    : '0:00';

  const targetRangeText = `${formatTemp(settings.dabAlarmF - 20, settings.useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, settings.useCelsius)}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <QBackground />

      {/* ── Wordmark header ── */}
      <View style={{ paddingTop: insets.top }}>
        <QWordmark connected={connectionState === 'READY'} />
      </View>

      {/* ── Temperature dial — normal flow, transforms animated ── */}
      <Animated.View style={[styles.dialArea, dialAnimStyle]}>
        <TouchableOpacity
          onPress={() => { if (sceneRef.current !== 'session') navigateTo('session'); }}
          activeOpacity={scene !== 'session' ? 0.82 : 1}
          disabled={scene === 'session'}
          style={styles.dialTouchable}
        >
          <TempDial
            tempF={tempF}
            dabAlarmF={settings.dabAlarmF}
            dunkAlarmF={settings.dunkAlarmF}
            sessionActive={sessionActive}
            useCelsius={settings.useCelsius}
            size={DIAL_FULL}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Session content: metrics + preset bar + start button ── */}
      <Animated.View
        style={[styles.sessionContent, { paddingBottom: NAV_HEIGHT + insets.bottom + 8 }, sessionContentStyle]}
        pointerEvents={scene === 'session' ? 'auto' : 'none'}
      >
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
          <LinearGradient colors={['#1e170e', '#0f0b06']} style={styles.presetBarCard}>
            <View style={[StyleSheet.absoluteFillObject, styles.presetBarBorder]} pointerEvents="none" />
            <View style={styles.presetBarLeft}>
              <View style={styles.presetGemWrap}>
                <Svg width={12} height={12} viewBox="0 0 12 12">
                  <Path d="M6 1 L11 6 L6 11 L1 6 Z" fill={colors.emberBright} />
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigateTo('presets'); }}
              style={styles.presetChangeBtn}
            >
              <Text style={styles.presetChangeBtnText}>Change</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Start session button */}
        <View style={styles.startSessionOuter}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowWalkthrough(true); }}
            activeOpacity={0.82}
            style={styles.startSessionBtn}
          >
            <LinearGradient
              colors={[colors.emberBright, colors.ember]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.startSessionGradient}
            >
              <Svg width={14} height={14} viewBox="0 0 14 14" style={{ marginRight: 8 }}>
                <Path d="M3 2 L12 7 L3 12 Z" fill="#fff" opacity={0.9} />
              </Svg>
              <Text style={styles.startSessionText}>Start Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Panel content: absolutely overlaid, animates in over session area ── */}
      <Animated.View
        style={[
          styles.panelOverlay,
          { top: panelTop, bottom: panelBottom },
          panelContentStyle,
        ]}
        pointerEvents={scene !== 'session' ? 'auto' : 'none'}
      >
        {scene === 'presets' && (
          <PresetsContent
            settings={settings}
            presets={presets}
            onApply={handleApplyPreset}
            listProgress={listProgress}
          />
        )}
        {scene === 'history' && (
          <HistoryContent
            sessions={sessions}
            settings={settings}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
          />
        )}
        {scene === 'configure' && (
          <ConfigureContent
            settings={settings}
            updateSetting={updateSetting}
            dirty={dirty}
            markConfirmed={markConfirmed}
          />
        )}
      </Animated.View>

      {/* ── Ambient navigation nodes ── */}
      <View style={[styles.navBar, { paddingBottom: insets.bottom }]}>
        <NavNode sceneId="presets" active={scene === 'presets'} onPress={() => navigateTo('presets')} />
        <NavNode sceneId="history" active={scene === 'history'} onPress={() => navigateTo('history')} />
        <NavNode sceneId="configure" active={scene === 'configure'} onPress={() => navigateTo('configure')} />
      </View>

      <SessionWalkthrough visible={showWalkthrough} onClose={() => setShowWalkthrough(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },

  // ── Dial ──────────────────────────────────────────────────────────────────
  dialArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dialTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Session content ────────────────────────────────────────────────────────
  sessionContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  metricsOuter: {
    marginBottom: 14,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: colors.bone90,
    letterSpacing: -0.44,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.bone50,
    marginTop: 2,
  },
  metricDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(244,237,228,0.06)',
  },

  // ── Preset bar (session) ───────────────────────────────────────────────────
  presetBarOuter: {
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
    borderColor: colors.glassBorder,
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
    color: colors.bone100,
    letterSpacing: -0.32,
  },
  presetBarSub: {
    fontSize: 10,
    color: colors.bone50,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  presetChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetChangeBtnText: {
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.88,
  },

  // ── Start session button ───────────────────────────────────────────────────
  startSessionOuter: {
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  startSessionBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  startSessionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
  },
  startSessionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Panel overlay ──────────────────────────────────────────────────────────
  panelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  // ── Panel shared ───────────────────────────────────────────────────────────
  panelScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  panelTitle: {
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '400',
    color: colors.bone100,
    letterSpacing: -0.64,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.bone50,
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
    color: colors.ember,
    letterSpacing: 0.2,
  },

  // ── Preset card ────────────────────────────────────────────────────────────
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
    borderColor: colors.glassBorder,
  },
  presetCardLeft: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  presetCardMid: { flex: 1 },
  presetCardName: {
    fontFamily: 'Georgia',
    fontSize: 17,
    color: colors.bone100,
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
    borderColor: colors.emberBright,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.8,
    color: colors.emberBright,
  },
  applyBtn: {
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.10)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  applyBtnText: {
    fontSize: 12,
    color: colors.bone90,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // ── History filters ────────────────────────────────────────────────────────
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
    borderColor: colors.ember,
    backgroundColor: colors.surface3,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: colors.bone100,
    fontWeight: '500',
  },

  // ── Session card (history) ─────────────────────────────────────────────────
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
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionCardDur: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionPeakTemp: {
    fontFamily: 'Georgia',
    fontSize: 24,
    color: colors.bone100,
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
    color: colors.bone35,
    letterSpacing: 0.3,
  },

  // ── Configure panel ────────────────────────────────────────────────────────
  configSection: {
    marginBottom: 24,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.bone50,
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
  sliderRow: { paddingVertical: 14 },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.bone90,
    fontWeight: '400',
  },
  sliderValue: {
    fontFamily: 'Menlo',
    fontSize: 13,
    color: colors.bone50,
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
    backgroundColor: colors.surface3,
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
    color: colors.bone90,
    fontWeight: '400',
  },
  toggleTrack: {
    width: 42,
    height: 25,
    borderRadius: 100,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
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
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  defaultsBtnText: {
    fontSize: 13,
    color: colors.bone50,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  stepPip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPipActive: {
    borderColor: colors.ember,
    backgroundColor: 'rgba(201,115,38,0.15)',
  },
  stepPipText: {
    fontSize: 13,
    color: colors.bone50,
    fontWeight: '400',
  },
  stepPipTextActive: {
    color: colors.emberBright,
    fontWeight: '500',
  },
  soundRow: { paddingVertical: 12 },
  soundRowLabel: {
    fontSize: 14,
    color: colors.bone90,
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
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
  },
  soundPillActive: {
    borderColor: colors.ember,
    backgroundColor: 'rgba(201,115,38,0.12)',
  },
  soundPillText: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.2,
  },
  soundPillTextActive: {
    color: colors.emberBright,
    fontWeight: '500',
  },

  // ── Save bar (configure) ───────────────────────────────────────────────────
  saveBarOuter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
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
    color: colors.bone100,
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
    color: colors.bone50,
  },

  // ── Empty states ───────────────────────────────────────────────────────────
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
    color: colors.bone50,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 13,
    color: colors.bone35,
    letterSpacing: 0.2,
  },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 52,
  },
  navNodeTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
