import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { colors, fonts } from '../design/tokens';
import { useBleStore } from '../state/bleStore';
import type { ConnectionState } from '../ble/types';
import { bleManager } from '../ble/BleManager';
import { BANGERS } from '../data/bangers';
import { CONCENTRATES } from '../data/concentrates';
import type { Banger } from '../data/bangers';
import type { Concentrate } from '../data/concentrates';
import { torchDetector } from '../utils/TorchDetector';
import * as moltenRecents from '../db/moltenRecents';

import { MoltenBackground } from '../design/components/molten/MoltenBackground';
import MoltenOrb from '../design/components/molten/MoltenOrb';
import { StatusChip } from '../design/components/molten/StatusChip';
import { BangerCarousel } from '../design/components/molten/BangerCarousel';
import { ConcentrateGrid } from '../design/components/molten/ConcentrateGrid';
import { RecentsRow } from '../design/components/molten/RecentsRow';
import type { RecentEntry } from '../design/components/molten/RecentsRow';

import { useMoltenPhase } from './useMoltenPhase';
import type { MoltenPhase } from './useMoltenPhase';
import { HeatingOverlay } from './HeatingOverlay';
import { WindowOverlay } from './WindowOverlay';
import { SwabOverlay } from './SwabOverlay';
import { DunkOverlay } from './DunkOverlay';
import { CompleteOverlay } from './CompleteOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// Phase → orb size and Y position. Y values are taken from STATES.pos[1]
// (index.html lines 1359-1373) interpreted against the original 390×844
// reference canvas; we proportion against the current viewport height.
// ─────────────────────────────────────────────────────────────────────────────

const REF_HEIGHT = 844;

const ORB_SIZE_BY_PHASE: Record<MoltenPhase, number> = {
  cold: 200,
  connecting: 200,
  connected: 200,
  presets: 100,
  banger: 100,
  concentrate: 100,
  ready: 280,
  heating: 240,
  window: 220,
  dabbing: 220,
  swab: 220,
  dunk: 220,
  complete: 220,
};

const ORB_TARGET_Y_BY_PHASE: Record<MoltenPhase, number> = {
  cold: 300,
  connecting: 300,
  connected: 300,
  presets: 150,
  banger: 150,
  concentrate: 150,
  ready: 360,
  heating: 605,
  window: 400,
  dabbing: 420,
  swab: 400,
  dunk: 400,
  complete: 300,
};

// Default torch duration when we don't have a per-banger override.
// Mirrors prototype `torchDurationFor` (quartzie-molten-refresh.html line
// 2044-2050) — recommended torch seconds vary by banger style.
const DEFAULT_TORCH_DURATION_S = 90;

const TORCH_DURATION_BY_BANGER_ID: Record<string, number> = {
  'flat-top': 90,
  'beveled': 85,
  'opaque-bottom': 90,
  'thermal': 110,
  'round-bottom': 80,
  'core-reactor': 95,
  'swing-arm': 75,
  'terp-slurper': 85,
  'blender': 80,
  'spinner': 75,
  'control-tower': 90,
  'charmer': 85,
  'insert': 95,
  'e-banger': 60,
};

