import type { DwmPhase } from '../backgrounds/PhaseBackground';

export interface PhaseCopy {
  eyebrow: string;
  headline: string;
  sub: string;
}

export const PHASE_COPY: Record<DwmPhase, PhaseCopy> = {
  cold:        { eyebrow: 'step 01',         headline: 'wake up your dabrite.',           sub: 'tap and hold the side button until the LED breathes.' },
  connecting:  { eyebrow: 'searching',       headline: 'looking for a dabrite nearby…', sub: "if nothing happens, hold the dabrite's side button until its LED breathes." },
  connected:   { eyebrow: 'linked',          headline: 'we good.',                        sub: '' },
  presets:     { eyebrow: 'pick a sesh',     headline: 'how we doing this?',              sub: 'tap a saved sesh, or build one fresh.' },
  banger:      { eyebrow: 'step 1 of 3',     headline: 'what banger are we using?',       sub: '' },
  concentrate: { eyebrow: 'step 2 of 3',     headline: 'pick your concentrate.',          sub: '' },
  wall:        { eyebrow: 'step 3 of 3',     headline: 'how thick are the walls?',        sub: '' },
  review:      { eyebrow: 'all set',         headline: 'ready when you are.',             sub: 'hold me down to start the sesh.' },
  ready:       { eyebrow: 'all set',         headline: 'ready when you are.',             sub: 'hold me down to start the sesh.' },
  heating:     { eyebrow: 'phase 1 · heat',  headline: 'torch your banger.',         sub: "i've got my eyes closed — focus." },
  window:      { eyebrow: 'phase 2 · cool',  headline: 'place it on the dabrite.',   sub: "i'll yell when you're in the window. lift the second i do." },
  dabbing:     { eyebrow: 'phase 3 · dab',   headline: 'lift, dab, breathe in.',     sub: 'keep it gentle — slow inhale beats a hot rip.' },
  swab:        { eyebrow: 'phase 4 · swab',  headline: 'swab the q-tip.',            sub: 'one swipe, no scrubbing. residue lifts when the quartz is still warm.' },
  dunk:        { eyebrow: 'phase 5 · dunk',  headline: 'final swab. cap it.',        sub: 'last pass. drop the cap. the next sesh starts cleaner this way.' },
  complete:    { eyebrow: 'that was nice',   headline: 'see you soon.',                   sub: '' },
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
