import { useState, useEffect, useRef, useCallback } from 'react';
import { useBleStore } from '../state/bleStore';
import { useSessionStore } from '../state/sessionStore';
import * as presetsDb from '../db/presets';
import { bleManager } from '../ble/BleManager';
import { toast } from '../design/components/Toast';
import type { MoltenPhase } from '../design/components/molten/MoltenOrb/STATES';
export type { MoltenPhase };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MoltenSelections = {
  bangerId: string | null;
  concentrateId: string | null;
  presetId: string | null;
};

export interface UseMoltenPhaseResult {
  phase: MoltenPhase;
  setPhase: (next: MoltenPhase) => void;
  // Selections
  selections: MoltenSelections;
  selectBanger: (id: string | null) => void;
  selectConcentrate: (id: string | null) => void;
  selectPreset: (id: string | null) => void;
  /**
   * Resolve a recent session entry directly — sets banger + concentrate from
   * already-known ids and auto-advances to `ready` after 700ms (mirrors
   * prototype `setupPresetRow` line 2140-2149). Use this for the molten
   * recents row whose ids do NOT live in the presets table.
   */
  selectRecent: (input: { bangerId: string; concentrateId: string; recentId?: string }) => void;
  clearSelections: () => void;
  // Convenience
  isPickerPhase: boolean;
  isSessionPhase: boolean;
  // Live temp passthrough
  tempF: number;
  peakF: number;
  /**
   * Duration of the most recent window phase (window-entry → dabbing-entry),
   * captured at the moment the user starts the dab. Null until the first
   * window→dabbing transition of the current session; reset on cold / presets.
   */
  windowDurationMs: number | null;
}

// ---------------------------------------------------------------------------
// Phase sets
// ---------------------------------------------------------------------------

const CONNECTION_PHASES = new Set<MoltenPhase>(['cold', 'connecting', 'connected']);
const PICKER_PHASES = new Set<MoltenPhase>(['presets', 'banger', 'concentrate']);
const SESSION_PHASES = new Set<MoltenPhase>([
  'ready',
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
]);
// Disconnect-protection set — mid-flow phases where a BLE drop should
// abort the session and bounce back to 'cold'. Includes 'complete' so a
// drop on the celebration screen still resets cleanly.
const DISCONNECT_GUARD_PHASES = new Set<MoltenPhase>([
  'ready',
  'heating',
  'window',
  'dabbing',
  'swab',
  'dunk',
  'complete',
]);

// ---------------------------------------------------------------------------
// Ring buffer helpers
// ---------------------------------------------------------------------------

interface TempSample {
  t: number;
  f: number;
}

const RING_SIZE = 6;

function pushRing(buf: TempSample[], sample: TempSample): TempSample[] {
  const next = [...buf, sample];
  return next.length > RING_SIZE ? next.slice(next.length - RING_SIZE) : next;
}

