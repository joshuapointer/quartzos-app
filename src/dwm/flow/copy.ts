import type { DwmPhase } from '../backgrounds/PhaseBackground';

export interface PhaseCopy {
  eyebrow: string;
  headline: string;
  sub: string;
}

// Ported verbatim from dabwithme-flow.html. Phase 4 (impl id 'swab') maps to
// the prototype's `dunk` phase content (post-dab while warm). Phase 5 (impl
// id 'dunk') maps to the prototype's `clean` phase content (final swab + cap).
export const PHASE_COPY: Record<DwmPhase, PhaseCopy> = {
  cold:        { eyebrow: "no device · let's pair", headline: 'hey. wake up your dabrite.',          sub: "press & hold bub to start the scan. flick the IR thermometer on and i'll do the rest." },
  connecting:  { eyebrow: 'no device · pairing',    headline: 'looking for your dabrite…',           sub: "flick the IR thermometer on. i'll catch the bluetooth handshake and we're live." },
  connected:   { eyebrow: 'linked',                 headline: 'we good.',                            sub: '' },
  presets:     { eyebrow: 'ready when you are',     headline: 'pick a sesh.',                        sub: '' },
  banger:      { eyebrow: 'step 1 of 4 · banger',       headline: "what's on the rig?",              sub: 'wall + material set the heat curve. swipe through and tap the closest match.' },
  concentrate: { eyebrow: 'step 2 of 4 · concentrate',  headline: 'what are we dabbing?',            sub: "each one wants a different heat. pick yours and i'll set the window." },
  wall:        { eyebrow: 'step 3 of 4 · wall',         headline: 'how thick is the wall?',          sub: 'guesstimate is fine. just refines the cool-down clock.' },
  review:      { eyebrow: 'step 4 of 4 · check',        headline: 'all set?',                        sub: 'press & hold bub to start the sesh.' },
  ready:       { eyebrow: 'step 4 of 4 · check',        headline: 'all set?',                        sub: 'press & hold bub to start the sesh.' },
  heating:     { eyebrow: 'phase 1 · heat',  headline: 'torch your banger.',                          sub: 'low & even sweeps until the timer hits zero. tap me to skip.' },
  window:      { eyebrow: 'phase 2 · cool',  headline: 'let me cool. lift when i turn green.',       sub: "red → orange → yellow → green. lift it and i'll feel it leave the pad." },
  dabbing:     { eyebrow: 'phase 3 · dab',   headline: 'lift, dab, breathe in.',                     sub: "slow inhale beats a hot rip. place it back when you're done — i'll catch it." },
  swab:        { eyebrow: 'phase 4 · dunk',  headline: 'time for a swim.',                           sub: 'one swipe, no scrubbing. residue lifts while the quartz is still warm.' },
  dunk:        { eyebrow: 'phase 5 · clean', headline: 'final swab. cap it.',                        sub: 'last pass. drop the cap. next sesh starts cleaner this way.' },
  complete:    { eyebrow: 'sesh logged',     headline: 'that was nice.',                             sub: 'i saved it. you can pull up this exact sesh from the home screen any time — or tweak it.' },
};

// Per-banger torch duration in seconds — ported verbatim from MoltenSurface.tsx
export const TORCH_DURATION_BY_BANGER_ID: Record<string, number> = {
  'flat-top':       90,
  'beveled':        85,
  'opaque-bottom':  90,
  'thermal':       110,
  'round-bottom':   80,
  'core-reactor':   95,
  'swing-arm':      75,
  'terp-slurper':   85,
  'blender':        80,
  'spinner':        75,
  'control-tower':  90,
  'charmer':        85,
  'insert':         95,
  'e-banger':       60,
};

export const DEFAULT_TORCH_DURATION_S = 90;

export function torchDurationFor(bangerId: string | null | undefined): number {
  if (!bangerId) return DEFAULT_TORCH_DURATION_S;
  return TORCH_DURATION_BY_BANGER_ID[bangerId] ?? DEFAULT_TORCH_DURATION_S;
}
