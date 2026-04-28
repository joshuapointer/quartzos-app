# Dab Window Determination — Technical Specification

## What it is

A closed-form formula that answers: **"Given a banger, concentrate, and wall thickness — how long 
after torch-off do I have to dab properly?"**

It returns three numbers a UI can use:
1. **Time to enter the window** — when surface temp first drops into the usable range
2. **Time at optimal** — when surface temp hits the concentrate's optimal value
3. **Total window duration** — how many seconds you have until the dab won't vaporize properly 
anymore

---

## The physics

A torched quartz banger cools by **Newton's Law of Cooling**: cooling rate is proportional to the 
temperature difference between the banger and ambient air.

$$\frac{dT}{dt} = -k(T - T_{amb})$$

Solving this differential equation gives surface temperature as a function of time after torch-off:

$$T(t) = T_{amb} + (T_0 - T_{amb}) \cdot e^{-kt}$$

Inverting for **time-to-reach-a-target-temperature**:

$$t(T) = \frac{1}{k} \cdot \ln\left(\frac{T_0 - T_{amb}}{T - T_{amb}}\right)$$

The **dab window duration** is the difference between time-to-leave and time-to-enter:

$$\boxed{\Delta t_{window} = \frac{1}{k_{eff}} \cdot \ln\left(\frac{T_{high} - T_{amb}}{T_{low} - 
T_{amb}}\right)}$$

---

## Variables

| Symbol | Meaning | Source |
|---|---|---|
| $T_{amb}$ | Ambient room temperature | Constant: **72°F** |
| $T_0$ | Surface temp at torch-off | Constant: **700°F** (just past faint glow) |
| $T_{high}$ | Top of concentrate's operable range | `concentrate.surface_temp_range_f[1]` |
| $T_{low}$ | Bottom of concentrate's operable range | `concentrate.surface_temp_range_f[0]` |
| $T_{opt}$ | Concentrate's optimal surface temp | `concentrate.surface_temp_optimal_f` |
| $k_{base}$ | Banger's cooling constant (1/sec) | `banger.cooling.k_per_second` |
| $m_{wall}$ | Wall thickness multiplier | 
`dab_window_formula.constants.wall_k_multipliers[wall_id]` |
| $k_{eff}$ | Effective cooling constant | $k_{base} \times m_{wall}$ |

---

## Calibration: where k comes from

$k$ isn't measured from physics first principles — it's **reverse-engineered from each banger's 
empirical `cooldown_seconds`** (community-observed time to fall from torch-off into usable range).

For each banger, given a community-reported cooldown range (e.g., flat top = 30–45s):

$$k = \frac{\ln\left(\frac{T_{torchOff} - T_{amb}}{T_{surfaceTop} - 
T_{amb}}\right)}{t_{cooldown}}$$

Computed at both ends of the range and averaged.

**Resulting k values per banger:**

| Banger | Cooldown (s) | k (1/sec) | τ = 1/k (sec) | Class |
|---|---|---|---|---|
| Flat Top | 30–45 | 0.00482 | 208 | moderate |
| Beveled Edge | 35–50 | 0.00515 | 194 | moderate |
| Opaque Bottom | 45–60 | 0.00490 | 204 | moderate |
| Thermal | 45–60 | 0.00337 | 297 | slow |
| Round Bottom | 30–50 | 0.00463 | 216 | moderate |
| Core Reactor | 45–60 | 0.00412 | 243 | moderate |
| Swing-Arm | 10–30 | 0.01156 | 86 | fast |
| Terp Slurper | 35–60 | 0.00480 | 208 | moderate |
| Blender / Vector | 30–45 | 0.00589 | 170 | moderate |
| Spinner | 45–60 | 0.00337 | 297 | slow |
| Control Tower | 30–45 | 0.00589 | 170 | moderate |
| Quave Charmer | 30–45 | 0.00589 | 170 | moderate |
| Quartz Insert | (host × 1.4) | 0.00675 | 148 | fast |
| E-Banger | (PID) | ∞ | ∞ | constant |

τ (the **time constant**) is the time for surface to fall to 37% of the initial delta-T above 
ambient. It's the cleanest single number for "how long does this banger hold heat."

