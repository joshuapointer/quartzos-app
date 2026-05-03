// Mirror of STATES table from quartzie-molten-refresh.html lines 1359-1373.
// `pos` is dropped — parent container handles positioning.
// Fields: r (orb radius), haloR (halo radius), haloA (halo opacity), tempK (0–1 heat).

export type MoltenPhase =
  | 'cold'
  | 'connecting'
  | 'connected'
  | 'presets'
  | 'banger'
  | 'concentrate'
  | 'ready'
  | 'heating'
  | 'window'
  | 'dabbing'
  | 'swab'
  | 'dunk'
  | 'complete';

export interface PhaseState {
  r: number;
  haloR: number;
  haloA: number;
  tempK: number;
  hasTorchRing: boolean;
}

export const MOLTEN_STATES: Record<MoltenPhase, PhaseState> = {
  cold:        { r:  42, haloR: 120, haloA: 0.18, tempK: 0.05, hasTorchRing: false },
  connecting:  { r:  60, haloR: 165, haloA: 0.32, tempK: 0.20, hasTorchRing: false },
  connected:   { r:  74, haloR: 195, haloA: 0.38, tempK: 0.30, hasTorchRing: false },
  presets:     { r:  50, haloR: 130, haloA: 0.30, tempK: 0.30, hasTorchRing: false },
  banger:      { r:  50, haloR: 130, haloA: 0.28, tempK: 0.32, hasTorchRing: false },
  concentrate: { r:  50, haloR: 140, haloA: 0.32, tempK: 0.40, hasTorchRing: false },
  ready:       { r:  92, haloR: 225, haloA: 0.42, tempK: 0.45, hasTorchRing: false },
  heating:     { r:  78, haloR: 235, haloA: 0.65, tempK: 1.00, hasTorchRing: true  },
  window:      { r: 110, haloR: 295, haloA: 0.78, tempK: 0.62, hasTorchRing: false },
  dabbing:     { r:  56, haloR: 120, haloA: 0.18, tempK: 0.10, hasTorchRing: false },
  swab:        { r:  92, haloR: 210, haloA: 0.40, tempK: 0.34, hasTorchRing: false },
  dunk:        { r:  86, haloR: 190, haloA: 0.34, tempK: 0.22, hasTorchRing: false },
  complete:    { r:  78, haloR: 200, haloA: 0.32, tempK: 0.30, hasTorchRing: false },
};
