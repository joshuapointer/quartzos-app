import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
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

// Prototype distinguishes plain `.eyebrow` (bone-40 / gray) from
// `.eyebrow.h-eyebrow` inside `.copy-stack` (cyan). Default is cyan; pass
// `colors.bone40` for plain eyebrows (e.g. connecting "Searching").
function CopyStack({
  eyebrow,
  headline,
  sub,
  eyebrowColor,
}: {
  eyebrow: string;
  headline: string;
  sub: string;
  eyebrowColor?: string;
}) {
  return (
    <View style={styles.copyStack}>
      <Text
        style={[styles.eyebrow, eyebrowColor !== undefined && { color: eyebrowColor }]}
        allowFontScaling={false}
      >
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

// Chromatic-fringed pip: bone-white center with cyan/magenta ±2px offsets.
// Mirrors prototype `.tap-hint .pip` styling (HTML lines 264-270) and the
// `hint-breathe` keyframe (line 271, 2.8s ease-in-out, opacity 0.5↔1).
function TapHintPip() {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.tapHintPipContainer, animStyle]}>
      <View style={[styles.tapHintPipDot, styles.tapHintPipCyan]} />
      <View style={[styles.tapHintPipDot, styles.tapHintPipMagenta]} />
      <View style={[styles.tapHintPipDot, styles.tapHintPipBone]} />
    </Animated.View>
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
          <TapHintPip />
          <Text style={styles.tapHintLabel} allowFontScaling={false}>
            Tap to pair
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// 44 px chromatic scan ring shown above the "Searching…" copy. Mirrors the
// prototype's `.scan-ring` (HTML lines 1067–1080): rotating partial arc
// stroked with a cyan→magenta→gold gradient. RN can't render conic gradients
// or `mask-composite: exclude`, so we approximate with a linear-gradient
// stroke + dasharray gap and rotate the whole canvas.
function ScanRing() {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rot);
  }, [rot]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  // Visible arc ≈ 210° of the 360° circumference, gap ≈ 150°.
  // Dasharray "${arcLen} ${circ - arcLen}" makes one full dash+gap cycle
  // exactly cover the circumference, so only the single arc renders.
  const r = 18;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * (210 / 360);
  return (
    <Animated.View style={[styles.scanRing, animStyle]}>
      <Svg width={44} height={44} viewBox="0 0 44 44">
        <Defs>
          <LinearGradient id="scan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor={colors.prismCyan}    stopOpacity={0}    />
            <Stop offset="40%"  stopColor={colors.prismCyan}    stopOpacity={0.85} />
            <Stop offset="70%"  stopColor={colors.prismMagenta} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={colors.prismGold}    stopOpacity={0}    />
          </LinearGradient>
        </Defs>
        <Circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke="url(#scan-grad)"
          strokeWidth={2}
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

function ConnectingCopy() {
  return (
    <View style={styles.copyOuter}>
      <ScanRing />
      <CopyStack
        eyebrow="Searching"
        eyebrowColor={colors.bone40}
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

// PickerEnter — DIAGNOSTIC PASSTHROUGH. Re-enable spring entry once the
// invisible-picker bug is isolated.
function PickerEnter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// DIAGNOSTIC error boundary — catches render errors from picker phase children
// and renders the error message inline so we can see what (if anything) blew up.
class PhaseErrorBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.log('[PhaseErrorBoundary]', this.props.label, 'caught:', error.message, error.stack);
  }
  render() {
    if (this.state.error !== null) {
      return (
        <View
          style={{
            backgroundColor: 'rgba(255,0,0,0.4)',
            borderColor: 'red',
            borderWidth: 2,
            padding: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 11 }}>
            {`[${this.props.label}] ${this.state.error.message}`}
          </Text>
        </View>
      );
    }
    return <>{this.props.children}</>;
  }
}

// 5-bar mic-pad indicator. Idle (`live=false`) uses bone-25 for all bars
// (HTML line 642). Live (`live=true`, heating phase) colorizes per index:
// cyan / cyan / bone-100 / magenta / magenta (HTML lines 648–652).
// Per-bar heights mirror prototype 30/70/100/60/40 % of container.
// Animation is opacity 0.4 ↔ 1 over 1.4 s (HTML lines 642, 653) with 150 ms
// stagger between bars.
const MIC_BAR_HEIGHT_PCT = [0.30, 0.70, 1.00, 0.60, 0.40] as const;
const MIC_BAR_LIVE_COLORS = [
  colors.prismCyan,
  colors.prismCyan,
  colors.bone100,
  colors.prismMagenta,
  colors.prismMagenta,
] as const;

function MicPadIndicator({ live = false }: { live?: boolean }) {
  return (
    <View style={styles.micPadRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MicBar key={i} index={i} live={live} />
      ))}
    </View>
  );
}

