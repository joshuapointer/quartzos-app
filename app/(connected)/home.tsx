import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { colors, gradients } from '../../src/design/tokens';
import { SessionWalkthrough } from '../../src/design/components/SessionWalkthrough';
import { NewPresetWizard } from '../../src/design/components/NewPresetWizard';
import { QBackground } from '../../src/design/components/QBackground';
import { TempDial } from '../../src/design/components/TempDial';
import { QWordmark } from '../../src/design/components/QWordmark';
import { ErrorBoundary } from '../../src/design/components/ErrorBoundary';
import { toast } from '../../src/design/components/Toast';
import { useBleStore } from '../../src/state/bleStore';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { formatTemp } from '../../src/utils/temperature';
import { bleManager } from '../../src/ble/BleManager';
import * as presetsDb from '../../src/db/presets';
import * as sessionsDb from '../../src/db/sessions';
import type { Preset } from '../../src/db/presets';
import type { SessionRecord } from '../../src/db/sessions';

import { PresetsContent } from './_home/PresetsContent';
import { HistoryContent } from './_home/HistoryContent';
import { ConfigureContent } from './_home/ConfigureContent';
import { NavNode } from './_home/components/NavNode';
import { useSessionElapsed } from './_home/hooks/useSessionElapsed';
import { useThermalAnimations } from './_home/hooks/useThermalAnimations';
import {
  DIAL_MINI_SCALE,
  WORDMARK_H,
  NAV_HEIGHT,
  SPRING_DIAL,
  SPRING_PANEL,
} from './_home/constants';
import type { HistoryFilter, SceneId } from './_home/types';

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
  const activePresetId = useSettingsStore((s) => s.activePresetId);
  const setActivePresetId = useSettingsStore((s) => s.setActivePresetId);
  const sessionActive = useSessionStore((s) => s.active);
  const peakF = useSessionStore((s) => s.peakF);
  const startedAt = useSessionStore((s) => s.startedAt);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const elapsedSec = useSessionElapsed(sessionActive, startedAt);

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

  const { thermalPulse, thermalHot } = useThermalAnimations(tempF, settings.dabAlarmF);

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
    try {
      await bleManager.writeSettings(preset.settings);
    } catch {
      toast.error("Couldn't reach the rig. Check Bluetooth and try again.", {
        retryLabel: 'Retry',
        onRetry: () => { void handleApplyPreset(preset); },
      });
      throw new Error('write failed');
    }
    setActivePresetId(preset.id);
    updateSetting('dabAlarmF', preset.settings.dabAlarmF);
    updateSetting('dunkAlarmF', preset.settings.dunkAlarmF);
    dialGlow.value = withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
    );
    // Intentionally NOT auto-navigating back; user stays in Presets and
    // chooses when to return. The dial-bloom above confirms the apply.
  }, [dialGlow, updateSetting, setActivePresetId]);

  // Siri / Shortcut deep-link entry: when the route arrives with
  // `?applyPreset=<id>`, find the matching preset and run the canonical
  // apply path, then clear the param. The `appliedRef` guard makes the
  // effect idempotent against expo-router rehydration on remount.
  const { applyPreset: applyPresetParam } = useLocalSearchParams<{ applyPreset?: string }>();
  const appliedPresetIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!applyPresetParam) return;
    if (appliedPresetIdsRef.current.has(applyPresetParam)) {
      router.setParams({ applyPreset: undefined });
      return;
    }
    if (presets.length === 0) return; // wait for hydration; effect re-runs when presets load
    appliedPresetIdsRef.current.add(applyPresetParam);
    router.setParams({ applyPreset: undefined });
    const target = presets.find((p) => p.id === applyPresetParam);
    if (!target) return;
    void handleApplyPreset(target).catch(() => { /* toast already shown */ });
  }, [applyPresetParam, presets, handleApplyPreset]);

  // Clear activePresetId whenever the live settings drift away from the
  // active preset's settings (so the indicator fades to "custom"). Cheap
  // shallow-equal across the small DeviceSettings shape — colors get a
  // per-index check.
  useEffect(() => {
    if (!activePresetId) return;
    const active = presets.find((p) => p.id === activePresetId);
    if (!active) return;
    const a = active.settings;
    const b = settings;
    const colorsEq =
      a.colors[0] === b.colors[0] &&
      a.colors[1] === b.colors[1] &&
      a.colors[2] === b.colors[2] &&
      a.colors[3] === b.colors[3];
    const equal =
      colorsEq &&
      a.dabAlarmF === b.dabAlarmF &&
      a.dunkAlarmF === b.dunkAlarmF &&
      a.useCelsius === b.useCelsius &&
      a.opaqueMode === b.opaqueMode &&
      a.soundAlert === b.soundAlert &&
      a.lightAlert === b.lightAlert &&
      a.ledGuide === b.ledGuide &&
      a.nightMode === b.nightMode &&
      a.volume === b.volume &&
      a.keyTone === b.keyTone &&
      a.dabSound === b.dabSound &&
      a.dunkSound === b.dunkSound;
    if (!equal) setActivePresetId(null);
  }, [settings, presets, activePresetId, setActivePresetId]);

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
        <ErrorBoundary>
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
        </ErrorBoundary>
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
    fontFamily: 'GeistMono_300Light',
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
    backgroundColor: colors.bone100 + '1A',
  },
  hairline: {
    height: 0.5,
    backgroundColor: colors.bone100 + '0F',
  },

  // ── Preset bar (session) ───────────────────────────────────────────────────
  presetBarOuter: {
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.voidObsidian,
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
    fontFamily: 'Geist_400Regular',
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
    shadowColor: colors.voidObsidian,
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

  // ── Dial glow ring (preset-apply bloom) ────────────────────────────────────
  dialGlowRing: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.firedAmber + '2E',
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
});
