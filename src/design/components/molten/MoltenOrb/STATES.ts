// Mirror of STATES table from quartzie-molten-refresh.html lines 1360-1372.
// `pos` is dropped — parent container handles positioning.
//
// Fields:
//   r          — orb radius
//   haloR      — soft blue-purple halo radius
//   haloA      — halo opacity
//   tempK      — 0-1 heat (drives orb gradient stop interpolation)
//   hasTorchRing — whether to draw the chromatic torch ring (heating only)
//   chrom      — chromatic dispersion intensity (0-1) — drives caustic, fringes,
//                halo-prism radius. Mirrors prototype STATES.chrom.
//   sparks     — spark emission rate scalar (0-1) — only meaningful in heating
//                in our impl (prototype uses it as a continuous ambient field)
//   pulse      — flag (0 or 1) for the chromatic triple-burst pulse rings.
//                Prototype lights this only in 'window' to celebrate the peak.

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
  chrom: number;
  sparks: number;
  pulse: number;
}

export const MOLTEN_STATES: Record<MoltenPhase, PhaseState> = {
  cold:        { r:  42, haloR: 120, haloA: 0.18, tempK: 0.05, hasTorchRing: false, chrom: 0.08, sparks: 0,    pulse: 0 },
  connecting:  { r:  60, haloR: 165, haloA: 0.32, tempK: 0.20, hasTorchRing: false, chrom: 0.12, sparks: 0.10, pulse: 0 },
  connected:   { r:  74, haloR: 195, haloA: 0.38, tempK: 0.30, hasTorchRing: false, chrom: 0.16, sparks: 0.16, pulse: 0 },
  presets:     { r:  50, haloR: 130, haloA: 0.30, tempK: 0.30, hasTorchRing: false, chrom: 0.18, sparks: 0.10, pulse: 0 },
  banger:      { r:  50, haloR: 130, haloA: 0.28, tempK: 0.32, hasTorchRing: false, chrom: 0.10, sparks: 0.08, pulse: 0 },
  concentrate: { r:  50, haloR: 140, haloA: 0.32, tempK: 0.40, hasTorchRing: false, chrom: 0.10, sparks: 0.12, pulse: 0 },
  ready:       { r:  92, haloR: 225, haloA: 0.42, tempK: 0.45, hasTorchRing: false, chrom: 0.18, sparks: 0.16, pulse: 0 },
  heating:     { r:  78, haloR: 235, haloA: 0.65, tempK: 1.00, hasTorchRing: true,  chrom: 0.05, sparks: 0.95, pulse: 0 },
  window:      { r: 110, haloR: 295, haloA: 0.78, tempK: 0.62, hasTorchRing: false, chrom: 0.70, sparks: 0.30, pulse: 1 },
  dabbing:     { r:  56, haloR: 120, haloA: 0.18, tempK: 0.10, hasTorchRing: false, chrom: 0.16, sparks: 0.04, pulse: 0 },
  swab:        { r:  92, haloR: 210, haloA: 0.40, tempK: 0.34, hasTorchRing: false, chrom: 0.55, sparks: 0.18, pulse: 0 },
  dunk:        { r:  86, haloR: 190, haloA: 0.34, tempK: 0.22, hasTorchRing: false, chrom: 0.45, sparks: 0.10, pulse: 0 },
  complete:    { r:  78, haloR: 200, haloA: 0.32, tempK: 0.30, hasTorchRing: false, chrom: 0.30, sparks: 0.06, pulse: 0 },
};
