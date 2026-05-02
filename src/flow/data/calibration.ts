import type { Banger, Concentrate, Wall, Sensor, CalibResult } from './types';
import { SENSORS } from './sensors';

// ─── Phase-change load constant ──────────────────────────────────────────────
// calibration.constants.phase_change_load_f from v2 schema. The °F drop the
// surface incurs as the dab makes contact and goes through phase change.
export const PHASE_CHANGE_LOAD_F = 65;

// ─── computeCalibration ──────────────────────────────────────────────────────
// v2 four-term metrology equation (IR sensor branch):
//   displayed = T_Ideal + dT_Load + dT_Gradient + dT_emissivity + wall.mod
//   T_Ideal       = concentrate.fluid_target_optimal
//   dT_Load       = PHASE_CHANGE_LOAD_F (65)
//   dT_Gradient   = banger.gradient_lag_f * wall.gradient_multiplier
//   dT_emissivity = sensor.emissivity_bias_f * banger.emissivity_bias_multiplier
//
// Anchor case: live-rosin (T_Ideal=415) + flat-top (lag=25, εmult=1.0) +
//   standard wall (mult=1.0, mod=0) + IR sensor (εbias=15)
//   ⇒ 415 + 65 + 25 + 15 + 0 = 520 °F (matches CHANGELOG validation matrix).
//
// MFR override applied first when banger.mfr_targets present — the override
// sets BOTH the surface temperature AND the T_Ideal we feed into the equation.

export function computeCalibration(
  b: Banger,
  c: Concentrate,
  w: Wall,
  s: Sensor = SENSORS[0],
): CalibResult {
  let surface = c.surface_optimal ?? 510;
  let tIdeal = c.fluid_target_optimal ?? (surface - PHASE_CHANGE_LOAD_F);
  let override: CalibResult['override'];

  if (b.mfr_targets) {
    const isSolventless = c.cat === 'Solventless' || c.cat === 'Hash';
    const mfrTarget = isSolventless ? b.mfr_targets.solventless : b.mfr_targets.hydrocarbon;
    if (mfrTarget != null) {
      surface = mfrTarget;
      tIdeal = surface - PHASE_CHANGE_LOAD_F;
      override = {
        source: b.name,
        surface,
        reason: `★ Override: ${b.name} spec for ${isSolventless ? 'solventless' : 'hydrocarbon'} = ${surface}°F`,
      };
    }
  }

  const wallMod = w.mod;
  let displayed: number;

  if (s.method === 'ir') {
    const dTLoad = PHASE_CHANGE_LOAD_F;
    const dTGradient = b.gradient_lag_f * w.gradient_multiplier;
    const dTEmiss = s.emissivity_bias_f * b.emissivity_bias_multiplier;
    displayed = tIdeal + dTLoad + dTGradient + dTEmiss + wallMod;
  } else {
    // Future-proofing: contact / visual / enail branches collapse to surface + wall.
    displayed = surface + wallMod;
  }

  const displayedRounded = Math.round(displayed);

  return {
    surface,
    ir: displayedRounded - surface - wallMod,
    wall: wallMod,
    displayed: displayedRounded,
    low: displayedRounded - 15,
    high: displayedRounded + 15,
    dunk: displayedRounded - 280,
    ...(override ? { override } : {}),
  };
}
