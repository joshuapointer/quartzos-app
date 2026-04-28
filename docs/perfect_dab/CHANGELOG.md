# QuartzOS Reference Data — v2.0.0 Changelog

## Headline change: calibration model rewrite

v1 used a single fused offset per banger:

```
displayed_temp = interior_surface_temp + (banger.ir_offset_sign * banger.ir_offset_f) + wall.modifier_f
```

v2 replaces this with the four-term metrology equation derived in your research:

```
T_IR_Setpoint = T_Ideal + dT_Load + dT_Gradient + dT_emissivity
```

with each term sourced from a different axis:

| Term            | Source                                      | Typical value          |
| --------------- | ------------------------------------------- | ---------------------- |
| `T_Ideal`       | `concentrate.fluid_target_optimal_f`        | 335–515 °F             |
| `dT_Load`       | `calibration.constants.phase_change_load_f` | +65 °F (constant)      |
| `dT_Gradient`   | `banger.gradient_lag_f × wall.gradient_multiplier` | +5 to +60 °F   |
| `dT_emissivity` | `sensor.emissivity_bias_f × banger.emissivity_bias_multiplier` | 0–50 °F |

## What the model gets right (validation matrix)

All nine research-grounded case studies reproduce within community-reported ranges:

| Scenario                                                   | Computed | Expected | Pass |
| ---------------------------------------------------------- | -------: | -------- | :--: |
| Live Rosin · Flat Top · Dab Rite IR · Std wall (4mm clear) |      520 | 500–525  |  ✓   |
| Cured Shatter · Flat Top · Dab Rite IR · Thin wall (2mm)   |      564 | 550–575  |  ✓   |
| Live Rosin · Flat Top · Terpometer Probe · Std             |      480 | 460–495  |  ✓   |
| Live Rosin · Blender slurper · Dab Rite IR · Std           |      510 | 505–540  |  ✓   |
| Live Resin · Flat Top · Dab Rite IR · Std                  |      550 | 525–560  |  ✓   |
| Live Rosin · Opaque Bottom (Opaque preset) · Std           |      518 | 510–540  |  ✓   |
| Live Rosin · Thermal banger · Dab Rite IR · Std            |      555 | 540–600  |  ✓   |
| Live Rosin · E-Banger PID · Std                            |      530 | 520–545  |  ✓   |
| Cold Cure · Terp Slurper · Dab Rite IR · Std               |      490 | 475–505  |  ✓   |

## File-level changes

### `bangers.json`
- **Removed:** `ir_offset_f`, `ir_offset_sign`
- **Added:** `gradient_lag_f` (signed °F, anchored at standard 3–4 mm wall)
- **Added:** `emissivity_bias_multiplier` (1.0 clear · 0.2 opaque w/ Dab Rite preset · 0 e-nail)
- All 14 form factors retained. Slurpers got `gradient_lag_f = 15` (not 5) to match empirical Dab Rite readings.
- Opaque bottom flagged with `HIGH_GRADIENT_LAG` tag — the air-pocket nucleation increases conduction lag rather than reducing it.

### `concentrates.json`
- **Added:** `fluid_target_optimal_f` and `fluid_target_range_f` for all 35 entries
- Derived as `surface_temp - 65 °F` (the phase-change load constant)
- Blocked entries (kief, RSO, hash holes, 1–2 star bubble) keep their `null` values
- All v1 fields preserved — contact-probe sensors still use `surface_temp_optimal_f` directly

### `sensors.json`
- **Added:** `emissivity_bias_f` per sensor
  - Probe (Terpometer V1): 0
  - IR (Dab Rite Pro v2.2 et al.): **15** (firmware ε=0.95 vs. quartz ε≈0.92)
  - E-nail PID: **50** (repurposed for coil-vs-surface midpoint, range 30–80 °F)
  - Visual: 0
- **Added:** `applies_gradient_lag` (boolean — only IR triggers the dT_Gradient term)
- **Added:** Dab Rite firmware emissivity values for transparency

### `wall_thicknesses.json`
- **Added:** `gradient_multiplier` per wall — scales `banger.gradient_lag_f`
  - Thin (~2 mm): **0.5**
  - Standard (3–4 mm): **1.0** (anchor)
  - Thick (5–6 mm): **1.6**
  - Derivation: Fourier τ = L²/α — τ_2mm/τ_3.5mm ≈ 0.33; capped at sensible bounds since banger values are means.
- Legacy `modifier_f` retained as a soft additive override.

### `schema.json`
- New `calibration_model` description
- New `model_breakdown` mapping each term to its data source
- New `migration_notes_v1_to_v2` explaining additions/removals
- New `calibration.constants` section with fused-silica thermophysical properties (k, ρ, Cp, α, ε, CTE) sourced from the research
- Six worked-example calibrations covering every sensor branch
- Three workflow notes: IR descent-dab, contact-vs-IR reconciliation, opaque-quartz preset behavior

### `quartzos.json` / `quartzos_min.json`
- Composite of all above
- Bumped `meta.version` to `2.0.0`, release date `2026-04-28`
- `$schema` URL updated to `reference-data-v2.json`
- Both pretty (66 KB) and minified (49 KB) versions written

## Sign-convention reconciliation note

v1 had `ir_offset_sign = -1` for buckets (display reads LOWER than interior) and v1 magnitudes (~35 °F) under-reported the empirical reality by 60–100 °F because they didn't account for emissivity bias.

v2's `gradient_lag_f` is **always positive for buckets** (interior is hotter than exterior during cooldown, so to hit a target interior temp the user must set the IR display HIGHER than that target). The `dT_emissivity` term then adds another +15 °F because the Dab Rite under-reports clear quartz radiation. Together these put bucket-class setpoints in the 500–570 °F range that empirical Reddit/420 VapeZone data confirms.

## What didn't change

- Concentrate `surface_temp_*` ranges (the probe-truth values were already correct)
- Banger `cooling.k_per_second` values (the Newton's-law cooling kinetics for the dab-window calculation are independent of the calibration rewrite)
- All torch reference data, enums, and visual cues
- The `dab_window.md` formula — it operates on `surface_temp` not displayed setpoints, so it's untouched

## How to integrate

If your code currently does:

```js
const displayed = concentrate.surface_temp_optimal_f
                + banger.ir_offset_sign * banger.ir_offset_f
                + wall.modifier_f;
```

…replace with:

```js
function computeIrSetpoint(banger, concentrate, sensor, wall, calibration) {
  if (sensor.method === 'contact') return concentrate.surface_temp_optimal_f + (wall.modifier_f ?? 0);
  if (sensor.method === 'enail')   return concentrate.surface_temp_optimal_f + sensor.emissivity_bias_f + (wall.modifier_f ?? 0);
  if (sensor.method === 'visual')  return concentrate.surface_temp_optimal_f + (wall.modifier_f ?? 0);

  // IR branch — the four-term equation
  const T_ideal     = concentrate.fluid_target_optimal_f;
  const dT_load     = calibration.constants.phase_change_load_f;
  const dT_gradient = banger.gradient_lag_f * (wall.gradient_multiplier ?? 1.0);
  const dT_emiss    = sensor.emissivity_bias_f * banger.emissivity_bias_multiplier;
  return T_ideal + dT_load + dT_gradient + dT_emiss + (wall.modifier_f ?? 0);
}
```

The contact-probe and visual branches return identical values to v1. The IR and e-nail branches now reflect the research-derived metrology.