function MicBar({ index, live }: { index: number; live: boolean }) {
  const opacity = useSharedValue(0.4);
  const initialDelay = index * 150;

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1,   { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    }, initialDelay);
    return () => {
      clearTimeout(t);
      cancelAnimation(opacity);
    };
  }, [initialDelay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.micBar,
        {
          height: 14 * MIC_BAR_HEIGHT_PCT[index],
          backgroundColor: live ? MIC_BAR_LIVE_COLORS[index] : colors.bone25,
        },
        animStyle,
      ]}
    />
  );
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

function formatMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

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
    windowDurationMs,
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

  // Cancel an in-flight scan OR an ongoing reconnect cycle by tapping the
  // connecting screen. stopScan() is a no-op while RECONNECTING, so we also
  // call cancelReconnect() to break out of the exponential backoff and let
  // the user immediately try a fresh scan.
  const handleCancelScan = useCallback(() => {
    bleManager.stopScan();
    bleManager.cancelReconnect();
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

  // Window-phase duration: captured by useMoltenPhase on the window→dabbing
  // transition. Falls back to the prototype's "0:24" placeholder until a real
  // window has happened in this session.
  const windowLabel = windowDurationMs !== null
    ? formatMmSs(windowDurationMs)
    : '0:24';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <MoltenBackground intensity={1}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* DIAGNOSTIC strip OUTSIDE contentWell — survives even if contentWell
            is unmounted. If THIS goes away on phase change, the whole
            MoltenSurface is being remounted/replaced. */}
        <View
          style={{
            backgroundColor: 'rgba(0,200,0,0.3)',
            borderColor: 'lime',
            borderWidth: 1,
            padding: 6,
            marginHorizontal: 24,
            marginTop: 4,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: 'white', fontSize: 11, fontFamily: 'GeistMono_400Regular' }}>
            {`[OUTER] phase=${phase} bId=${selections.bangerId ?? '∅'} cId=${selections.concentrateId ?? '∅'}`}
          </Text>
        </View>
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
          {/* DEBUG STRIP — remove once invisible-picker bug is isolated */}
          <View
            style={{
              backgroundColor: 'rgba(255,0,255,0.2)',
              borderColor: 'magenta',
              borderWidth: 1,
              padding: 6,
              marginBottom: 6,
            }}
            pointerEvents="none"
          >
            <Text style={{ color: 'white', fontSize: 11, fontFamily: 'GeistMono_400Regular' }}>
              {`phase=${phase} bangerId=${selections.bangerId ?? '∅'} concId=${selections.concentrateId ?? '∅'} presetId=${selections.presetId ?? '∅'}`}
            </Text>
          </View>
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
            <PickerEnter>
              <RecentsRow
                recents={recentEntries}
                onSelect={handleRecentSelect}
                onBuildFresh={handleBuildFresh}
              />
            </PickerEnter>
          )}
          {phase === 'banger' && (
            <PhaseErrorBoundary label="banger">
              <BangerCarousel
                bangers={BANGERS}
                selectedId={selections.bangerId}
                onSelect={selectBanger}
              />
            </PhaseErrorBoundary>
          )}
          {phase === 'concentrate' && (
            <PhaseErrorBoundary label="concentrate">
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <ConcentrateGrid
                  concentrates={CONCENTRATES}
                  selectedId={selections.concentrateId}
                  onSelect={selectConcentrate}
                />
              </ScrollView>
            </PhaseErrorBoundary>
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
                <MicPadIndicator live />
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

  // Content well — explicit top + bottom bounds so tall pickers (e.g. the
  // 20-tile concentrate grid) scroll inside the view instead of overflowing
  // upward off-screen. `top: 240` clears the parked picker-phase orb (which
  // sits at y≈100-200), `bottom: 80` leaves room for the status chip.
  contentWell: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 240,
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
  tapHintPipContainer: {
    // 5 px center dot + 2 px chromatic offset on each side.
    width: 9,
    height: 5,
  },
  tapHintPipDot: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tapHintPipCyan: {
    left: 0,
    backgroundColor: colors.prismCyan,
    opacity: 0.65,
  },
  tapHintPipMagenta: {
    right: 0,
    backgroundColor: colors.prismMagenta,
    opacity: 0.65,
  },
  tapHintPipBone: {
    left: 2,
    backgroundColor: colors.bone100,
  },
  tapHintLabel: {
    ...fonts.monoEyebrow,
    color: colors.bone60,
  },

  // Scan ring (connecting phase, above "Searching…")
  scanRing: {
    width: 44,
    height: 44,
    marginBottom: 14,
  },

  // Mic-pad indicator (5 vertical bars).
  // Heights follow prototype `.mic-bars span:nth-child(N)` — 30/70/100/60/40 %
  // of the 14 px container height (HTML lines 643–647).
  micPadRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    marginTop: 6,
    height: 14,
  },
  micBar: {
    width: 2.5,
    borderRadius: 2,
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
