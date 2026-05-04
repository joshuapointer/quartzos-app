import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { layout as layoutTokens } from '../tokens';
import { useBleStore } from '../../state/bleStore';
import { useSessionStore } from '../../state/sessionStore';
import { useSettingsStore } from '../../state/settingsStore';
import { bleManager } from '../../ble/BleManager';
import { torchDetector } from '../../utils/TorchDetector';
import * as moltenRecents from '../../db/moltenRecents';
import { springs } from '../tokens';
import type { Preset } from '../../db/presets';
import type { MoltenRecent } from '../../db/moltenRecents';
import { BANGERS, findBanger } from '../../data/bangers';
import { CONCENTRATES, findConcentrate } from '../../data/concentrates';
import { findWallThickness } from '../../data/wallThicknesses';

import { PhaseBackground } from '../backgrounds/PhaseBackground';
import type { DwmPhase } from '../backgrounds/PhaseBackground';
import { Wordmark } from '../primitives/Wordmark';
import { HoldBub } from '../primitives/HoldBub';
import { Bub } from '../bub/Bub';
import { BUB_SIZE_PX } from '../bub/types';
import type { Mood, Eye, BubSize } from '../bub/types';
import type { BubProps } from '../bub/types';

import { useDwmPhase } from './useDwmPhase';
import { ScreenSlot } from './ScreenSlot';
import { torchDurationFor } from './copy';

// ---------------------------------------------------------------------------
// Orb positioning — ported from MoltenSurface
// ---------------------------------------------------------------------------

const REF_HEIGHT = layoutTokens.phoneRefHeight;

const ORB_TARGET_Y_BY_PHASE: Record<DwmPhase, number> = {
  cold:        300,
  connecting:  300,
  connected:   300,
  presets:     150,
  banger:      150,
  concentrate: 150,
  wall:        150,
  review:      360,
  ready:       360,
  heating:     415,
  window:      385,
  dabbing:     495,
  swab:        485,
  dunk:        485,
  complete:    300,
};

// ---------------------------------------------------------------------------
// Bub state per phase
// ---------------------------------------------------------------------------

type BubState = { mood: Mood; eye: Eye; extras: BubProps['extras']; size: BubSize };

const BUB_BY_PHASE: Record<DwmPhase, BubState> = {
  cold:        { mood: 'idle',    eye: 'open',          extras: [],                          size: 'xl' },
  connecting:  { mood: 'curious', eye: 'wide',          extras: [],                          size: 'xl' },
  connected:   { mood: 'eager',   eye: 'happy',         extras: [],                          size: 'xl' },
  presets:     { mood: 'curious', eye: 'wide',          extras: [],                          size: 'lg' },
  banger:      { mood: 'curious', eye: 'wide',          extras: [],                          size: 'lg' },
  concentrate: { mood: 'curious', eye: 'wide',          extras: [],                          size: 'lg' },
  wall:        { mood: 'curious', eye: 'wide',          extras: [],                          size: 'lg' },
  review:      { mood: 'eager',   eye: 'wide',          extras: [],                          size: 'xl' },
  ready:       { mood: 'eager',   eye: 'wide',          extras: [],                          size: 'xl' },
  heating:     { mood: 'heat',    eye: 'concentrating', extras: ['torch', 'sweat'],           size: 'xl' },
  window:      { mood: 'cool',    eye: 'wide',          extras: [],                          size: 'xl' },
  dabbing:     { mood: 'dab',     eye: 'surprised',     extras: ['sparkles'],                size: 'xl' },
  swab:        { mood: 'dunk',    eye: 'happy',         extras: ['bubbles', 'wave'],         size: 'xl' },
  dunk:        { mood: 'clean',   eye: 'tidy',          extras: ['suds'],                    size: 'xl' },
  complete:    { mood: 'done',    eye: 'starry',        extras: ['sparkles'],                size: 'lg' },
};

// Phases where Bub is the hold-gesture target
const HOLD_BUB_PHASES = new Set<DwmPhase>(['cold', 'review', 'ready']);
const HOLD_HINT: Partial<Record<DwmPhase, string>> = {
  cold:   'hold to scan',
  review: 'hold to light it up',
  ready:  'hold to light it up',
};

