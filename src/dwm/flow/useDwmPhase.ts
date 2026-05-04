import { useState, useEffect, useRef, useCallback } from 'react';
import { useBleStore } from '../../state/bleStore';
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
const PICKER_PHASES = new Set<DwmPhase>(['presets', 'banger', 'concentrate', 'wall', 'review']);
const SESSION_PHASES = new Set<DwmPhase>([
  'ready',
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
]);
const DISCONNECT_GUARD_PHASES = new Set<DwmPhase>([
  'ready',
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
  'complete',
]);

// ---------------------------------------------------------------------------
// Phase thresholds (ported verbatim from useMoltenPhase)
// ---------------------------------------------------------------------------

const PHASE_THRESHOLDS = {
  ringSize: 6,
  ringMinSamples: 4,
  windowVelocityF_per_s: -50,
  swabBandLowF: 200,
  swabBandHighF: 320,
  dunkSafeF: 250,
  completeBelowF: 180,
  completeHoldMs: 4500,
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
  const dunkCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (
      connectionState === 'IDLE' ||
      connectionState === 'ERROR' ||
      connectionState === 'RECONNECTING'
    ) {
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

      if (current === 'dabbing') {
        if (tempF > PHASE_THRESHOLDS.swabBandLowF && tempF < PHASE_THRESHOLDS.swabBandHighF) {
          setPhase('swab');
        }
        return;
      }

      if (current === 'swab') {
        if (tempF < PHASE_THRESHOLDS.dunkSafeF) {
          setPhase('dunk');
        }
        return;
      }

      if (current === 'dunk') {
        if (tempF < PHASE_THRESHOLDS.completeBelowF) {
          if (dunkCompleteTimerRef.current === null) {
            dunkCompleteTimerRef.current = setTimeout(() => {
              const latestTemp = useBleStore.getState().liveTempF;
              if (phaseRef.current === 'dunk' && latestTemp < PHASE_THRESHOLDS.completeBelowF) {
                setPhase('complete');
              }
              dunkCompleteTimerRef.current = null;
            }, PHASE_THRESHOLDS.completeHoldMs);
          }
        } else if (dunkCompleteTimerRef.current !== null) {
          clearTimeout(dunkCompleteTimerRef.current);
          dunkCompleteTimerRef.current = null;
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
    if (phase !== 'dunk' && dunkCompleteTimerRef.current !== null) {
      clearTimeout(dunkCompleteTimerRef.current);
      dunkCompleteTimerRef.current = null;
    }
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

  useEffect(() => {
    return () => {
      if (dunkCompleteTimerRef.current !== null) clearTimeout(dunkCompleteTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Wall auto-advance: wall pick → review after 240ms
  // (New flow: banger→concentrate, concentrate→wall, wall→review)
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
        setPhase('review');
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
        setPhase('ready');
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
        setPhase('ready');
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
