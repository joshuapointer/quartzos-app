import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

import { colors, gradients } from '../../src/design/tokens';
import { SurfaceCard } from '../../src/design/components/SurfaceCard';
import { SessionWalkthrough } from '../../src/design/components/SessionWalkthrough';
import { NewPresetWizard } from '../../src/design/components/NewPresetWizard';
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

type SceneId = 'session' | 'presets' | 'history' | 'configure' | 'walkthrough' | 'new-preset';
type HistoryFilter = 'all' | 'high' | 'mid' | 'low';

// ─── Layout constants ─────────────────────────────────────────────────────────

const DIAL_MINI_SCALE = 0.42;
const WORDMARK_H = 40;  // QWordmark intrinsic height (paddingTop:8 + text~24 + paddingBottom:4 + lineHeight)
const NAV_HEIGHT = 72;

// ─── Spring constants (smooth, DR ≈ 0.90–1.0) ──────────────────────────────

const SPRING_DIAL = { damping: 28, stiffness: 200, mass: 1 } as const;
const SPRING_PANEL = { damping: 24, stiffness: 180, mass: 1 } as const;

// ─── Heat-level color ─────────────────────────────────────────────────────────

function peakTempColor(peakF: number): string {
  if (peakF >= 540) return colors.emberBright;
  if (peakF >= 500) return colors.ember;
  if (peakF >= 460) return '#9B6030';
  return colors.quartzBright;
}

// ─── Preset Glyph SVG ─────────────────────────────────────────────────────────

const GEM_COLORS_ORDERED = ['#7BA8C4', '#9ABDD8', '#C4AC54', '#7EC8A0', '#E07070'];

function GemDot({ idx }: { idx: number }) {
  const color = GEM_COLORS_ORDERED[idx % GEM_COLORS_ORDERED.length] ?? GEM_COLORS_ORDERED[0]!;
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
}

// ─── Waveform SVG ─────────────────────────────────────────────────────────────

const Waveform = React.memo(function Waveform({ data, target }: { data: number[]; target: number }) {
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
});

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const translateX = useSharedValue(value ? 16 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 16 : 0, { damping: 22, stiffness: 200, mass: 1 });
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
      <SurfaceCard borderRadius={16} contentStyle={styles.configCardContent}>
        {children}
      </SurfaceCard>
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
  isApplying: boolean;
  onApply: (preset: Preset) => Promise<void>;
}