// Content well top — mirrors MoltenSurface contentWellTop logic
function contentWellTopFor(phase: DwmPhase, screenH: number): number {
  const ORB_ABOVE: ReadonlyArray<DwmPhase> = [
    'cold', 'connecting', 'connected',
    'presets', 'banger', 'concentrate', 'wall',
    'review', 'ready',
    'heating', 'window', 'dabbing', 'swab', 'dunk', 'complete',
  ];
  if (ORB_ABOVE.includes(phase)) {
    const orbCenterY = (ORB_TARGET_Y_BY_PHASE[phase] / REF_HEIGHT) * screenH;
    const r = BUB_SIZE_PX[BUB_BY_PHASE[phase].size] / 2;
    const HOLD_BUB_PHASES_LOCAL: ReadonlyArray<DwmPhase> = ['cold', 'review', 'ready'];
    const isHold = HOLD_BUB_PHASES_LOCAL.includes(phase);
    // Heating's torch extra extends below the orb bounding box; HOLD phases render
    // a hint pill below Bub via HoldBub.
    const extra = phase === 'heating' ? 56 : isHold ? 80 : 28;
    return orbCenterY + r + extra;
  }
  // Fallback (every phase is now in ORB_ABOVE; kept for safety)
  return 240;
}

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

export interface DwmFlowProps {
  presets: ReadonlyArray<Preset>;
  recents: ReadonlyArray<MoltenRecent>;
  onApplyPreset: (presetId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// DwmFlow
// ---------------------------------------------------------------------------

export default function DwmFlow({ presets, recents, onApplyPreset }: DwmFlowProps) {
  const { height: screenH } = useWindowDimensions();
  const router = useRouter();

  const connectionState = useBleStore((s) => s.connectionState);
  const liveTempF = useBleStore((s) => s.liveTempF);
  const useCelsius = useSettingsStore((s) => s.settings.useCelsius);

  const {
    phase,
    setPhase,
    selections,
    selectBanger,
    selectConcentrate,
    selectWall,
    selectPreset,
    selectRecent,
    clearSelections,
  } = useDwmPhase();

  // Resolved entities
  const banger = useMemo(
    () => (selections.bangerId ? findBanger(selections.bangerId) ?? null : null),
    [selections.bangerId],
  );
  const concentrate = useMemo(
    () => (selections.concentrateId ? findConcentrate(selections.concentrateId) ?? null : null),
    [selections.concentrateId],
  );
  const wall = useMemo(
    () => (selections.wallId ? findWallThickness(selections.wallId) ?? null : null),
    [selections.wallId],
  );

  const optimalF = concentrate?.surface_temp_optimal_f ?? 480;
  const torchDurationS = useMemo(() => torchDurationFor(selections.bangerId), [selections.bangerId]);

  // ---------------------------------------------------------------------------
  // Orb position spring
  // ---------------------------------------------------------------------------

  const MAX_ORB_PX = Math.max(...Object.values(BUB_SIZE_PX));

  const orbTopShared = useSharedValue(
    (ORB_TARGET_Y_BY_PHASE[phase] / REF_HEIGHT) * screenH - MAX_ORB_PX / 2,
  );

  useEffect(() => {
    const targetY = (ORB_TARGET_Y_BY_PHASE[phase] / REF_HEIGHT) * screenH - MAX_ORB_PX / 2;
    orbTopShared.value = withSpring(targetY, springs.gentle);
  }, [phase, screenH, orbTopShared, MAX_ORB_PX]);

  useEffect(() => {
    return () => cancelAnimation(orbTopShared);
  }, [orbTopShared]);

  const orbWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbTopShared.value }],
  }));

  const contentWellTop = useMemo(() => contentWellTopFor(phase, screenH), [phase, screenH]);

  // ---------------------------------------------------------------------------
  // Torch listener — fires during 'review'/'ready' to auto-advance to heating
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const isReviewPhase = phase === 'review' || phase === 'ready';
    if (!isReviewPhase) return;
    let cancelled = false;
    void torchDetector.startListening(() => {
      if (cancelled) return;
      setPhase('heating');
    });
    return () => {
      cancelled = true;
      void torchDetector.stopListening();
    };
  }, [phase, setPhase]);

  // ---------------------------------------------------------------------------
  // Heating timer — Date.now-based, not interval-based (port from MoltenSurface)
  // ---------------------------------------------------------------------------
  const [heatSecondsLeft, setHeatSecondsLeft] = useState(torchDurationS);
  const heatingStartedAtRef = useRef<number | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [heatingFallback, setHeatingFallback] = useState(false);

  useEffect(() => {
    if (phase !== 'heating') {
      heatingStartedAtRef.current = null;
      setHeatSecondsLeft(torchDurationS);
      setTorchOn(false);
      setHeatingFallback(false);
      return;
    }

    // Timer does NOT start until the torch is detected — see torchOn-gated effect below.

    // Start torch mic listener to set torchOn
    let cancelled = false;
    void torchDetector.startListening(() => {
      if (!cancelled) setTorchOn(true);
    });

    function computeRemaining(): number {
      const startedAt = heatingStartedAtRef.current;
      if (startedAt === null) return torchDurationS;
      return Math.max(0, torchDurationS - Math.floor((Date.now() - startedAt) / 1000));
    }

    setHeatSecondsLeft(computeRemaining());

    const intervalId = setInterval(() => {
      const r = computeRemaining();
      setHeatSecondsLeft(r);
      if (r <= 0) clearInterval(intervalId);
    }, 1000);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') setHeatSecondsLeft(computeRemaining());
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSub.remove();
      void torchDetector.stopListening();
    };
  }, [phase, torchDurationS]);

  // Start the heating countdown only when the torch is actually heard.
  useEffect(() => {
    if (phase !== 'heating') return;
    if (!torchOn) return;
    if (heatingStartedAtRef.current !== null) return;
    heatingStartedAtRef.current = Date.now();
    setHeatSecondsLeft(torchDurationS);
  }, [phase, torchOn, torchDurationS]);

  // Heating fallback chip — surfaces after torchDurationS + 8s
  useEffect(() => {
    if (phase !== 'heating') {
      setHeatingFallback(false);
      return;
    }
    const waitMs = (torchDurationS + 8) * 1000;
    const elapsed = heatingStartedAtRef.current !== null
      ? Date.now() - heatingStartedAtRef.current
      : 0;
    const remaining = Math.max(0, waitMs - elapsed);
    const t = setTimeout(() => setHeatingFallback(true), remaining);
    return () => clearTimeout(t);
  }, [phase, torchDurationS, torchOn]);

  // heatProgress for PhaseBackground
  const heatProgress = torchDurationS > 0
    ? 1 - heatSecondsLeft / torchDurationS
    : 0;

  // ---------------------------------------------------------------------------
  // Window fallback — 30s stuck timer
  // ---------------------------------------------------------------------------
  const [windowFallback, setWindowFallback] = useState(false);

  useEffect(() => {
    if (phase !== 'window') { setWindowFallback(false); return; }
    const t = setTimeout(() => setWindowFallback(true), 30_000);
    return () => clearTimeout(t);
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Window dwell-fill bar — visualizes "how long we've been in-window".
  // Drives a 0..1 progress value that ticks while liveTempF is within ±15F of
  // optimalF. Caps at 1.0 (~1.7s); BLE state machine is what actually advances.
  // ---------------------------------------------------------------------------
  const [windowDwellPct, setWindowDwellPct] = useState(0);
  const inWindowSinceRef = useRef<number | null>(null);
  const DWELL_MS_TARGET = 1700;
  useEffect(() => {
    if (phase !== 'window') {
      inWindowSinceRef.current = null;
      setWindowDwellPct(0);
      return;
    }
    const id = setInterval(() => {
      const inWindow = Math.abs(liveTempF - optimalF) <= 15;
      if (!inWindow) {
        if (inWindowSinceRef.current !== null) {
          inWindowSinceRef.current = null;
          setWindowDwellPct(0);
        }
        return;
      }
      if (inWindowSinceRef.current === null) {
        inWindowSinceRef.current = Date.now();
      }
      const dwellMs = Date.now() - inWindowSinceRef.current;
      const pct = Math.min(1, dwellMs / DWELL_MS_TARGET);
      setWindowDwellPct(pct);
    }, 100);
    return () => clearInterval(id);
  }, [phase, liveTempF, optimalF]);

  // ---------------------------------------------------------------------------
  // Session timer — running M:SS shown in session-phase eyebrows. Starts the
  // moment we enter the first session phase ('heating'); resets when we leave
  // session phases via cold/presets.
  // ---------------------------------------------------------------------------
  const sessionStartedAtRef = useRef<number | null>(null);
  const [sessionElapsedS, setSessionElapsedS] = useState(0);
  useEffect(() => {
    const sessionPhases: ReadonlyArray<DwmPhase> = [
      'heating', 'window', 'dabbing', 'swab', 'dunk',
    ];
    const isSession = sessionPhases.includes(phase);
    if (!isSession) {
      // Reset on hard exits to picker / cold; preserve elapsed for 'complete' display
      if (phase === 'cold' || phase === 'presets') {
        sessionStartedAtRef.current = null;
        setSessionElapsedS(0);
      }
      return;
    }
    if (sessionStartedAtRef.current === null) {
      sessionStartedAtRef.current = Date.now();
    }
    const id = setInterval(() => {
      const startedAt = sessionStartedAtRef.current;
      if (startedAt == null) return;
      setSessionElapsedS(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Preset application side-effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selections.presetId || !onApplyPreset) return;
    let cancelled = false;
    void (async () => {
      try { await onApplyPreset(selections.presetId as string); } catch { /* toast shown by caller */ }
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [selections.presetId, onApplyPreset]);

  // Picker-path BLE write when reaching review/ready without a preset
  const lastWrittenRef = useRef<string | null>(null);
  useEffect(() => {
    const isReady = phase === 'review' || phase === 'ready';
    if (!isReady) { lastWrittenRef.current = null; return; }
    if (selections.presetId !== null) return;
    if (selections.bangerId === null || selections.concentrateId === null) return;
    if (concentrate === null || concentrate.surface_temp_optimal_f === null) return;
    const key = `${selections.bangerId}:${selections.concentrateId}`;
    if (lastWrittenRef.current === key) return;
    let cancelled = false;
    void (async () => {
      const currentSettings = useSettingsStore.getState().settings;
      try {
        await bleManager.writeSettings({ ...currentSettings, dabAlarmF: concentrate.surface_temp_optimal_f as number });
      } catch {
        if (!cancelled) return;
      }
      if (cancelled) return;
      lastWrittenRef.current = key;
      useSettingsStore.getState().updateSetting('dabAlarmF', concentrate.surface_temp_optimal_f as number);
    })();
    return () => { cancelled = true; };
  }, [phase, selections.presetId, selections.bangerId, selections.concentrateId, concentrate]);

  // ---------------------------------------------------------------------------
  // Save moltenRecent on entry to 'complete'
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'complete') return;
    if (!selections.bangerId || !selections.concentrateId) return;
    const { peakF: latestPeakF } = useSessionStore.getState();
    const { liveTempF: latestTempF } = useBleStore.getState();
    const peakToSave = Math.round(latestPeakF || latestTempF || 0);
    void moltenRecents.record({
      bangerId: selections.bangerId,
      concentrateId: selections.concentrateId,
      peakF: peakToSave,
    }).catch(() => { /* silent */ });
  }, [phase, selections.bangerId, selections.concentrateId]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleHoldComplete = useCallback(() => {
    if (phase === 'cold') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      bleManager.startScan();
    } else if (phase === 'review' || phase === 'ready') {
      setPhase('heating');
    }
  }, [phase, setPhase]);

  const handleCancelScan = useCallback(() => {
    bleManager.stopScan();
    bleManager.cancelReconnect();
    setPhase('cold');
  }, [setPhase]);

  const handlePickRecent = useCallback((id: string) => {
    const recent = recents.find((r) => r.id === id);
    if (!recent) return;
    selectRecent({ bangerId: recent.bangerId, concentrateId: recent.concentrateId, recentId: id });
  }, [recents, selectRecent]);

  const handleBuildFresh = useCallback(() => setPhase('banger'), [setPhase]);

  const handleAgain = useCallback(() => setPhase('ready'), [setPhase]);

  const handleNew = useCallback(() => {
    clearSelections();
    setPhase('presets');
  }, [clearSelections, setPhase]);

  const handleLongPressBrand = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.push('/(connected)/settings');
  }, [router]);

  const handleDisconnect = useCallback(() => {
    bleManager.cancelReconnect();
    void bleManager.disconnect().catch(() => { /* ignore */ });
    clearSelections();
    setPhase('cold');
  }, [clearSelections, setPhase]);

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  const bubStateBase = BUB_BY_PHASE[phase];
  const windowMood: Mood | null = phase === 'window'
    ? (liveTempF > optimalF + 40 ? 'heat' : liveTempF > optimalF + 15 ? 'dab' : 'cool')
    : null;
  const bubState = windowMood != null
    ? { ...bubStateBase, mood: windowMood }
    : bubStateBase;
  const bubPx = BUB_SIZE_PX[bubState.size];
  const isHoldPhase = HOLD_BUB_PHASES.has(phase);
  const holdHint = HOLD_HINT[phase] ?? 'hold';
  const isOnline = connectionState === 'READY';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.root}>
      <PhaseBackground
        phase={phase}
        heatProgress={heatProgress}
        torchOn={torchOn ? 1 : 0}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Wordmark
          isOnline={isOnline}
          connectionLabel={isOnline ? 'online' : 'offline'}
          onLongPressBrand={handleLongPressBrand}
          onDisconnect={handleDisconnect}
        />

        {/* Orb — absolutely positioned, springs to per-phase Y */}
        <Animated.View style={[styles.orbWrapper, orbWrapperStyle]} pointerEvents="box-none">
          <View style={{ width: MAX_ORB_PX, height: MAX_ORB_PX, alignItems: 'center', justifyContent: 'center' }}>
            <HoldBub
              onComplete={handleHoldComplete}
              hintLabel={holdHint}
              size={bubPx}
              enabled={isHoldPhase}
            >
              <Bub
                mood={bubState.mood}
                eye={bubState.eye}
                size={bubState.size}
                extras={bubState.extras}
                torchLit={torchOn}
                onPress={phase === 'heating' ? () => setPhase('window') : undefined}
              />
            </HoldBub>
          </View>
        </Animated.View>

        {/* Phase screen content */}
        <View style={[styles.contentWell, { top: contentWellTop }]} pointerEvents="box-none">
          <ScreenSlot
            phase={phase}
            selections={selections}
            presets={presets as Preset[]}
            recents={recents as MoltenRecent[]}
            banger={banger ?? null}
            concentrate={concentrate ?? null}
            wall={wall ?? null}
            heatSecondsLeft={heatSecondsLeft}
            heatSecondsTotal={torchDurationS}
            torchOn={torchOn}
            showHeatFallback={heatingFallback}
            liveTempF={liveTempF}
            targetF={optimalF}
            useCelsius={useCelsius}
            showWindowFallback={windowFallback}
            windowDwellPct={windowDwellPct}
            sessionElapsedS={sessionElapsedS}
            onHoldComplete={handleHoldComplete}
            onCancelScan={handleCancelScan}
            onPickPreset={selectPreset}
            onPickRecent={handlePickRecent}
            onBuildFresh={handleBuildFresh}
            onSelectBanger={selectBanger}
            onSelectConcentrate={selectConcentrate}
            onSelectWall={selectWall}
            onSkipHeat={() => setPhase('window')}
            onForceAdvanceHeat={() => setPhase('window')}
            onForceAdvanceWindow={() => setPhase('dabbing')}
            onAgain={handleAgain}
            onNew={handleNew}
            onSetPhase={setPhase}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  orbWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    paddingBottom: 12,
  },
});