---

## Wall thickness multipliers

Wall thickness changes thermal mass, which scales $k$. Heuristic multipliers:

| Wall | mm range | $m_{wall}$ |
|---|---|---|
| Thin | ~2 mm | 1.25 (cools 25% faster) |
| Standard | 3–4 mm | 1.00 (baseline) |
| Thick | 5–6 mm | 0.65 (cools 35% slower) |
| Unknown | — | 1.00 (default to standard) |

---

## Computation steps

```
INPUT: banger_id, concentrate_id, wall_thickness_id

1.  k_base ← banger.cooling.k_per_second
2.  m_wall ← wall_k_multipliers[wall_id]
3.  k_eff ← k_base × m_wall

4.  T_high ← min(concentrate.surface_temp_range_f[1], 699)
5.  T_low  ← concentrate.surface_temp_range_f[0]
6.  T_opt  ← concentrate.surface_temp_optimal_f

7.  T_opt_high ← min(T_opt + 15, T_high)        # tight ±15°F optimal band
8.  T_opt_low  ← max(T_opt - 15, T_low)

9.  Define t(T) = (1/k_eff) × ln((700 - 72) / (T - 72))

10. t_enter_window  ← t(T_high)
11. t_at_optimal    ← t(T_opt)
12. t_leave_window  ← t(T_low)

13. full_window     ← t_leave_window - t_enter_window
14. optimal_band    ← t(T_opt_low) - t(T_opt_high)

OUTPUT: { t_enter, t_optimal, t_leave, full_window, optimal_band }
```

---

## Worked example: Live Resin + Blender + Standard wall

**Inputs:**
- $k_{base}$ = 0.00589, $m_{wall}$ = 1.00 → $k_{eff}$ = 0.00589
- Concentrate range: 480–545°F, optimal 510°F
- Optimal band: 495–525°F (±15°F)

**Time to each milestone** (using $t(T) = \frac{1}{0.00589} \ln\left(\frac{628}{T-72}\right)$):

| $t$ | Surface | Event |
|---|---|---|
| 0.0s | 700°F | Torch off |
| 48.1s | 545°F | Enter usable window |
| 55.5s | 525°F | Enter optimal band |
| **61.2s** | **510°F** | **◀ DAB HERE** |
| 67.1s | 495°F | Leave optimal band |
| 73.2s | 480°F | Leave usable window |

**Window: 25.1 seconds total. Optimal band: 11.6 seconds.**

---

## Edge cases

