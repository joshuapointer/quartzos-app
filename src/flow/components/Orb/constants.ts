import { reanimatedEasing } from '@/design/tokens';
import type { OrbState } from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_SIZE: Record<OrbState, number> = {
  idle: 200,
  searching: 200,
  standby: 160,
  heat: 290,
  'heat-reheat': 290,
  cool: 240,
  'cool-fast-drop': 240,
  // The dab window is the moment the product exists for — give the orb the
  // largest stage of the cool phase. Slightly under heat (290) so the visual
  // hierarchy still reads "after the burn" rather than "second torch".
  'cool-in-window': 280,
  // The dab is the moment of the product — same stage as the in-window state.
  // Don't shrink at the moment of payoff.
  dab: 280,
  dunk: 240,
  clean: 170,
  complete: 150,
};

export const DEFAULT_LABEL: Record<OrbState, string> = {
  idle: 'DAB RITE OFFLINE',
  searching: 'SCANNING',
  standby: 'STANDBY',
  heat: 'TORCH',
  'heat-reheat': 'REHEAT',
  cool: 'LIVE · IR',
  'cool-fast-drop': 'COOLING FAST',
  'cool-in-window': 'IN WINDOW',
  dab: 'DABBING',
  dunk: 'DUNK READY',
  clean: 'CLEAN',
  complete: 'COMPLETE',
};

export const MORPH = { duration: 700, easing: reanimatedEasing.easeOut };
export const FADE = { duration: 380, easing: reanimatedEasing.easeOut };

export const A11Y_LABEL: Record<OrbState, string> = {
  idle:              'Temperature dial, device not connected',
  searching:         'Temperature dial, scanning for device',
  standby:           'Temperature dial, standby',
  heat:              'Temperature dial, heating',
  'heat-reheat':     'Temperature dial, reheating',
  cool:              'Temperature dial, cooling',
  'cool-fast-drop':  'Temperature dial, cooling fast',
  'cool-in-window':  'Temperature dial, ready to dab',
  dab:               'Temperature dial, dabbing',
  dunk:              'Temperature dial, dunk ready',
  clean:             'Temperature dial, clean up',
  complete:          'Temperature dial, session complete',
};
