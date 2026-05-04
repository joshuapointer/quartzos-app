import { useState, useEffect, useRef, useCallback } from 'react';
import { useBleStore } from '../../state/bleStore';
import { useSettingsStore } from '../../state/settingsStore';
import * as presetsDb from '../../db/presets';
import { bleManager } from '../../ble/BleManager';
import { toast } from '../../design/components/Toast';
import { useDabPreferencesStore } from '../../state/dabPreferencesStore';
import type { WallThicknessId } from '../../data/wallThicknesses';
import type { DwmPhase } from '../backgrounds/PhaseBackground';
export type { DwmPhase };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DwmSelections = {
  bangerId: string | null;
  concentrateId: string | null;
  wallId: string | null;
  presetId: string | null;
};

export interface UseDwmPhaseResult {
  phase: DwmPhase;
  setPhase: (next: DwmPhase) => void;
  selections: DwmSelections;
  selectBanger: (id: string | null) => void;
  selectConcentrate: (id: string | null) => void;
  selectWall: (id: string | null) => void;
  selectPreset: (id: string | null) => void;
  selectRecent: (input: { bangerId: string; concentrateId: string; recentId?: string }) => void;
  clearSelections: () => void;
  isPickerPhase: boolean;
  isSessionPhase: boolean;
  windowDurationMs: number | null;
}

// ---------------------------------------------------------------------------
// Phase sets
// ---------------------------------------------------------------------------

const CONNECTION_PHASES = new Set<DwmPhase>(['cold', 'connecting', 'connected']);
const PICKER_PHASES = new Set<DwmPhase>(['presets', 'banger', 'concentrate', 'wall']);
const SESSION_PHASES = new Set<DwmPhase>([
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
]);
const DISCONNECT_GUARD_PHASES = new Set<DwmPhase>([
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
  'complete',
]);

// ---------------------------------------------------------------------------
// Phase thresholds — runtime-only constants (NOT the dab/dunk/torch values
// themselves; those derive from settingsStore + the calibration engine).
// ---------------------------------------------------------------------------

const PHASE_THRESHOLDS = {
  ringSize: 6,
  ringMinSamples: 4,
  /** Window→Dabbing trigger: temp drops faster than this = banger lifted. */
  windowVelocityF_per_s: -50,
  /** Dabbing→Swab trigger: temp must climb this far above dunkF for the
   *  reading to count as "banger placed back on rite (still warm)". */
  swabReturnDeltaF: 50,
  scanTimeoutMs: 30000,
  connectedDelayMs: 1500,
  wallAdvanceMs: 240,
  presetAdvanceMs: 700,
  recentAdvanceMs: 700,
} as const;

// ---------------------------------------------------------------------------
// Ring buffer helpers
// ---------------------------------------------------------------------------

interface TempSample {
  t: number;
  f: number;
}

function pushRing(buf: TempSample[], sample: TempSample): TempSample[] {
  const next = [...buf, sample];
  return next.length > PHASE_THRESHOLDS.ringSize ? next.slice(next.length - PHASE_THRESHOLDS.ringSize) : next;
}