function torchDurationFor(bangerId: string | null | undefined): number {
  if (!bangerId) return DEFAULT_TORCH_DURATION_S;
  return TORCH_DURATION_BY_BANGER_ID[bangerId] ?? DEFAULT_TORCH_DURATION_S;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public props
// ─────────────────────────────────────────────────────────────────────────────

export type MoltenSurfacePreset = {
  id: string;
  name: string;
  bangerId?: string;
  concentrateId?: string;
  createdAt?: number;
};

/**
 * RecentEntry-compatible shape — pre-resolved by the parent so MoltenSurface
 * doesn't need to juggle banger/concentrate lookups for the recents row.
 *
 * `bangerId` / `concentrateId` are used by the recents tap handler to
 * populate selections and auto-advance to `ready` (matches prototype line
 * 2140-2149). They are required so the recent row is actually wired to the
 * session.
 */
export type MoltenSurfaceRecent = {
  id: string;
  bangerId: string;
  concentrateId: string;
  bangerName: string;
  concentrateName: string;
  optimalF: number;
  whenLabel: string;
};

export type MoltenSurfaceProps = {
  /** Saved presets — kept for `onApplyPreset` callsites. */
  presets: ReadonlyArray<MoltenSurfacePreset>;
  /** Pre-resolved recent sessions for the picker row. */
  recents?: ReadonlyArray<MoltenSurfaceRecent>;
  onApplyPreset?: (presetId: string) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Inline copy components
// ─────────────────────────────────────────────────────────────────────────────

function CopyStack({
  eyebrow,
  headline,
  sub,
}: {
  eyebrow: string;
  headline: string;
  sub: string;
}) {
  return (
    <View style={styles.copyStack}>
      <Text style={styles.eyebrow} allowFontScaling={false}>
        {eyebrow}
      </Text>
      <Text style={styles.headline} allowFontScaling={false}>
        {headline}
      </Text>
      <Text style={styles.subCopy} allowFontScaling={false}>
        {sub}
      </Text>
    </View>
  );
}

function ColdCopy({ onPair }: { onPair: () => void }) {
  return (
    <Pressable
      onPress={onPair}
      hitSlop={24}
      accessibilityRole="button"
      accessibilityLabel="Tap to pair with Dabrite"
      style={({ pressed }) => [
        styles.coldPressable,
        pressed && styles.coldPressed,
      ]}
    >
      <View style={styles.copyOuter}>
        <CopyStack
          eyebrow="Step 01"
          headline="Power on your Dabrite."
          sub="Hold the side button until the LED breathes — then tap to pair."
        />
        <View style={styles.tapHintRow}>
          <View style={styles.tapHintPip} />
          <Text style={styles.tapHintLabel} allowFontScaling={false}>
            Tap to pair
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ConnectingCopy() {
  return (
    <View style={styles.copyOuter}>
      <CopyStack
        eyebrow="Searching"
        headline="Looking for a Dabrite nearby…"
        sub="If nothing happens, hold the Dabrite's side button until its LED breathes."
      />
    </View>
  );
}

function ConnectedCopy({ batteryPct }: { batteryPct: number }) {
  return (
    <View style={styles.copyOuter}>
      <CopyStack
        eyebrow="Linked"
        headline={`Dabrite Pro · ${batteryPct}%`}
        sub="Calibrated for opaque-bottom emissivity."
      />
    </View>
  );
}

// 5-bar mic-pad indicator with staggered scaleY animations
function MicPadIndicator() {
  return (
    <View style={styles.micPadRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MicBar key={i} index={i} />
      ))}
    </View>
  );
}

function MicBar({ index }: { index: number }) {
  const scale = useSharedValue(0.4);
  const initialDelay = index * 90;

  useEffect(() => {
    const t = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 420,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0.4, {
            duration: 420,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      );
    }, initialDelay);
    return () => clearTimeout(t);
  }, [initialDelay, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View style={[styles.micBar, animStyle]} />;
}

function ReadyCopy({
  showFallback,
  onFallbackPress,
}: {
  showFallback: boolean;
  onFallbackPress: () => void;
}) {
  return (
    <View style={styles.copyOuter}>
      <CopyStack
        eyebrow="Profile loaded"
        headline="Ready when you are."
        sub="Spark your torch — the mic will hear it."
      />
      <MicPadIndicator />
      {showFallback ? (
        <Pressable
          onPress={onFallbackPress}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Tap when torch sparks"
          style={({ pressed }) => [
            styles.torchFallbackChip,
            pressed && styles.torchFallbackChipPressed,
          ]}
        >
          <Text style={styles.torchFallbackLabel} allowFontScaling={false}>
            Tap when torch sparks
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header — minimal wordmark row
// ─────────────────────────────────────────────────────────────────────────────

function Header({
  connectionState,
  onLongPressSettings,
}: {
  connectionState: ConnectionState;
  onLongPressSettings: () => void;
}) {
  const isConnected = connectionState === 'READY';

  return (
    <View style={styles.headerRow}>
      <Pressable
        onLongPress={onLongPressSettings}
        delayLongPress={600}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Long-press to open settings"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Svg width={108} height={28} viewBox="0 0 216 56">
          <Defs>
            <LinearGradient id="wordmark-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.bone100} stopOpacity={1} />
              <Stop offset="100%" stopColor="#c8cdd4" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <SvgText
            x={108}
            y={42}
            fontFamily="InstrumentSerif_400Regular_Italic"
            fontSize={36}
            fontStyle="italic"
            fill="url(#wordmark-grad)"
            textAnchor="middle"
          >
            Quartzie
          </SvgText>
        </Svg>
      </Pressable>
      <View style={styles.headerStatusRow}>
        <View
          style={[
            styles.headerDot,
            { backgroundColor: isConnected ? colors.prismCyan : colors.bone40 },
          ]}
        />
        <Text style={styles.headerStatusText} allowFontScaling={false}>
          {isConnected ? 'Connected' : 'Offline'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function whenLabelFromTimestamp(ts: number | undefined, now: number): string {
  if (ts === undefined) return 'SAVED';
  const delta = now - ts;
  if (delta < 60 * 60 * 1000) return 'JUST NOW';
  if (delta < 24 * 60 * 60 * 1000) return 'TODAY';
  if (delta < 48 * 60 * 60 * 1000) return 'YESTERDAY';
  const d = new Date(ts);
  return d
    .toLocaleDateString(undefined, { weekday: 'short' })
    .toUpperCase();
}

function buildRecentEntries(
  presets: ReadonlyArray<MoltenSurfacePreset>,
): RecentEntry[] {
  const now = Date.now();
  const sorted = [...presets].sort((a, b) => {
    const ta = a.createdAt ?? 0;
    const tb = b.createdAt ?? 0;
    return tb - ta;
  });

  const out: RecentEntry[] = [];
  for (const preset of sorted) {
    if (preset.bangerId === undefined || preset.concentrateId === undefined) {
      continue;
    }
    const banger: Banger | undefined = BANGERS.find(
      (b) => b.id === preset.bangerId,
    );
    const concentrate: Concentrate | undefined = CONCENTRATES.find(
      (c) => c.id === preset.concentrateId,
    );
    if (banger === undefined || concentrate === undefined) continue;
    out.push({
      id: preset.id,
      bangerName: banger.name,
      concentrateName: concentrate.name,
      optimalF: concentrate.surface_temp_optimal_f ?? 480,
      whenLabel: whenLabelFromTimestamp(preset.createdAt, now),
    });
    if (out.length >= 4) break;
  }
  return out;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// MoltenSurface
// ─────────────────────────────────────────────────────────────────────────────

export function MoltenSurface({
  presets,
  recents,
  onApplyPreset,
}: MoltenSurfaceProps) {
  const { height: screenH } = useWindowDimensions();
  const connectionState = useBleStore((s) => s.connectionState);
  const liveBatteryPct = 92; // No battery field on bleStore yet — keep parity with index.html
  const router = useRouter();

  const {
    phase,
    setPhase,
    selections,
    selectBanger,
    selectConcentrate,
    selectRecent,
    clearSelections,
    tempF,
    peakF,
  } = useMoltenPhase();

  // Resolve current banger/concentrate once for downstream consumers
  const banger = useMemo<Banger | undefined>(
    () =>
      selections.bangerId
        ? BANGERS.find((b) => b.id === selections.bangerId)
        : undefined,
    [selections.bangerId],
  );
  const concentrate = useMemo<Concentrate | undefined>(
    () =>
      selections.concentrateId
        ? CONCENTRATES.find((c) => c.id === selections.concentrateId)
        : undefined,
    [selections.concentrateId],
  );

  // Derived numbers
  const optimalF = concentrate?.surface_temp_optimal_f ?? 480;
  const peakDisplayF = Math.round(peakF || tempF || 0);
  const orbSize = ORB_SIZE_BY_PHASE[phase];

  // Spring orb wrapper top/size based on phase
  const orbTopShared = useSharedValue(
    (ORB_TARGET_Y_BY_PHASE[phase] / REF_HEIGHT) * screenH - orbSize / 2,
  );
  const orbSizeShared = useSharedValue(orbSize);

  useEffect(() => {
    const targetY =
      (ORB_TARGET_Y_BY_PHASE[phase] / REF_HEIGHT) * screenH -
      ORB_SIZE_BY_PHASE[phase] / 2;
    const targetSize = ORB_SIZE_BY_PHASE[phase];
    orbTopShared.value = withSpring(targetY, {
      damping: 18,
      stiffness: 110,
      mass: 1,
    });
    orbSizeShared.value = withSpring(targetSize, {
      damping: 18,
      stiffness: 110,
      mass: 1,
    });
  }, [phase, screenH, orbTopShared, orbSizeShared]);

  const orbWrapperStyle = useAnimatedStyle(() => ({
    top: orbTopShared.value,
  }));

  // Recent sessions: prefer the pre-resolved `recents` prop (from
  // moltenRecents), fall back to legacy preset-derived entries so existing
  // callers don't break during migration.
  const recentEntries = useMemo<RecentEntry[]>(() => {
    if (recents && recents.length > 0) {
      return recents.map((r) => ({
        id: r.id,
        bangerName: r.bangerName,
        concentrateName: r.concentrateName,
        optimalF: r.optimalF,
        whenLabel: r.whenLabel,
      }));
    }
    return buildRecentEntries(presets);
  }, [recents, presets]);

  // Heating timer — drains the per-banger torch duration to zero while in
  // 'heating'. Duration is `torchDurationFor(banger.id)` (prototype line
  // 2044-2050); falls back to DEFAULT_TORCH_DURATION_S when no banger is set.
  const torchDurationS = useMemo(
    () => torchDurationFor(selections.bangerId),
    [selections.bangerId],
  );
  const [torchSecondsLeftJS, setTorchSecondsLeftJS] = React.useState(
    torchDurationS,
  );
  useEffect(() => {
    if (phase !== 'heating') {
      setTorchSecondsLeftJS(torchDurationS);
      return;
    }
    let remaining = torchDurationS;
    setTorchSecondsLeftJS(remaining);
    const id = setInterval(() => {
      remaining = clamp(remaining - 1, 0, torchDurationS);
      setTorchSecondsLeftJS(remaining);
      if (remaining <= 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, torchDurationS]);

  // Preset application — when a preset is selected and we have an apply hook,
  // fire it. We don't await — the visual is owned by useMoltenPhase.
  useEffect(() => {
    if (!selections.presetId || !onApplyPreset) return;
    let cancelled = false;
    void (async () => {
      try {
        await onApplyPreset(selections.presetId as string);
      } catch {
        // Swallow — caller surfaces toast.
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [selections.presetId, onApplyPreset]);

  // ── Recent-row tap handler ───────────────────────────────────────────────
  // The molten recents row stores its own ids (not preset ids), so map the
  // tapped recent's id to its banger+concentrate, then call `selectRecent` to
  // populate selections and auto-advance to `ready` (mirrors prototype line
  // 2140-2149). The existing `selections.presetId` → `onApplyPreset` effect
  // below will also fire for any recent whose id collides with a preset id,
  // preserving the legacy BLE writeSettings side-effect when applicable.
  const handleRecentSelect = React.useCallback(
    (recentId: string) => {
      const recent = recents?.find((r) => r.id === recentId);
      if (!recent) return;
      selectRecent({
        bangerId: recent.bangerId,
        concentrateId: recent.concentrateId,
        recentId,
      });
    },
    [recents, selectRecent],
  );

  // ── Action handlers for the complete overlay ─────────────────────────────
  const handleAgain = React.useCallback(() => {
    setPhase('ready');
  }, [setPhase]);

  const handleNew = React.useCallback(() => {
    clearSelections();
    setPhase('presets');
  }, [clearSelections, setPhase]);

  const handleBuildFresh = React.useCallback(() => {
    setPhase('banger');
  }, [setPhase]);

  // Cold-phase tap → kick the BLE state machine. The connectionState effect
  // inside useMoltenPhase will advance us cold → connecting → connected → presets
  // as the SCANNING/CONNECTING/.../READY transitions fire.
  const handlePairTap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      /* ignore */
    });
    // bleManager guards with `if (this.sm.current !== 'IDLE') return;` so
    // double-taps are no-ops; the user shouldn't notice.
    bleManager.startScan();
  }, []);

  // Cancel an in-flight scan by tapping the connecting screen.
  const handleCancelScan = useCallback(() => {
    bleManager.stopScan();
    setPhase('cold');
  }, [setPhase]);

  // Wordmark long-press → settings deep link.
  const handleLongPressSettings = useCallback(() => {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {
      /* ignore */
    });
    router.push('/(connected)/settings');
  }, [router]);

  // ready → heating: TorchDetector listens for the torch click. After 4s of
  // silence (or perm denied), surface a manual fallback chip so the user
  // can still advance.
  const [torchFallback, setTorchFallback] = useState(false);

  useEffect(() => {
    if (phase !== 'ready') {
      setTorchFallback(false);
      return;
    }
    let cancelled = false;
    void torchDetector.startListening(() => {
      if (cancelled) return;
      setPhase('heating');
    });
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setTorchFallback(true);
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      void torchDetector.stopListening();
    };
  }, [phase, setPhase]);

  // Auto-save recent on entry to 'complete'.
  useEffect(() => {
    if (phase !== 'complete') return;
    if (!selections.bangerId || !selections.concentrateId) return;
    void moltenRecents
      .record({
        bangerId: selections.bangerId,
        concentrateId: selections.concentrateId,
        peakF: peakDisplayF || tempF,
      })
      .catch(() => {
        /* silent — don't block UI */
      });
  }, [
    phase,
    selections.bangerId,
    selections.concentrateId,
    peakDisplayF,
    tempF,
  ]);

  // Window label: best-guess "0:24" — pulled from session length when peak was hit.
  // Without per-session window timestamps in scope, derive from default copy.
  const windowLabel = '0:24';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <MoltenBackground intensity={1}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <Header
          connectionState={connectionState}
          onLongPressSettings={handleLongPressSettings}
        />

        {/* Absolutely positioned orb whose `top` springs across phases */}
        <Animated.View
          style={[styles.orbWrapper, orbWrapperStyle]}
          pointerEvents="none"
        >
          <View style={{ width: orbSize, height: orbSize }}>
            <MoltenOrb phase={phase} size={orbSize} />
          </View>
        </Animated.View>

        {/* Phase-driven copy / overlay content (sits at bottom half of canvas) */}
        <View style={styles.contentWell} pointerEvents="box-none">
          {phase === 'cold' && <ColdCopy onPair={handlePairTap} />}
          {phase === 'connecting' && (
            <Pressable
              onPress={handleCancelScan}
              accessibilityRole="button"
              accessibilityLabel="Tap to cancel scan"
              hitSlop={16}
              style={({ pressed }) => [
                styles.cancelScanPressable,
                pressed && styles.cancelScanPressed,
              ]}
            >
              <ConnectingCopy />
            </Pressable>
          )}
          {phase === 'connected' && (
            <ConnectedCopy batteryPct={liveBatteryPct} />
          )}
          {phase === 'presets' && (
            <RecentsRow
              recents={recentEntries}
              onSelect={handleRecentSelect}
              onBuildFresh={handleBuildFresh}
            />
          )}
          {phase === 'banger' && (
            <BangerCarousel
              bangers={BANGERS}
              selectedId={selections.bangerId}
              onSelect={selectBanger}
            />
          )}
          {phase === 'concentrate' && (
            <ConcentrateGrid
              concentrates={CONCENTRATES}
              selectedId={selections.concentrateId}
              onSelect={selectConcentrate}
            />
          )}
          {phase === 'ready' && (
            <ReadyCopy
              showFallback={torchFallback}
              onFallbackPress={() => setPhase('heating')}
            />
          )}
          {phase === 'heating' && (
            <View style={styles.heatingStack}>
              <HeatingOverlay
                tempF={tempF}
                torchSecondsTotal={torchDurationS}
                torchSecondsLeft={torchSecondsLeftJS}
              />
              {/* Bottom mic-pad: matches prototype line 1921-1925 — active
                  mic-bars + chromatic "Torch detected · heating" copy. */}
              <View style={styles.heatingMicPad}>
                <MicPadIndicator />
                <Text
                  style={styles.heatingMicPadText}
                  allowFontScaling={false}
                >
                  Torch detected · heating
                </Text>
              </View>
            </View>
          )}
          {phase === 'window' && (
            <WindowOverlay tempF={tempF} optimalF={optimalF} />
          )}
          {/* dabbing — empty, just the orb */}
          {phase === 'swab' && <SwabOverlay tempF={tempF} />}
          {phase === 'dunk' && <DunkOverlay tempF={tempF} />}
          {phase === 'complete' && (
            <CompleteOverlay
              bangerName={banger?.name ?? 'Banger'}
              peakF={peakDisplayF}
              windowLabel={windowLabel}
              onAgain={handleAgain}
              onNew={handleNew}
            />
          )}
        </View>

        {/* Bottom status chip */}
        <StatusChip
          phase={phase}
          banger={banger ? { name: banger.name } : undefined}
          concentrate={
            concentrate
              ? {
                  name: concentrate.name,
                  surface_temp_optimal_f:
                    concentrate.surface_temp_optimal_f ?? null,
                }
              : undefined
          }
          batteryPct={liveBatteryPct}
        />
      </SafeAreaView>
    </MoltenBackground>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Header
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerStatusText: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },

  // Orb wrapper — absolutely positioned, animated 'top'
  orbWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content well — bottom half of screen for copy / pickers / overlays
  contentWell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    paddingBottom: 12,
  },

  // Cold-phase pressable — generous tap surface for the pair-on-tap entry.
  coldPressable: {
    paddingVertical: 12,
  },
  coldPressed: {
    opacity: 0.85,
  },

  // Copy stacks
  copyOuter: {
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 14,
  },
  copyStack: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    ...fonts.monoEyebrow,
    color: colors.prismCyan,
  },
  headline: {
    ...fonts.serifHeadline,
    color: colors.bone100,
    textAlign: 'center',
  },
  subCopy: {
    ...fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.bone60,
    textAlign: 'center',
    maxWidth: 280,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tapHintPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.prismCyan,
  },
  tapHintLabel: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },

  // Mic-pad indicator (5 vertical bars)
  micPadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    height: 22,
  },
  micBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.prismCyan,
    opacity: 0.85,
  },

  // Manual fallback chip — appears in 'ready' after 4s of mic silence.
  torchFallbackChip: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.glassThin,
    alignSelf: 'center',
  },
  torchFallbackChipPressed: {
    opacity: 0.7,
  },
  torchFallbackLabel: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },

  // Cancel-scan press surface — wraps ConnectingCopy in 'connecting'.
  cancelScanPressable: {
    paddingVertical: 12,
  },
  cancelScanPressed: {
    opacity: 0.85,
  },

  // Heating phase: stack the ring overlay above the bottom mic-pad copy
  heatingStack: {
    alignItems: 'center',
    gap: 16,
  },
  heatingMicPad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heatingMicPadText: {
    ...fonts.monoEyebrow,
    color: colors.bone100,
  },
});