| Case | Behavior |
|---|---|
| **E-banger / PID** | $k$ is null. Temp held constant — window is mathematically infinite. UI 
should show "∞" or "constant" rather than computing. |
| **Hard-blocked concentrate** (kief, RSO, hash holes) | `concentrate.blocked` present — return 
null, do not compute. |
| **Quartz insert** | Insert mass is small. $k$ derived as $1.4 \times$ flat-top $k$. Window ≈ 70% 
of host banger window. |
| **$T_{high}$ ≥ $T_0$** | Concentrate operable range extends above torch-off. Clamp $T_{high}$ to 
$T_0 - 1$ (you're already in window when torch is pulled). |
| **Cold start workflow** | Formula does NOT apply. Cold start is bounded by vapor production, not 
cooling. Skip the calculation entirely. |

---

## Window matrix (representative concentrates × bangers, standard wall, full operable range)

| Banger | Live Resin | Cold Cure | Live Rosin | THCa Diamonds | Temple Ball | Shatter |
|---|---:|---:|---:|---:|---:|---:|
| Flat Top | 31s | 76s | 38s | 44s | 64s | 31s |
| Beveled Edge | 29s | 72s | 36s | 41s | 60s | 29s |
| Opaque Bottom | 30s | 75s | 37s | 43s | 63s | 30s |
| Thermal | 44s | 109s | 54s | 62s | 91s | 44s |
| Round Bottom | 32s | 80s | 40s | 45s | 66s | 32s |
| Core Reactor | 36s | 89s | 44s | 51s | 75s | 36s |
| Swing-Arm | 13s | 32s | 16s | 18s | 27s | 13s |
| Terp Slurper | 31s | 77s | 38s | 44s | 64s | 31s |
| Blender / Vector | **25s** | 63s | 31s | 36s | 52s | 25s |
| Spinner | 44s | 109s | 54s | 62s | 91s | 44s |
| Control Tower | 25s | 63s | 31s | 36s | 52s | 25s |
| Quave Charmer | 25s | 63s | 31s | 36s | 52s | 25s |
| Quartz Insert | 22s | 55s | 27s | 31s | 46s | 22s |
| E-Banger | ∞ | ∞ | ∞ | ∞ | ∞ | ∞ |

Note how cold cure gives the longest windows across the board (wide 375–510°F operable range), and 
high-mass thermals/spinners give 50% longer windows than flat-tops.

---

## Wall thickness sensitivity (Live Resin + Flat Top)

| Wall | $k_{eff}$ | Enter | Leave | Window |
|---|---|---|---|---|
| Thin (2 mm) | 0.00602 | 47s | 72s | 25s |
| Standard (3-4 mm) | 0.00482 | 59s | 90s | 31s |
| Thick (5-6 mm) | 0.00313 | 91s | 138s | 47s |

Thick-walled bangers extend the window ~50% over thin-wall.

---

## Reference implementation

```javascript
function computeDabWindow(banger, concentrate, wall) {
  const T_AMB = 72;
  const T_TORCH_OFF = 700;
  const OPTIMAL_BAND = 15;

  // Edge cases
  if (concentrate.blocked) return null;
  if (banger.cooling.thermal_class === 'constant') {
    return { window_seconds: null, note: 'PID-controlled, constant temp' };
  }

  // Effective k
  const k_eff = banger.cooling.k_per_second * (wall.k_multiplier ?? 1.0);

  // Temperature targets (clamp T_high to below torch-off)
  const T_high = Math.min(concentrate.surface_temp_range_f[1], T_TORCH_OFF - 1);
  const T_low  = concentrate.surface_temp_range_f[0];
  const T_opt  = concentrate.surface_temp_optimal_f;
  const T_opt_high = Math.min(T_opt + OPTIMAL_BAND, T_high);
  const T_opt_low  = Math.max(T_opt - OPTIMAL_BAND, T_low);

  // Time-to-temp
  const t = (T) => (1 / k_eff) * Math.log((T_TORCH_OFF - T_AMB) / (T - T_AMB));

  return {
    k_effective: k_eff,
    t_enter_window_seconds:        Math.round(t(T_high) * 10) / 10,
    t_enter_optimal_band_seconds:  Math.round(t(T_opt_high) * 10) / 10,
    t_at_optimal_seconds:          Math.round(t(T_opt) * 10) / 10,
    t_leave_optimal_band_seconds:  Math.round(t(T_opt_low) * 10) / 10,
    t_leave_window_seconds:        Math.round(t(T_low) * 10) / 10,
    full_window_duration_seconds:    Math.round((t(T_low) - t(T_high)) * 10) / 10,
    optimal_band_duration_seconds:   Math.round((t(T_opt_low) - t(T_opt_high)) * 10) / 10,
  };
}
```

---

## Limitations

1. **Newton's law assumes linear convective cooling** — neglects radiation ($\sim T^4$) which is 
significant above ~600°F. Real cooling near torch-off is slightly faster than predicted. Below 
~500°F the approximation is excellent.
2. **k is calibrated against community-reported cooldown ranges** that vary ±30%. Treat absolute 
window seconds as **±20% accurate**. Good enough for UX, not lab-grade.
3. **Wall multipliers are heuristic**, not measured. For production accuracy, replace with 
per-banger empirical calibration via controlled IR logging.
4. **Ambient assumed 72°F.** Cold rooms (60°F) shorten window ~10%; hot rooms (85°F) lengthen ~15%. 
If the app knows ambient, plug it in.
5. **Carb cap effect not modeled.** Cap on banger reduces convective loss, **lengthening window 
20–40%** in practice. Formula returns the uncapped window (conservative).
6. **Cold-start workflow doesn't apply.** Cold start is vapor-rate-limited, not cooling-limited — 
different physics entirely.
