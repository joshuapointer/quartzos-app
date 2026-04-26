import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TempSample { t: number; f: number; }
interface SessionState {
  active: boolean;
  startedAt: number | null;
  peakF: number;
  samples: TempSample[];
  dabAlertFired: boolean;
  dunkAlertFired: boolean;
  startSession: () => void;
  endSession: () => void;
  addSample: (f: number) => void;
  fireAlert: (kind: 'dab' | 'dunk') => void;
}

export const useSessionStore = create<SessionState>()(immer((set) => ({
  active: false,
  startedAt: null,
  peakF: 0,
  samples: [],
  dabAlertFired: false,
  dunkAlertFired: false,
  startSession: () => set((s) => { s.active = true; s.startedAt = Date.now(); s.peakF = 0; s.samples = []; s.dabAlertFired = false; s.dunkAlertFired = false; }),
  endSession: () => set((s) => { s.active = false; s.startedAt = null; s.peakF = 0; s.samples = []; s.dabAlertFired = false; s.dunkAlertFired = false; }),
  addSample: (f) => set((s) => {
    if (s.active && s.startedAt) {
      s.samples.push({ t: (Date.now() - s.startedAt) / 1000, f });
      if (f > s.peakF) s.peakF = f;
    }
  }),
  fireAlert: (kind) => set((s) => { if (kind === 'dab') s.dabAlertFired = true; else s.dunkAlertFired = true; }),
})));