const PresetCard = React.memo(function PresetCard({ preset, index, listProgress, settings, isActive, isApplying, onApply }: PresetCardProps) {
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
      <View style={[styles.presetCard, isActive && styles.presetCardActive]}>
        <View
          style={[StyleSheet.absoluteFillObject, styles.presetCardBorder, isActive && styles.presetCardBorderActive]}
          pointerEvents="none"
        />
        <View style={styles.presetCardLeft}>
          <GemDot idx={preset.iconSlot ?? 0} />
        </View>
        <View style={styles.presetCardMid}>
          <Text style={styles.presetCardName} numberOfLines={1}>{preset.name}</Text>
          <View style={styles.presetTempRow}>
            <Text style={styles.presetTempDab}>DAB {formatTemp(preset.settings.dabAlarmF, settings.useCelsius)}</Text>
            <Text style={styles.presetTempDunk}>  DUNK {formatTemp(preset.settings.dunkAlarmF, settings.useCelsius)}</Text>
          </View>
        </View>
        <View style={styles.presetCardRight}>
          {isActive ? (
            <Text style={styles.activePillText}>ACTIVE</Text>
          ) : (
            <TouchableOpacity
              onPress={() => onApply(preset)}
              style={styles.applyBtn}
              disabled={isApplying}
              activeOpacity={0.75}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={colors.emberBright} />
              ) : (
                <Text style={styles.applyBtnText}>Apply</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

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

// ─── Nav Node label map ────────────────────────────────────────────────────────

const NAV_LABELS: Record<string, string> = {
  presets: 'PRESETS',
  history: 'HISTORY',
  configure: 'TUNE',
};

// ─── Nav Node ─────────────────────────────────────────────────────────────────

function NavNode({ sceneId, active, onPress }: { sceneId: SceneId; active: boolean; onPress: () => void }) {
  const glow = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    glow.value = withSpring(active ? 1 : 0, { damping: 22, stiffness: 180 });
  }, [active]);

  const iconAnim = useAnimatedStyle(() => ({
    opacity: 0.22 + glow.value * 0.72,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const label = NAV_LABELS[sceneId] ?? sceneId.toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={styles.navNodeTouch}
      hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
    >
      <Animated.View style={[iconAnim, styles.navNodeInner]}>
        <NavNodeIcon sceneId={sceneId} active={active} />
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── PresetsContent ───────────────────────────────────────────────────────────

function PresetsContent({
  settings,
  presets,
  activePresetId,
  onApply,
  listProgress,
  onNewPreset,
  sessionActive,
  onBackToSession,
}: {
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  presets: Preset[];
  activePresetId: string | null;
  onApply: (preset: Preset) => Promise<void>;
  listProgress: SharedValue<number>;
  onNewPreset: () => void;
  sessionActive: boolean;
  onBackToSession: () => void;
}) {
  const floatY = useSharedValue(0);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

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

  const handleApply = async (preset: Preset) => {
    setApplyingId(preset.id);
    setApplyError(null);
    try {
      await onApply(preset);
    } catch {
      setApplyError("Couldn't reach device");
      setApplyingId(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.panelScroll}
        showsVerticalScrollIndicator={false}
      >
        {sessionActive && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBackToSession(); }}
            style={styles.backToSessionBtn}
            activeOpacity={0.7}
          >
            <Svg width={12} height={12} viewBox="0 0 12 12" style={{ marginRight: 4 }}>
              <Path d="M8 2 L4 6 L8 10" stroke={colors.bone35} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.backToSessionText}>back to session</Text>
          </TouchableOpacity>
        )}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Presets</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNewPreset();
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
            isActive={preset.id === activePresetId}
            isApplying={applyingId === preset.id}
            onApply={handleApply}
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
            <Text style={styles.emptyStateSub}>Tap + New to save your temperatures as a preset</Text>
          </View>
        )}
      </ScrollView>

      {applyError !== null && (
        <View style={styles.applyErrorToast}>
          <Text style={styles.applyErrorText}>{applyError}</Text>
          <TouchableOpacity onPress={() => setApplyError(null)} style={styles.applyErrorDismiss}>
            <Text style={styles.applyErrorDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Session card formatters (module scope — no re-creation per render) ───────

function formatDuration(s: SessionRecord): string {
  if (!s.endedAt) return '–';
  const sec = Math.round((s.endedAt - s.startedAt) / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── SessionCard ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionRecord;
  index: number;
  listProgress: SharedValue<number>;
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
}

const SessionCard = React.memo(function SessionCard({ session, index, listProgress, settings }: SessionCardProps) {
  const delay = Math.min(index * 0.1, 0.4);
  const cardStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, (listProgress.value - delay) / (1 - delay || 0.001)));
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 10 }],
    };
  });

  const dur = formatDuration(session);
  const waveData = session.samples.map((s) => s.f);

  return (
    <Animated.View style={[styles.sessionCardOuter, cardStyle]}>
      <LinearGradient colors={gradients.cardNeutral} style={styles.sessionCard}>
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
    </Animated.View>
  );
});

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
  listProgress,
  onStartSession,
}: {
  sessions: SessionRecord[];
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  filter: HistoryFilter;
  onFilterChange: (f: HistoryFilter) => void;
  listProgress: SharedValue<number>;
  onStartSession: () => void;
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
          <TouchableOpacity
            onPress={onStartSession}
            style={styles.emptyStateCta}
            activeOpacity={0.75}
          >
            <Text style={styles.emptyStateCtaText}>Start a Session</Text>
          </TouchableOpacity>
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
  writeDebounceRef,
}: {
  settings: DeviceSettings;
  updateSetting: <K extends keyof DeviceSettings>(key: K, val: DeviceSettings[K]) => void;
  dirty: boolean;
  markConfirmed: () => void;
  writeDebounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const syncedScale = useSharedValue(dirty ? 0 : 1);
  const syncedAnimStyle = useAnimatedStyle(() => ({
    opacity: syncedScale.value,
    transform: [{ scale: 0.72 + syncedScale.value * 0.28 }],
  }));

  useEffect(() => {
    if (!dirty) {
      syncedScale.value = 0;
      syncedScale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.6 });
    }
  }, [dirty, syncedScale]);

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
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await bleManager.writeSettings(settings);
      markConfirmed();
    } catch {
      setSaveError("Couldn't save — is the device connected?");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, settings, markConfirmed]);

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

        <ConfigSection title="Temperatures">
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
        {saveError !== null && (
          <View style={[styles.applyErrorToast, { marginBottom: 8 }]}>
            <Text style={styles.applyErrorText}>{saveError}</Text>
            <TouchableOpacity onPress={() => setSaveError(null)} style={styles.applyErrorDismiss}>
              <Text style={styles.applyErrorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBarBtn} disabled={isSaving}>
          <LinearGradient
            colors={dirty ? [colors.emberBright, colors.ember] : [colors.surface4, colors.surface3]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBarGradient}
          >
            {dirty ? (
              isSaving ? (
                <ActivityIndicator size="small" color={colors.bone100} />
              ) : (
                <Text style={styles.saveBarText}>Save to device</Text>
              )
            ) : (
              <Animated.View style={[styles.syncedRow, syncedAnimStyle]}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Path d="M2 7 L5.5 10.5 L12 4" stroke={colors.bone50} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.syncedText}>SYNCED</Text>
              </Animated.View>
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
  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const refreshSessions = useCallback(() => {
    sessionsDb.getAll().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    presetsDb.getAll().then(setPresets).catch(() => {});
    refreshSessions();
  }, [refreshSessions]);

  // Refresh history whenever a session ends. BleManager flips active=false
  // BEFORE its async sessionsDb.end() write completes, so we refresh once
  // immediately (catches any prior writes) and again after a short delay
  // to read the just-persisted endedAt + peakTempF + samples.
  useEffect(() => {
    if (sessionActive) return;
    refreshSessions();
    const t = setTimeout(refreshSessions, 600);
    return () => clearTimeout(t);
  }, [sessionActive, refreshSessions]);

  // Refresh history when the user navigates to the History panel or returns
  // from the walkthrough — covers cases where the BLE-driven end happened
  // while the user was on a different scene.
  useEffect(() => {
    if (scene === 'history' || scene === 'session') refreshSessions();
  }, [scene, refreshSessions]);

  useEffect(() => {
    if (!sessionActive || !startedAt) { setElapsedSec(0); return; }
    const interval = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [sessionActive, startedAt]);

  const thermalPulse = useSharedValue(0);
  const thermalHot = useSharedValue(0);

  useEffect(() => {
    thermalPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(thermalPulse); };
  }, [thermalPulse]);

  useEffect(() => {
    const isNear = tempF >= settings.dabAlarmF - 20 && tempF <= settings.dabAlarmF + 40;
    thermalHot.value = withTiming(isNear ? 1 : 0, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [tempF, settings.dabAlarmF, thermalHot]);

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
  const navAlpha = useSharedValue(1);
  const dialGlow = useSharedValue(0);
  const startSessionPress = useSharedValue(1);

  // ── Scene navigation ───────────────────────────────────────────────────────
  const applyScene = useCallback((nextScene: SceneId) => {
    sceneRef.current = nextScene;
    setScene(nextScene);
    const isPanelScene = nextScene === 'presets' || nextScene === 'history' || nextScene === 'configure';
    if (isPanelScene) {
      listProgress.value = 0;
      listProgress.value = withDelay(200, withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }));
    }
  }, [listProgress]);

  const navigateTo = useCallback((nextScene: SceneId) => {
    const current = sceneRef.current;
    if (nextScene === current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isFocused = (s: SceneId) => s === 'walkthrough' || s === 'new-preset';

    if (nextScene === 'session') {
      // Any panel → session
      panelAlpha.value = withTiming(0, { duration: 130 }, (done) => {
        'worklet';
        if (done) runOnJS(applyScene)('session');
      });
      panelTranslateY.value = withTiming(28, { duration: 130 });
      dialScale.value = withDelay(50, withSpring(1, SPRING_DIAL));
      dialTranslateY.value = withDelay(50, withSpring(0, SPRING_DIAL));
      sessionAlpha.value = withDelay(180, withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }));
      if (isFocused(current)) {
        navAlpha.value = withDelay(200, withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }));
      }

    } else if (current === 'session') {
      // Session → any panel scene
      sessionAlpha.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      dialScale.value = withDelay(60, withSpring(DIAL_MINI_SCALE, SPRING_DIAL));
      dialTranslateY.value = withDelay(60, withSpring(-DIAL_DELTA_Y, SPRING_DIAL));
      panelAlpha.value = 0;
      panelTranslateY.value = 52;
      panelAlpha.value = withDelay(150, withTiming(1, { duration: 230, easing: Easing.out(Easing.quad) }));
      panelTranslateY.value = withDelay(130, withSpring(0, SPRING_PANEL));
      if (isFocused(nextScene)) {
        navAlpha.value = withTiming(0, { duration: 160 });
      }
      applyScene(nextScene);

    } else {
      // Panel → panel cross-fade
      if (isFocused(nextScene) && !isFocused(current)) {
        navAlpha.value = withTiming(0, { duration: 110 });
      } else if (!isFocused(nextScene) && isFocused(current)) {
        navAlpha.value = withTiming(1, { duration: 210 });
      }
      panelAlpha.value = withTiming(0, { duration: 110 }, (done) => {
        'worklet';
        if (done) {
          runOnJS(applyScene)(nextScene);
          panelTranslateY.value = 28;
          panelAlpha.value = withTiming(1, { duration: 210, easing: Easing.out(Easing.quad) });
          panelTranslateY.value = withSpring(0, SPRING_PANEL);
        }
      });
      panelTranslateY.value = withTiming(16, { duration: 110 });
    }
  }, [DIAL_DELTA_Y, applyScene, dialScale, dialTranslateY, sessionAlpha, panelAlpha, panelTranslateY, navAlpha]);

  // ── Preset apply ───────────────────────────────────────────────────────────
  const handleApplyPreset = useCallback(async (preset: Preset) => {
    // Cancel any pending settings debounce so it doesn't fire AFTER the preset write.
    if (writeDebounceRef.current) {
      clearTimeout(writeDebounceRef.current);
      writeDebounceRef.current = null;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await bleManager.writeSettings(preset.settings);
    runOnJS(setActivePresetId)(preset.id);
    updateSetting('dabAlarmF', preset.settings.dabAlarmF);
    updateSetting('dunkAlarmF', preset.settings.dunkAlarmF);
    dialGlow.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
    );
    // Intentionally NOT auto-navigating back; user stays in Presets and
    // chooses when to return. The dial-bloom above confirms the apply.
  }, [dialGlow, updateSetting]);

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

  const navAlphaStyle = useAnimatedStyle(() => ({
    opacity: navAlpha.value,
  }));

  const dialGlowStyle = useAnimatedStyle(() => ({
    opacity: dialGlow.value,
    transform: [{ scale: 1 + dialGlow.value * 0.12 }],
  }));

  const startSessionPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startSessionPress.value }],
  }));

  const thermalRingAmberStyle = useAnimatedStyle(() => ({
    opacity: thermalHot.value * (0.06 + thermalPulse.value * 0.14),
    transform: [{ scale: 0.97 + thermalPulse.value * 0.05 }],
  }));

  const thermalRingQuartzStyle = useAnimatedStyle(() => ({
    opacity: (1 - thermalHot.value) * (0.04 + thermalPulse.value * 0.09),
    transform: [{ scale: 0.98 + thermalPulse.value * 0.04 }],
  }));

  // ── Derived ────────────────────────────────────────────────────────────────
  const elapsedFormatted = sessionActive
    ? `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`
    : '0:00';

  const targetRangeText = `${formatTemp(settings.dabAlarmF - 20, settings.useCelsius)} – ${formatTemp(settings.dabAlarmF + 20, settings.useCelsius)}`;

  const activePreset = presets.find((p) => p.id === activePresetId) ?? null;

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
        <Animated.View
          style={[styles.thermalRingAmber, { width: DIAL_FULL + 80, height: DIAL_FULL + 80, borderRadius: (DIAL_FULL + 80) / 2 }, thermalRingAmberStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.thermalRingQuartz, { width: DIAL_FULL + 80, height: DIAL_FULL + 80, borderRadius: (DIAL_FULL + 80) / 2 }, thermalRingQuartzStyle]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.dialGlowRing, { width: DIAL_FULL + 40, height: DIAL_FULL + 40, borderRadius: (DIAL_FULL + 40) / 2 }, dialGlowStyle]}
          pointerEvents="none"
        />
        <TouchableOpacity
          onPress={() => navigateTo('session')}
          activeOpacity={scene !== 'session' && scene !== 'walkthrough' && scene !== 'new-preset' ? 0.82 : 1}
          disabled={scene === 'session' || scene === 'walkthrough' || scene === 'new-preset'}
          style={styles.dialTouchable}
        >
          <TempDial
            tempF={tempF}
            dabAlarmF={settings.dabAlarmF}
            dunkAlarmF={settings.dunkAlarmF}
            sessionActive={sessionActive}
            useCelsius={settings.useCelsius}
            size={DIAL_FULL}
            scaleState={scene === 'session' ? 'full' : 'mini'}
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
          <LinearGradient colors={gradients.cardActive} style={styles.presetBarCard}>
            <View style={[StyleSheet.absoluteFillObject, styles.presetBarBorder]} pointerEvents="none" />
            <View style={styles.presetBarLeft}>
              <View style={styles.presetGemWrap}>
                <Svg width={12} height={12} viewBox="0 0 12 12">
                  <Path d="M6 1 L11 6 L6 11 L1 6 Z" fill={colors.emberBright} />
                </Svg>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.presetBarName} numberOfLines={1}>
                  {activePreset?.name ?? 'Set a preset'}
                </Text>
                <Text style={styles.presetBarSub}>
                  DAB {formatTemp(settings.dabAlarmF, settings.useCelsius)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigateTo('presets'); }}
              style={styles.presetChangeBtn}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={styles.presetChangeBtnText}>Change</Text>
                <Svg width={12} height={12} viewBox="0 0 12 12">
                  <Path d="M4 2 L8 6 L4 10" stroke={colors.bone50} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Start session button — ghost when standby (<250°F), ember when heating, hidden when active */}
        {!sessionActive && (() => {
          const isHeating = tempF >= 250;
          return (
            <Animated.View style={[styles.startSessionOuter, startSessionPressStyle, !isHeating && styles.startSessionOuterGhost]}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigateTo('walkthrough'); }}
                onPressIn={() => { startSessionPress.value = withSpring(0.97, { damping: 14, stiffness: 220, mass: 0.6 }); }}
                onPressOut={() => { startSessionPress.value = withSpring(1, { damping: 14, stiffness: 220, mass: 0.6 }); }}
                activeOpacity={1}
                style={styles.startSessionBtn}
              >
                {isHeating ? (
                  <LinearGradient
                    colors={[colors.emberBright, colors.ember]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.startSessionGradient}
                  >
                    <Svg width={16} height={16} viewBox="0 0 14 14" style={{ marginRight: 8 }}>
                      <Path d="M3 2 L12 7 L3 12 Z" fill={colors.bone100} opacity={0.9} />
                    </Svg>
                    <Text style={styles.startSessionText}>Start Session</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.startSessionGhostInner}>
                    <Svg width={16} height={16} viewBox="0 0 14 14" style={{ marginRight: 8 }}>
                      <Path d="M3 2 L12 7 L3 12 Z" fill={colors.bone100} opacity={0.9} />
                    </Svg>
                    <Text style={styles.startSessionTextGhost}>Start Session</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })()}
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
            activePresetId={activePresetId}
            onApply={handleApplyPreset}
            listProgress={listProgress}
            onNewPreset={() => navigateTo('new-preset')}
            sessionActive={sessionActive}
            onBackToSession={() => navigateTo('session')}
          />
        )}
        {scene === 'history' && (
          <HistoryContent
            sessions={sessions}
            settings={settings}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
            listProgress={listProgress}
            onStartSession={() => navigateTo('walkthrough')}
          />
        )}
        {scene === 'configure' && (
          <ConfigureContent
            settings={settings}
            updateSetting={updateSetting}
            dirty={dirty}
            markConfirmed={markConfirmed}
            writeDebounceRef={writeDebounceRef}
          />
        )}
        {scene === 'walkthrough' && (
          <SessionWalkthrough
            visible={true}
            onClose={() => navigateTo('session')}
          />
        )}
        {scene === 'new-preset' && (
          <NewPresetWizard
            onClose={() => navigateTo('presets')}
            onSaved={() => {
              presetsDb.getAll().then(setPresets).catch(() => {});
              navigateTo('presets');
            }}
          />
        )}
      </Animated.View>

      {/* ── Ambient navigation nodes ── */}
      <Animated.View style={[styles.navBar, { paddingBottom: insets.bottom }, navAlphaStyle]}>
        <NavNode sceneId="presets" active={scene === 'presets'} onPress={() => navigateTo('presets')} />
        <NavNode sceneId="history" active={scene === 'history'} onPress={() => navigateTo('history')} />
        <NavNode sceneId="configure" active={scene === 'configure'} onPress={() => navigateTo('configure')} />
      </Animated.View>
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
    marginBottom: 16,
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
    fontFamily: 'SpaceGrotesk_300Light',
    fontSize: 24,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: colors.bone100,
    letterSpacing: -0.48,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.bone50,
    marginTop: 2,
  },
  metricDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(244,237,228,0.10)',
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
    paddingVertical: 16,
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
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBarName: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 17,
    color: colors.bone100,
    letterSpacing: -0.34,
  },
  presetBarSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.bone50,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  presetChangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  presetChangeBtnText: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '500',
    letterSpacing: 0.8,
  },

  // ── Start session button ───────────────────────────────────────────────────
  startSessionOuter: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.emberBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  startSessionOuterGhost: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 1,
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
  startSessionGhostInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.bone35,
    backgroundColor: 'transparent',
  },
  startSessionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.bone100,
    letterSpacing: 0.3,
  },
  startSessionTextGhost: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.bone100,
    letterSpacing: 0.3,
  },

  // ── Panel overlay ──────────────────────────────────────────────────────────
  panelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  // ── Back-to-session affordance (Presets panel, session active) ───────────
  backToSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    minHeight: 32,
  },
  backToSessionText: {
    fontSize: 12,
    color: colors.bone50,
    letterSpacing: 0.3,
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
    marginBottom: 24,
    paddingTop: 0,
  },
  panelTitle: {
    fontFamily: 'SpaceGrotesk_400Regular',
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
  newBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  newBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.bone50,
    letterSpacing: 0.2,
  },

  // ── Preset card ────────────────────────────────────────────────────────────
  presetCardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 72,
    backgroundColor: colors.surface2,
    borderRadius: 18,
  },
  presetCardActive: {
    backgroundColor: colors.surface2,
  },
  presetCardBorder: {
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: colors.glassBorder,
  },
  presetCardBorderActive: {
    borderColor: colors.emberBright,
    borderWidth: 1.5,
  },
  presetCardLeft: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCardMid: { flex: 1, paddingLeft: 12 },
  presetCardName: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 18,
    color: colors.bone100,
    letterSpacing: -0.36,
    marginBottom: 4,
  },
  presetTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetTempDab: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone70,
    letterSpacing: 0.3,
  },
  presetTempDunk: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.quartzDim,
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  presetCardRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2.2,
    color: colors.emberBright,
  },
  applyBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.bone35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 12,
    color: colors.bone100,
    fontWeight: '500',
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
    paddingVertical: 10,
    minHeight: 36,
    backgroundColor: 'rgba(28,23,20,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionCardDur: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    color: colors.bone50,
    letterSpacing: 0.3,
  },
  sessionPeakTemp: {
    fontFamily: 'SpaceGrotesk_300Light',
    fontVariant: ['tabular-nums'],
    fontSize: 24,
    fontWeight: '300',
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
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 10,
    color: colors.bone35,
    letterSpacing: 0.3,
  },

  // ── Configure panel ────────────────────────────────────────────────────────
  configSection: {
    marginBottom: 28,
  },
  configSectionTitle: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.bone50,
    marginBottom: 8,
    marginLeft: 0,
  },
  configCardContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
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
    fontSize: 16,
    color: colors.bone90,
    fontWeight: '400',
  },
  sliderValue: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontVariant: ['tabular-nums'],
    fontSize: 12,
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
    backgroundColor: colors.surface4,
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
    fontSize: 15,
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
    fontSize: 12,
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
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '400',
  },
  stepPipTextActive: {
    color: colors.emberBright,
    fontWeight: '500',
  },
  soundRow: { paddingVertical: 12 },
  soundRowLabel: {
    fontSize: 16,
    color: colors.bone90,
    fontWeight: '400',
    marginBottom: 8,
  },
  soundPills: {
    flexDirection: 'row',
    gap: 6,
  },
  soundPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 36,
    borderRadius: 100,
    backgroundColor: colors.surface3,
    borderWidth: 0.5,
    borderColor: 'rgba(244,237,228,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '500',
    color: colors.bone100,
    letterSpacing: 0.4,
  },
  syncedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.2,
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
    fontFamily: 'SpaceGrotesk_400Regular',
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
    borderWidth: 0.5,
    borderColor: colors.ember,
    backgroundColor: 'rgba(232,146,64,0.08)',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCtaText: {
    fontSize: 14,
    color: colors.ember,
    fontWeight: '500',
    letterSpacing: 0.3,
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
    width: 56,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navNodeInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.4,
    color: colors.bone35,
  },
  navLabelActive: {
    color: colors.bone100,
  },

  // ── Dial glow ring (preset-apply bloom) ────────────────────────────────────
  dialGlowRing: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(232,146,64,0.18)',
  },

  // ── Thermal ambience rings (living breath behind dial) ─────────────────────
  thermalRingAmber: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.ember,
  },
  thermalRingQuartz: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.quartzDim,
  },

  // ── In-surface apply error toast ───────────────────────────────────────────
  applyErrorToast: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.error,
    marginBottom: 8,
  },
  applyErrorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '400',
    flex: 1,
  },
  applyErrorDismiss: {
    paddingLeft: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyErrorDismissText: {
    fontSize: 12,
    color: colors.bone50,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
