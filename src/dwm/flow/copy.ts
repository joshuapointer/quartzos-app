import type { DwmPhase } from '../backgrounds/PhaseBackground';
import { findBanger } from '../../data/bangers';
import { torchDurationS } from '../../utils/torchTimeEngine';

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

/**
 * Default torch countdown (s) used when the banger is unknown.
 * Derived as the unweighted median of the v2 `heat_time_seconds` ranges
 * across the catalog midpoints — picks a defensible estimate for an
 * unknown form factor instead of a magic number.
 */
export const DEFAULT_TORCH_DURATION_S = 30;

/**
 * Resolve the torch countdown duration (s) for a banger ID by parsing the
 * `heat_time_seconds` range from the catalog. Returns the default when the
 * banger ID is unknown.
 */
export function torchDurationFor(bangerId: string | null | undefined): number {
  if (!bangerId) return DEFAULT_TORCH_DURATION_S;
  const banger = findBanger(bangerId);
  if (!banger) return DEFAULT_TORCH_DURATION_S;
  return torchDurationS(banger);
}