function ringMax(buf: TempSample[]): number {
  return buf.reduce((m, s) => (s.f > m ? s.f : m), 0);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDwmPhase(): UseDwmPhaseResult {
  const [phase, setPhaseState] = useState<DwmPhase>('cold');
  const [selections, setSelections] = useState<DwmSelections>({
    bangerId: null,
    concentrateId: null,
    wallId: null,
    presetId: null,
  });

  const connectionState = useBleStore((s) => s.connectionState);

  const phaseRef = useRef<DwmPhase>(phase);
  const selectionsRef = useRef<DwmSelections>(selections);

  const ringRef = useRef<TempSample[]>([]);
  const velocityRef = useRef<{ lastT: number; lastF: number } | null>(null);

  const windowEntryTsRef = useRef<number | null>(null);
  const [windowDurationMs, setWindowDurationMs] = useState<number | null>(null);

  const connectedTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wallTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Last non-zero temp seen during dunk phase — used for zero-edge detection. */
  const dunkLastTempRef      = useRef<number>(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { selectionsRef.current = selections; }, [selections]);

  const setPhase = useCallback((next: DwmPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. BLE connection state → cold / connecting / connected / presets
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const current = phaseRef.current;

    if (connectionState === 'IDLE' || connectionState === 'ERROR') {
      if (CONNECTION_PHASES.has(current)) {
        setPhase('cold');
      }
      return;
    }

    if (
      connectionState === 'SCANNING' ||
      connectionState === 'CONNECTING' ||
      connectionState === 'DISCOVERING' ||
      connectionState === 'SUBSCRIBING' ||
      connectionState === 'RECONNECTING'
    ) {
      if (current === 'cold' || current === 'connecting') {
        setPhase('connecting');
      }
      return;
    }

    if (connectionState === 'READY') {
      if (current === 'cold' || current === 'connecting') {
        setPhase('connected');
        if (connectedTimerRef.current !== null) {
          clearTimeout(connectedTimerRef.current);
        }
        connectedTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'connected') {
            setPhase('presets');
          }
          connectedTimerRef.current = null;
        }, PHASE_THRESHOLDS.connectedDelayMs);
      }
    }
  }, [connectionState, setPhase]);

  useEffect(() => {
    return () => {
      if (connectedTimerRef.current !== null) clearTimeout(connectedTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 1a. Scan timeout — if we sit in SCANNING for >30s, give up + reset.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (connectionState !== 'SCANNING') return;
    const id = setTimeout(() => {
      bleManager.stopScan();
      toast.error('No Dabrite found nearby. Try again.');
      setPhase('cold');
    }, PHASE_THRESHOLDS.scanTimeoutMs);
    return () => clearTimeout(id);
  }, [connectionState, setPhase]);

  // ---------------------------------------------------------------------------
  // 1b. Mid-session disconnect guard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!DISCONNECT_GUARD_PHASES.has(phaseRef.current)) return;
    if (connectionState === 'ERROR') {
      toast.error('DabRite stopped responding — power-cycle it');
      setPhase('cold');
    } else if (connectionState === 'IDLE' || connectionState === 'RECONNECTING') {
      toast.error('Lost connection to Dabrite');
      setPhase('cold');
    }
  }, [connectionState, setPhase]);

  // ---------------------------------------------------------------------------
  // 4-8. Per-temp-sample phase transitions (heating→window→dabbing→swab→dunk→complete)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsub = useBleStore.subscribe((state, prev) => {
      if (state.liveTempF === prev.liveTempF) return;
      const tempF = state.liveTempF;
      const current = phaseRef.current;

      if (current === 'heating') {
        if (tempF <= 0) return;
        const sample: TempSample = { t: Date.now(), f: tempF };
        ringRef.current = pushRing(ringRef.current, sample);
        if (ringRef.current.length < PHASE_THRESHOLDS.ringMinSamples) return;
        const peak = ringMax(ringRef.current);
        if (tempF < peak - 5 && tempF > 0) {
          setPhase('window');
          ringRef.current = [];
        }
        return;
      }

      if (current === 'window') {
        const now = Date.now();
        const prevV = velocityRef.current;
        if (prevV !== null) {
          const dt = (now - prevV.lastT) / 1000;
          if (dt > 0) {
            const velocity = (tempF - prevV.lastF) / dt;
            if (velocity < PHASE_THRESHOLDS.windowVelocityF_per_s) {
              setPhase('dabbing');
              velocityRef.current = null;
              return;
            }
          }
        }
        velocityRef.current = { lastT: now, lastF: tempF };
        return;
      }

      // The dab→dunk leg mirrors the heating→window leg: watch the temp
      // descend through a derived target, then advance on a clear user-action
      // signal (banger lifted off the thermometer = reading drops to 0).
      const dunkF = useSettingsStore.getState().settings.dunkAlarmF;

      if (current === 'dabbing') {
        // Banger placed back on the DabRite — reading climbs above
        // dunkF + safety margin (still warm, definitely on the pad).
        if (tempF > 0 && tempF > dunkF + PHASE_THRESHOLDS.swabReturnDeltaF) {
          setPhase('swab');
        }
        return;
      }

      if (current === 'swab') {
        // Mirror the cool-down: surface temp descends through derived dunkF
        // — alarm point. Advance to the dunk-now screen.
        if (tempF > 0 && tempF <= dunkF) {
          setPhase('dunk');
        }
        return;
      }

      if (current === 'dunk') {
        // Banger removed from the thermometer for iso-dunk = sensor
        // returns 0 (or invalid). We require we'd seen a non-zero reading
        // first so a momentary 0 at entry doesn't bypass the alarm.
        if (tempF > 0) {
          dunkLastTempRef.current = tempF;
        } else if (dunkLastTempRef.current > 0) {
          dunkLastTempRef.current = 0;
          setPhase('complete');
        }
        return;
      }
    });
    return unsub;
  }, [setPhase]);

  // Reset per-phase trackers when leaving the originating phase
  useEffect(() => {
    if (phase !== 'heating') ringRef.current = [];
    if (phase !== 'window') velocityRef.current = null;
    if (phase !== 'dunk') dunkLastTempRef.current = 0;
  }, [phase]);

  // Window-duration capture
  useEffect(() => {
    if (phase === 'window') {
      windowEntryTsRef.current = Date.now();
      setWindowDurationMs(null);
    } else if (
      phase === 'dabbing' &&
      windowEntryTsRef.current !== null &&
      windowDurationMs === null
    ) {
      setWindowDurationMs(Date.now() - windowEntryTsRef.current);
      windowEntryTsRef.current = null;
    } else if (phase === 'cold' || phase === 'presets') {
      windowEntryTsRef.current = null;
      setWindowDurationMs(null);
    }
  }, [phase, windowDurationMs]);

  // ---------------------------------------------------------------------------
  // 2. Wall auto-advance: wall pick → heating after 240ms
  // (No verify step — adjustments happen on the heat screen via sliders.)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (wallTimerRef.current !== null) {
        clearTimeout(wallTimerRef.current);
        wallTimerRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Selections actions
  // ---------------------------------------------------------------------------

  const selectBanger = useCallback((id: string | null) => {
    setSelections((prev) => ({ ...prev, bangerId: id }));
    const current = phaseRef.current;
    if (current === 'presets' || current === 'banger') {
      setPhase('concentrate');
    }
  }, [setPhase]);

  const selectConcentrate = useCallback((id: string | null) => {
    setSelections((prev) => ({ ...prev, concentrateId: id }));
    const current = phaseRef.current;
    if (current === 'concentrate') {
      setPhase('wall');
    }
  }, [setPhase]);

  const selectWall = useCallback((id: string | null) => {
    setSelections((prev) => ({ ...prev, wallId: id }));
    // Persist preference for next fresh build
    if (id !== null) {
      useDabPreferencesStore.getState().setPreferredWall(id as WallThicknessId);
    }
    if (wallTimerRef.current !== null) clearTimeout(wallTimerRef.current);
    wallTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'wall') {
        setPhase('heating');
      }
      wallTimerRef.current = null;
    }, PHASE_THRESHOLDS.wallAdvanceMs);
  }, [setPhase]);

  const selectPreset = useCallback((id: string | null) => {
    if (id === null) {
      setSelections((prev) => ({ ...prev, presetId: null }));
      return;
    }
    void (async () => {
      const preset = await presetsDb.getById(id);
      if (preset === null) return;
      // Default wallId from user preference when entering via preset
      const preferredWall = useDabPreferencesStore.getState().preferredWall;
      setSelections({
        bangerId: null,
        concentrateId: null,
        wallId: preferredWall,
        presetId: id,
      });
      if (presetTimerRef.current !== null) clearTimeout(presetTimerRef.current);
      presetTimerRef.current = setTimeout(() => {
        setPhase('heating');
        presetTimerRef.current = null;
      }, PHASE_THRESHOLDS.presetAdvanceMs);
    })();
  }, [setPhase]);

  const selectRecent = useCallback(
    (input: { bangerId: string; concentrateId: string; recentId?: string }) => {
      const preferredWall = useDabPreferencesStore.getState().preferredWall;
      setSelections({
        bangerId: input.bangerId,
        concentrateId: input.concentrateId,
        wallId: preferredWall,
        presetId: input.recentId ?? null,
      });
      if (recentTimerRef.current !== null) clearTimeout(recentTimerRef.current);
      recentTimerRef.current = setTimeout(() => {
        setPhase('heating');
        recentTimerRef.current = null;
      }, PHASE_THRESHOLDS.recentAdvanceMs);
    },
    [setPhase],
  );

  const clearSelections = useCallback(() => {
    setSelections({ bangerId: null, concentrateId: null, wallId: null, presetId: null });
  }, []);

  // Cleanup preset / recent / wall timers on unmount
  useEffect(() => {
    return () => {
      if (presetTimerRef.current !== null) clearTimeout(presetTimerRef.current);
      if (recentTimerRef.current !== null) clearTimeout(recentTimerRef.current);
      if (wallTimerRef.current !== null) clearTimeout(wallTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Derived flags
  // ---------------------------------------------------------------------------

  const isPickerPhase = PICKER_PHASES.has(phase);
  const isSessionPhase = SESSION_PHASES.has(phase);

  return {
    phase,
    setPhase,
    selections,
    selectBanger,
    selectConcentrate,
    selectWall,
    selectPreset,
    selectRecent,
    clearSelections,
    isPickerPhase,
    isSessionPhase,
    windowDurationMs,
  };
}