function ringMax(buf: TempSample[]): number {
  return buf.reduce((m, s) => (s.f > m ? s.f : m), 0);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMoltenPhase(): UseMoltenPhaseResult {
  const [phase, setPhaseState] = useState<MoltenPhase>('cold');
  const [selections, setSelections] = useState<MoltenSelections>({
    bangerId: null,
    concentrateId: null,
    presetId: null,
  });

  const connectionState = useBleStore((s) => s.connectionState);
  const tempF = useBleStore((s) => s.liveTempF);
  const peakF = useSessionStore((s) => s.peakF);

  // Ref so effects can read latest phase without stale closures
  const phaseRef = useRef<MoltenPhase>(phase);
  const selectionsRef = useRef<MoltenSelections>(selections);

  // Ring buffer of temp samples during heating phase
  const ringRef = useRef<TempSample[]>([]);

  // Velocity tracking for window → dabbing
  const velocityRef = useRef<{ lastT: number; lastF: number } | null>(null);

  // Window-phase duration capture: timestamp on window entry, snapshot on dabbing entry.
  const windowEntryTsRef = useRef<number | null>(null);
  const [windowDurationMs, setWindowDurationMs] = useState<number | null>(null);

  // Timers that need cleanup
  const connectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const concentrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dunkCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);

  // Stable setter — keeps phase ref in sync immediately
  const setPhase = useCallback((next: MoltenPhase) => {
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
        // Clear any existing timer before setting a new one
        if (connectedTimerRef.current !== null) {
          clearTimeout(connectedTimerRef.current);
        }
        connectedTimerRef.current = setTimeout(() => {
          // Only advance if still in 'connected'
          if (phaseRef.current === 'connected') {
            setPhase('presets');
          }
          connectedTimerRef.current = null;
        }, 1500);
      }
    }
  }, [connectionState, setPhase]);

  // Cleanup connected timer on unmount
  useEffect(() => {
    return () => {
      if (connectedTimerRef.current !== null) {
        clearTimeout(connectedTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 1a. Scan timeout — if we sit in SCANNING for >30s, give up + reset.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (connectionState !== 'SCANNING') return;
    const id = setTimeout(() => {
      bleManager.stopScan();
      toast.error('No Dabrite found nearby — try again');
      setPhase('cold');
    }, 30000);
    return () => clearTimeout(id);
  }, [connectionState, setPhase]);

  // ---------------------------------------------------------------------------
  // 1b. Mid-session disconnect — if BLE drops while we're in a session phase,
  //     surface a toast and bounce back to cold so the user can re-pair.
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
  // 4. heating → window (peak detection via ring buffer)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== 'heating') return;

    if (tempF <= 0) return;

    const sample: TempSample = { t: Date.now(), f: tempF };
    ringRef.current = pushRing(ringRef.current, sample);

    if (ringRef.current.length < 4) return;

    const peak = ringMax(ringRef.current);
    if (tempF < peak - 5 && tempF > 0) {
      setPhase('window');
      ringRef.current = [];
    }
  }, [tempF, setPhase]);

  // When phase transitions away from heating, reset ring buffer
  useEffect(() => {
    if (phase !== 'heating') {
      ringRef.current = [];
    }
  }, [phase]);

  // Window-duration capture: stamp on window entry (also resetting the
  // captured duration so the next dabbing transition writes a fresh value),
  // snapshot on dabbing entry, clear on cold/presets. The `windowDurationMs
  // === null` guard inside the dabbing branch makes the snapshot idempotent
  // across StrictMode double-invokes; the window-entry reset means it works
  // correctly across "Again" sessions (complete → ready → heating → window
  // → dabbing) without bouncing through cold or presets.
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
  // 5. window → dabbing (velocity < -50°F/s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== 'window') {
      velocityRef.current = null;
      return;
    }

    const now = Date.now();
    const prev = velocityRef.current;

    if (prev !== null) {
      const dt = (now - prev.lastT) / 1000; // seconds
      if (dt > 0) {
        const velocity = (tempF - prev.lastF) / dt;
        if (velocity < -50) {
          setPhase('dabbing');
          velocityRef.current = null;
          return;
        }
      }
    }

    velocityRef.current = { lastT: now, lastF: tempF };
  }, [tempF, setPhase]);

  // ---------------------------------------------------------------------------
  // 6. dabbing → swab (200–320°F, banger back on sensor)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== 'dabbing') return;
    if (tempF > 200 && tempF < 320) {
      setPhase('swab');
    }
  }, [tempF, setPhase]);

  // ---------------------------------------------------------------------------
  // 7. swab → dunk (< 250°F)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== 'swab') return;
    if (tempF < 250) {
      setPhase('dunk');
    }
  }, [tempF, setPhase]);

  // ---------------------------------------------------------------------------
  // 8. dunk → complete (< 180°F for 4500ms)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phaseRef.current !== 'dunk') {
      if (dunkCompleteTimerRef.current !== null) {
        clearTimeout(dunkCompleteTimerRef.current);
        dunkCompleteTimerRef.current = null;
      }
      return;
    }

    if (tempF < 180) {
      if (dunkCompleteTimerRef.current === null) {
        dunkCompleteTimerRef.current = setTimeout(() => {
          if (phaseRef.current === 'dunk' && tempF < 180) {
            setPhase('complete');
          }
          dunkCompleteTimerRef.current = null;
        }, 4500);
      }
    } else {
      // Temp rose back above threshold — cancel the pending timer
      if (dunkCompleteTimerRef.current !== null) {
        clearTimeout(dunkCompleteTimerRef.current);
        dunkCompleteTimerRef.current = null;
      }
    }
  }, [tempF, setPhase]);

  // Cleanup dunk timer on unmount
  useEffect(() => {
    return () => {
      if (dunkCompleteTimerRef.current !== null) {
        clearTimeout(dunkCompleteTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. concentrate auto-advance: both selected → ready after 750ms
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'concentrate') return;
    const { bangerId, concentrateId } = selections;
    if (bangerId !== null && concentrateId !== null) {
      if (concentrateTimerRef.current !== null) {
        clearTimeout(concentrateTimerRef.current);
      }
      concentrateTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'concentrate') {
          setPhase('ready');
        }
        concentrateTimerRef.current = null;
      }, 750);
    }
    return () => {
      if (concentrateTimerRef.current !== null) {
        clearTimeout(concentrateTimerRef.current);
        concentrateTimerRef.current = null;
      }
    };
  }, [phase, selections, setPhase]);

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
  }, []);

  const selectPreset = useCallback((id: string | null) => {
    if (id === null) {
      setSelections((prev) => ({ ...prev, presetId: null }));
      return;
    }
    void (async () => {
      const preset = await presetsDb.getById(id);
      if (preset === null) return;
      setSelections({
        bangerId: null,
        concentrateId: null,
        presetId: id,
      });
      if (presetTimerRef.current !== null) {
        clearTimeout(presetTimerRef.current);
      }
      presetTimerRef.current = setTimeout(() => {
        setPhase('ready');
        presetTimerRef.current = null;
      }, 700);
    })();
  }, [setPhase]);

  const selectRecent = useCallback(
    (input: { bangerId: string; concentrateId: string; recentId?: string }) => {
      setSelections({
        bangerId: input.bangerId,
        concentrateId: input.concentrateId,
        presetId: input.recentId ?? null,
      });
      if (recentTimerRef.current !== null) {
        clearTimeout(recentTimerRef.current);
      }
      recentTimerRef.current = setTimeout(() => {
        setPhase('ready');
        recentTimerRef.current = null;
      }, 700);
    },
    [setPhase],
  );

  const clearSelections = useCallback(() => {
    setSelections({ bangerId: null, concentrateId: null, presetId: null });
  }, []);

  // Cleanup preset / recent / concentrate timers on unmount
  useEffect(() => {
    return () => {
      if (presetTimerRef.current !== null) {
        clearTimeout(presetTimerRef.current);
      }
      if (recentTimerRef.current !== null) {
        clearTimeout(recentTimerRef.current);
      }
      if (concentrateTimerRef.current !== null) {
        clearTimeout(concentrateTimerRef.current);
      }
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
    selectPreset,
    selectRecent,
    clearSelections,
    isPickerPhase,
    isSessionPhase,
    tempF,
    peakF,
    windowDurationMs,
  };
}
