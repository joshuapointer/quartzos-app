/**
 * Dab-window derivation engine.
 *
 * Implements the Newton's-law cooling formula from docs/perfect_dab/dab_window.md:
 *
 *     T(t) = T_amb + (T_torchOff - T_amb) · exp(-k·t)
 *
 * Inverted for time-to-temperature:
 *
 *     t(T) = (1 / k_eff) · ln((T_torchOff - T_amb) / (T - T_amb))
 *
 *   k_eff = banger.cooling.k_per_second × wall_k_multiplier
 *
 * Returns four time milestones a UI can use:
 *   - t_enter_window_s   — first moment surface drops into operable range
 *   - t_at_optimal_s     — surface hits concentrate.surface_temp_optimal_f
 *   - t_leave_window_s   — surface drops out of operable range (too cold to vaporize)
 *   - full_window_s      — leave − enter
 *   - optimal_band_s     — duration spent within ±15 °F of optimal
 *
 * Edge cases:
 *   - PID e-banger (k=null) → returns `note: 'PID-controlled, constant temp'`.
 *   - Blocked / no-range concentrate → returns null (don't compute).
 *
 * Source: docs/perfect_dab/dab_window.md (Newton's law derivation).
 */

import type { Banger } from '../data/bangers';
import type { Concentrate } from '../data/concentrates';
import type { WallThickness, WallThicknessId } from '../data/wallThicknesses';
import { CALIBRATION_CONSTANTS } from '../data/calibrationConstants';

/**
 * Wall-thickness scalar applied to `banger.cooling.k_per_second`.
 *
 * Source: docs/perfect_dab/dab_window.md (Wall thickness multipliers table).
 * Distinct from `wall.gradient_multiplier` — that scales gradient lag (Fourier τ),
 * this scales cooling rate (lumped capacitance — thinner walls cool faster).
 */
const WALL_K_MULTIPLIER: Record<WallThicknessId, number> = {
  thin: 1.25,
  standard: 1.0,
  thick: 0.65,
  unknown: 1.0,
};

/** ±°F band around optimal that defines the "tight optimal" window. */
const OPTIMAL_BAND_F = 15;

export interface DabWindow {
  readonly k_effective: number;
  readonly t_enter_window_s: number;
  readonly t_enter_optimal_band_s: number;
  readonly t_at_optimal_s: number;
  readonly t_leave_optimal_band_s: number;
  readonly t_leave_window_s: number;
  readonly full_window_s: number;
  readonly optimal_band_s: number;
}

export type DabWindowResult =
  | { readonly kind: 'window'; readonly window: DabWindow }
  | { readonly kind: 'pid'; readonly note: string }
  | { readonly kind: 'blocked'; readonly note: string };

export interface DabWindowInput {
  readonly banger: Banger;
  readonly concentrate: Concentrate;
  readonly wall: WallThickness;
}

export function computeDabWindow(input: DabWindowInput): DabWindowResult {
  const { banger, concentrate, wall } = input;
  const C = CALIBRATION_CONSTANTS;

  if (
    concentrate.blocked != null ||
    concentrate.surface_temp_range_f == null ||
    concentrate.surface_temp_optimal_f == null
  ) {
    return {
      kind: 'blocked',
      note: concentrate.blocked ?? 'Concentrate has no operable surface temp range.',
    };
  }

  const k_base = banger.cooling.k_per_second;
  if (k_base == null) {
    return { kind: 'pid', note: 'PID-controlled, constant temp — window is unbounded.' };
  }

  const m_wall = WALL_K_MULTIPLIER[wall.id] ?? 1.0;
  const k_eff = k_base * m_wall;

  const T_AMB = C.ambient_temp_f;
  const T_OFF = C.torch_off_temp_f;
  const [rangeLow, rangeHigh] = concentrate.surface_temp_range_f;
  const T_high = Math.min(rangeHigh, T_OFF - 1);
  const T_low = rangeLow;
  const T_opt = concentrate.surface_temp_optimal_f;
  const T_opt_high = Math.min(T_opt + OPTIMAL_BAND_F, T_high);
  const T_opt_low = Math.max(T_opt - OPTIMAL_BAND_F, T_low);

  const t = (T: number): number =>
    (1 / k_eff) * Math.log((T_OFF - T_AMB) / (T - T_AMB));

  const round1 = (x: number): number => Math.round(x * 10) / 10;

  const t_enter = t(T_high);
  const t_optHi = t(T_opt_high);
  const t_opt = t(T_opt);
  const t_optLo = t(T_opt_low);
  const t_leave = t(T_low);

  return {
    kind: 'window',
    window: {
      k_effective: k_eff,
      t_enter_window_s: round1(t_enter),
      t_enter_optimal_band_s: round1(t_optHi),
      t_at_optimal_s: round1(t_opt),
      t_leave_optimal_band_s: round1(t_optLo),
      t_leave_window_s: round1(t_leave),
      full_window_s: round1(t_leave - t_enter),
      optimal_band_s: round1(t_optLo - t_optHi),
    },
  };
}

/**
 * Time (s after torch-off) for surface to reach `targetF`.
 * Standalone export for callers that need a single milestone — e.g.,
 * predicting when the dunk-temp alarm will fire post-dab.
 */
export function timeToReachSurfaceTempS(
  banger: Banger,
  wall: WallThickness,
  targetF: number,
): number | null {
  const C = CALIBRATION_CONSTANTS;
  const k_base = banger.cooling.k_per_second;
  if (k_base == null) return null;
  const m_wall = WALL_K_MULTIPLIER[wall.id] ?? 1.0;
  const k_eff = k_base * m_wall;
  if (targetF <= C.ambient_temp_f) return null;
  return (1 / k_eff) * Math.log((C.torch_off_temp_f - C.ambient_temp_f) / (targetF - C.ambient_temp_f));
}
