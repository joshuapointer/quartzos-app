/**
 * src/flow/store.ts
 *
 * Phase 4 — Flow state machine. A single Zustand store that drives every
 * stage of the linear dab flow (connect → choose → build → session → complete).
 * Ported from /tmp/quartzie-prototype/src/flow-app.jsx with timer ownership
 * moved out of React effects and into the store itself.
 *
 * The store owns its setInterval lifecycle. Components only call actions and
 * subscribe to selectors — no useEffect timers anywhere downstream.
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { OrbProps, OrbState } from './components/Orb';
import {
  BANGERS,
  CONCENTRATES,
  SENSORS,
  WALLS,
  SAVED_PRESETS,
  computeCalibration,
  coldStartFit,
  type Banger,
  type CalibResult,
  type Concentrate,
  type Wall,
} from './data';

// ─── Constants ───────────────────────────────────────────────────────────────

const PHASES_HOT = ['heat', 'cool', 'dab', 'dunk', 'clean'] as const;
const PHASES_COLD = ['load', 'heat', 'dab', 'dunk', 'clean'] as const;

const HEAT_TICK_MS = 100;
const COOL_TICK_MS = 100;
const COOL_SAMPLE_MS = 1000;
const DUNK_TOTAL_MS = 4500;
const CLEAN_TOTAL_MS = 5000;
const COOL_TOTAL_MS = 25000;
const SESSION_TICK_MS = 1000;
const CONNECT_DURATION_MS = 1400;
const ADVANCE_DELAY_MS = 200;
const COOL_FAST_DROP_THRESHOLD = 3;
const COOL_FAST_DROP_RUN = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

export type Stage = 'connect' | 'choose' | 'build' | 'session' | 'complete';
export type HeatReason = 'normal' | 'missed' | 'underheated';
export type WindowState = 'waiting' | 'dabbing' | 'missed';

export type FlowState = {
  // ── Stage / connection
  stage: Stage;
  connected: boolean;
  searching: boolean;

  // ── Builder
  builderStep: number;
  bangerId: string | null;
  concId: string | null;
  sensorId: 'ir';
  wallId: string;
  coldStart: boolean;
  activePresetId: string | null;

  // ── Session
  phaseTrack: string[];
  phaseIdx: number;
  phaseProgress: number;
  sessionSeconds: number;
  windowState: WindowState;
  windowSecondsLeft: number;
  heatStage: number;
  heatTimeFactor: number;
  heatReason: HeatReason;
  coolTemp: number;
  coolDropRate: number;
  startedAt: number | null;

  // ── Actions
  connect: () => void;
  finishConnect: () => void;
  disconnect: () => void;
  startBuilder: () => void;
  applyPreset: (presetId: string) => void;
  builderNext: () => void;
  builderBack: () => void;
  setBangerId: (id: string) => void;
  setConcId: (id: string) => void;
  setWallId: (id: string) => void;
  setColdStart: (v: boolean) => void;
  liftToDab: () => void;
  placeBack: () => void;
  advancePhase: () => void;
  reset: () => void;
};

// ─── Module-level timer handles ──────────────────────────────────────────────
// Kept outside the store so they can be cancelled freely without mutating state.

let connectTimer: ReturnType<typeof setTimeout> | null = null;
let phaseTimer: ReturnType<typeof setInterval> | null = null;
let coolTimer: ReturnType<typeof setInterval> | null = null;
let sessionTimer: ReturnType<typeof setInterval> | null = null;
let advanceTimeout: ReturnType<typeof setTimeout> | null = null;

function clearPhaseTimer() {
  if (phaseTimer) {
    clearInterval(phaseTimer);
    phaseTimer = null;
  }
}
function clearCoolTimer() {
  if (coolTimer) {
    clearInterval(coolTimer);
    coolTimer = null;
  }
}
function clearSessionTimer() {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
}
function clearConnectTimer() {
  if (connectTimer) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }
}
function clearAdvanceTimeout() {
  if (advanceTimeout) {
    clearTimeout(advanceTimeout);
    advanceTimeout = null;
  }
}
function clearAllTimers() {
  clearPhaseTimer();
  clearCoolTimer();
  clearSessionTimer();
  clearConnectTimer();
  clearAdvanceTimeout();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bangerById(id: string | null): Banger | null {
  return id ? (BANGERS.find((b) => b.id === id) ?? null) : null;
}
function concById(id: string | null): Concentrate | null {
  return id ? (CONCENTRATES.find((c) => c.id === id) ?? null) : null;
}
function wallById(id: string): Wall {
  return WALLS.find((w) => w.id === id) ?? WALLS[1];
}

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL: Pick<
  FlowState,
  | 'stage'
  | 'connected'
  | 'searching'
  | 'builderStep'
  | 'bangerId'
  | 'concId'
  | 'sensorId'
  | 'wallId'
  | 'coldStart'
  | 'activePresetId'
  | 'phaseTrack'
  | 'phaseIdx'
  | 'phaseProgress'
  | 'sessionSeconds'
  | 'windowState'
  | 'windowSecondsLeft'
  | 'heatStage'
  | 'heatTimeFactor'
  | 'heatReason'
  | 'coolTemp'
  | 'coolDropRate'
  | 'startedAt'
> = {
  stage: 'connect',
  connected: false,
  searching: false,
  builderStep: 0,
  bangerId: null,
  concId: null,
  sensorId: 'ir',
  wallId: 'standard',
  coldStart: false,
  activePresetId: null,
  phaseTrack: [...PHASES_HOT],
  phaseIdx: 0,
  phaseProgress: 0,
  sessionSeconds: 0,
  windowState: 'waiting',
  windowSecondsLeft: 30,
  heatStage: 0,
  heatTimeFactor: 1,
  heatReason: 'normal',
  coolTemp: 0,
  coolDropRate: 0,
  startedAt: null,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFlow = create<FlowState>()(
  immer((set, get) => {
    // ── Internal: start the per-phase timers based on current state ──────────
    const startPhaseEffects = () => {
      clearPhaseTimer();
      clearCoolTimer();
      clearAdvanceTimeout();

      const state = get();
      if (state.stage !== 'session') return;

      const phaseKey = state.phaseTrack[state.phaseIdx];
      if (!phaseKey) return;

      const banger = bangerById(state.bangerId);
      const concentrate = concById(state.concId);
      const wall = wallById(state.wallId);

      if (phaseKey === 'heat') {
        const hs = banger?.heat_seconds ?? [25, 35];
        const phaseDur = ((hs[0] + hs[1]) / 2) * 1000 * state.heatTimeFactor;
        const startedAt = Date.now();
        phaseTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.min(1, elapsed / phaseDur);
          set((s) => {
            s.phaseProgress = p;
          });
          if (p >= 1) {
            clearPhaseTimer();
            advanceTimeout = setTimeout(() => {
              get().advancePhase();
            }, ADVANCE_DELAY_MS);
          }
        }, HEAT_TICK_MS);
        return;
      }

      if (phaseKey === 'cool') {
        // Progress timer (does NOT auto-advance from cool).
        const startedAt = Date.now();
        phaseTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.min(1, elapsed / COOL_TOTAL_MS);
          set((s) => {
            s.phaseProgress = p;
          });
          if (p >= 1) {
            clearPhaseTimer();
          }
        }, COOL_TICK_MS);

        // Live IR temp simulation + reheat triggers.
        const calibration = banger && concentrate
          ? computeCalibration(banger, concentrate, wall)
          : null;
        const targetDisplay = calibration?.displayed ?? 550;
        const targetLow = calibration?.low ?? targetDisplay - 15;

        const peak = targetDisplay + 80;
        const ratePerSec = state.heatTimeFactor >= 1 ? 2.0 : 3.5;
        let lastTemp = peak;
        let lastSampleAt = startedAt;
        let consecutiveFastDrops = 0;

        set((s) => {
          s.coolTemp = peak;
          s.coolDropRate = ratePerSec;
        });

        coolTimer = setInterval(() => {
          const now = Date.now();
          const elapsedSec = (now - startedAt) / 1000;
          const t = Math.max(150, peak - ratePerSec * elapsedSec);
          const dt = (now - lastSampleAt) / 1000;
          const drop = dt > 0 ? (lastTemp - t) / dt : 0;
          lastTemp = t;
          lastSampleAt = now;

          set((s) => {
            s.coolTemp = Math.round(t);
            s.coolDropRate = drop;
          });

          if (drop > COOL_FAST_DROP_THRESHOLD) {
            consecutiveFastDrops += 1;
          } else {
            consecutiveFastDrops = 0;
          }
          if (consecutiveFastDrops >= COOL_FAST_DROP_RUN) {
            clearCoolTimer();
            triggerReheat('underheated');
            return;
          }
          if (t < targetLow - 5) {
            clearCoolTimer();
            triggerReheat('missed');
            return;
          }
        }, COOL_SAMPLE_MS);
        return;
      }

      if (phaseKey === 'dunk') {
        const startedAt = Date.now();
        phaseTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.min(1, elapsed / DUNK_TOTAL_MS);
          set((s) => {
            s.phaseProgress = p;
          });
          if (p >= 1) {
            clearPhaseTimer();
            advanceTimeout = setTimeout(() => {
              get().advancePhase();
            }, ADVANCE_DELAY_MS);
          }
        }, COOL_TICK_MS);
        return;
      }

      if (phaseKey === 'clean') {
        const startedAt = Date.now();
        phaseTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const p = Math.min(1, elapsed / CLEAN_TOTAL_MS);
          set((s) => {
            s.phaseProgress = p;
          });
          if (p >= 1) {
            clearPhaseTimer();
            advanceTimeout = setTimeout(() => {
              get().advancePhase();
            }, ADVANCE_DELAY_MS);
          }
        }, COOL_TICK_MS);
        return;
      }

      // 'dab' and 'load' have no auto timer — user actions drive them.
    };

    const startSessionTimer = () => {
      clearSessionTimer();
      sessionTimer = setInterval(() => {
        const s = get();
        if (s.stage !== 'session') {
          clearSessionTimer();
          return;
        }
        set((draft) => {
          draft.sessionSeconds += 1;
        });
      }, SESSION_TICK_MS);
    };

    // Reheat is reachable from inside the cool timer closure, so it lives at
    // closure scope rather than as a public action.
    const triggerReheat = (reason: 'missed' | 'underheated') => {
      const s = get();
      const heatIdx = s.phaseTrack.indexOf('heat');
      if (heatIdx < 0) return;
      clearPhaseTimer();
      clearCoolTimer();
      set((draft) => {
        draft.heatTimeFactor = 0.5;
        draft.heatReason = reason;
        draft.phaseProgress = 0;
        draft.heatStage = 0;
        draft.phaseIdx = heatIdx;
        draft.coolTemp = 0;
        draft.coolDropRate = 0;
        draft.windowState = 'waiting';
      });
      startPhaseEffects();
    };

    return {
      ...INITIAL,

      // ── Connect ────────────────────────────────────────────────────────────
      connect: () => {
        clearConnectTimer();
        set((s) => {
          s.searching = true;
        });
        connectTimer = setTimeout(() => {
          get().finishConnect();
        }, CONNECT_DURATION_MS);
      },

      finishConnect: () => {
        clearConnectTimer();
        set((s) => {
          s.connected = true;
          s.searching = false;
          s.stage = 'choose';
        });
      },

      disconnect: () => {
        clearAllTimers();
        set((s) => {
          Object.assign(s, INITIAL);
        });
      },

      // ── Builder ────────────────────────────────────────────────────────────
      startBuilder: () => {
        clearAllTimers();
        set((s) => {
          s.activePresetId = null;
          s.bangerId = null;
          s.concId = null;
          s.sensorId = 'ir';
          s.wallId = 'standard';
          s.coldStart = false;
          s.builderStep = 0;
          s.stage = 'build';
          s.phaseProgress = 0;
          s.phaseIdx = 0;
          s.heatStage = 0;
          s.heatTimeFactor = 1;
          s.heatReason = 'normal';
          s.windowState = 'waiting';
          s.coolTemp = 0;
          s.coolDropRate = 0;
        });
      },

      builderNext: () => {
        const s = get();
        if (s.builderStep < 3) {
          set((draft) => {
            draft.builderStep += 1;
          });
          return;
        }
        // Transition into session.
        set((draft) => {
          draft.stage = 'session';
          draft.phaseTrack = draft.coldStart ? [...PHASES_COLD] : [...PHASES_HOT];
          draft.phaseIdx = 0;
          draft.phaseProgress = 0;
          draft.sessionSeconds = 0;
          draft.heatStage = 0;
          draft.heatTimeFactor = 1;
          draft.heatReason = 'normal';
          draft.windowState = 'waiting';
          draft.coolTemp = 0;
          draft.coolDropRate = 0;
          draft.startedAt = Date.now();
        });
        startPhaseEffects();
        startSessionTimer();
      },

      builderBack: () => {
        const s = get();
        if (s.builderStep > 0) {
          set((draft) => {
            draft.builderStep -= 1;
          });
        } else {
          set((draft) => {
            draft.stage = 'choose';
          });
        }
      },

      setBangerId: (id) =>
        set((s) => {
          s.bangerId = id;
        }),
      setConcId: (id) =>
        set((s) => {
          s.concId = id;
        }),
      setWallId: (id) =>
        set((s) => {
          s.wallId = id;
        }),
      setColdStart: (v) =>
        set((s) => {
          s.coldStart = v;
        }),

      // ── Presets ────────────────────────────────────────────────────────────
      applyPreset: (presetId: string) => {
        const preset = SAVED_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        const banger = BANGERS.find((b) => b.id === preset.banger) ?? null;
        const concentrate = CONCENTRATES.find((c) => c.id === preset.concentrate) ?? null;
        const cold = !!(concentrate?.cold_start_good && banger?.cold_start === 'YES');

        clearAllTimers();
        set((s) => {
          s.activePresetId = presetId;
          s.bangerId = preset.banger;
          s.concId = preset.concentrate;
          s.sensorId = preset.sensor;
          s.wallId = preset.wall;
          s.coldStart = cold;
          s.stage = 'session';
          s.phaseTrack = cold ? [...PHASES_COLD] : [...PHASES_HOT];
          s.phaseIdx = 0;
          s.phaseProgress = 0;
          s.sessionSeconds = 0;
          s.heatStage = 0;
          s.heatTimeFactor = 1;
          s.heatReason = 'normal';
          s.windowState = 'waiting';
          s.coolTemp = 0;
          s.coolDropRate = 0;
          s.startedAt = Date.now();
        });
        startPhaseEffects();
        startSessionTimer();
      },

      // ── Session transitions ────────────────────────────────────────────────
      liftToDab: () => {
        const s = get();
        const dabIdx = s.phaseTrack.indexOf('dab');
        if (dabIdx < 0) return;
        set((draft) => {
          draft.phaseIdx = dabIdx;
          draft.phaseProgress = 0;
          draft.windowState = 'waiting';
        });
        startPhaseEffects();
      },

      placeBack: () => {
        const s = get();
        const dunkIdx = s.phaseTrack.indexOf('dunk');
        if (dunkIdx < 0) return;
        set((draft) => {
          draft.phaseIdx = dunkIdx;
          draft.phaseProgress = 0;
          draft.windowState = 'waiting';
        });
        startPhaseEffects();
      },

      advancePhase: () => {
        const s = get();
        const last = s.phaseTrack.length - 1;
        if (s.phaseIdx >= last) {
          clearAllTimers();
          set((draft) => {
            draft.stage = 'complete';
            draft.phaseProgress = 0;
            draft.windowState = 'waiting';
            draft.heatStage = 0;
          });
          return;
        }
        set((draft) => {
          draft.phaseIdx = draft.phaseIdx + 1;
          draft.phaseProgress = 0;
          draft.windowState = 'waiting';
          draft.heatStage = 0;
        });
        startPhaseEffects();
      },

      reset: () => {
        clearAllTimers();
        set((s) => {
          // Preserve connected status; reset everything else to choose stage.
          const wasConnected = s.connected;
          Object.assign(s, INITIAL);
          s.connected = wasConnected;
          s.stage = wasConnected ? 'choose' : 'connect';
        });
      },
    };
  }),
);

// ─── Selector helpers ────────────────────────────────────────────────────────

export const useBanger = (): Banger | null => {
  const id = useFlow((s) => s.bangerId);
  return useMemo(() => bangerById(id), [id]);
};

export const useConcentrate = (): Concentrate | null => {
  const id = useFlow((s) => s.concId);
  return useMemo(() => concById(id), [id]);
};

export const useWall = (): Wall => {
  const id = useFlow((s) => s.wallId);
  return useMemo(() => wallById(id), [id]);
};

export const useSensor = () => SENSORS[0];

export const useCalibration = (): CalibResult | null => {
  const banger = useBanger();
  const concentrate = useConcentrate();
  const wall = useWall();
  return useMemo(() => {
    if (!banger || !concentrate) return null;
    return computeCalibration(banger, concentrate, wall);
  }, [banger, concentrate, wall]);
};

export const useColdStartFit = () => {
  const banger = useBanger();
  const concentrate = useConcentrate();
  return useMemo(() => {
    if (!banger || !concentrate) return 'OPTIONAL' as const;
    return coldStartFit(concentrate, banger);
  }, [banger, concentrate]);
};

// ─── useOrbProps ─────────────────────────────────────────────────────────────
// Composes the full Orb component prop bag from current store state.

export const useOrbProps = (): OrbProps => {
  const stage = useFlow((s) => s.stage);
  const phaseTrack = useFlow((s) => s.phaseTrack);
  const phaseIdx = useFlow((s) => s.phaseIdx);
  const phaseProgress = useFlow((s) => s.phaseProgress);
  const builderStep = useFlow((s) => s.builderStep);
  const heatTimeFactor = useFlow((s) => s.heatTimeFactor);
  const heatReason = useFlow((s) => s.heatReason);
  const coolTemp = useFlow((s) => s.coolTemp);
  const coolDropRate = useFlow((s) => s.coolDropRate);
  const searching = useFlow((s) => s.searching);
  const connected = useFlow((s) => s.connected);
  const banger = useBanger();
  const calibration = useCalibration();

  return useMemo<OrbProps>(() => {
    const target = calibration?.displayed ?? 550;
    const low = calibration?.low ?? target - 15;
    const high = calibration?.high ?? target + 15;

    if (stage === 'connect') {
      if (searching) {
        return { state: 'searching' satisfies OrbState, size: 200 };
      }
      return { state: 'idle' satisfies OrbState, size: 200 };
    }

    if (stage === 'choose') {
      return { state: 'standby' satisfies OrbState, size: 160 };
    }

    if (stage === 'build') {
      const sizes = [140, 150, 160, 170];
      return {
        state: 'standby' satisfies OrbState,
        size: sizes[builderStep] ?? 140,
        label: 'CONFIGURING',
      };
    }

    if (stage === 'complete') {
      return { state: 'complete' satisfies OrbState, size: 150 };
    }

    if (stage === 'session') {
      const phaseKey = phaseTrack[phaseIdx];

      if (phaseKey === 'heat') {
        const hs = banger?.heat_seconds ?? [25, 35];
        const totalSec = ((hs[0] + hs[1]) / 2) * heatTimeFactor;
        const isReheat = heatTimeFactor < 1;
        return {
          state: (isReheat ? 'heat-reheat' : 'heat') satisfies OrbState,
          size: 290,
          heatProgress: phaseProgress,
          heatTotalSeconds: totalSec,
          label: isReheat
            ? heatReason === 'missed'
              ? 'MISSED · REHEAT'
              : 'REHEAT · HALF TIME'
            : 'TORCH',
          target,
          low,
          high,
        };
      }

      if (phaseKey === 'cool') {
        const peak = target + 80;
        const floor = target - 10;
        const fallback = Math.round(peak - (peak - floor) * phaseProgress);
        const t = Math.round(coolTemp || fallback);
        const inWindow = t <= high && t >= low;
        const fastDrop = coolDropRate > COOL_FAST_DROP_THRESHOLD;
        const orbState: OrbState = fastDrop
          ? 'cool-fast-drop'
          : inWindow
            ? 'cool-in-window'
            : 'cool';
        return {
          state: orbState,
          size: 240,
          temp: t,
          target,
          low,
          high,
          dropRate: coolDropRate,
        };
      }

      if (phaseKey === 'dab') {
        return {
          state: 'dab' satisfies OrbState,
          size: 240,
          noReading: true,
          label: 'DABBING',
        };
      }

      if (phaseKey === 'dunk') {
        const dunk = calibration?.dunk ?? target - 280;
        const t = Math.round(target - (target - dunk) * phaseProgress);
        return {
          state: 'dunk' satisfies OrbState,
          size: 240,
          temp: t,
          target,
          low,
          high,
        };
      }

      if (phaseKey === 'clean') {
        const dunk = calibration?.dunk ?? target - 280;
        const t = Math.max(78, Math.round(dunk - 80 * phaseProgress));
        return {
          state: 'clean' satisfies OrbState,
          size: 170,
          temp: t,
        };
      }

      if (phaseKey === 'load') {
        // Cold-start load — a quiet standby until the user begins the heat.
        return {
          state: 'standby' satisfies OrbState,
          size: 200,
          label: 'COLD LOAD',
        };
      }
    }

    // Fallback — connected idle.
    return {
      state: connected ? 'standby' : 'idle' satisfies OrbState,
      size: 180,
    };
  }, [
    stage,
    phaseTrack,
    phaseIdx,
    phaseProgress,
    builderStep,
    heatTimeFactor,
    heatReason,
    coolTemp,
    coolDropRate,
    searching,
    connected,
    banger,
    calibration,
  ]);
};
