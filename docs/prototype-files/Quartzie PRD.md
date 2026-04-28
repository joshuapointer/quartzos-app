# Quartzie — Single Flow PRD

> **Companion mobile app for cannabis-concentrate enthusiasts ("terp-heads") that uses a connected DabRite IR thermometer to coach users through a perfectly-timed dab.**

| | |
|---|---|
| **Status** | MVP in development |
| **Owner** | TBD |
| **Audience** | Engineering — build spec |
| **Scope** | Single flow: connect → choose preset / build session → run session → complete |
| **Last updated** | 2026-04-27 |
| **Source of truth (data)** | `flow-data.jsx` (QuartzOS Reference Data v1.0.0) |
| **Source of truth (UI)** | `flow-app.jsx`, `flow-shell.jsx`, `flow-build.jsx` |

---

## Screenshot key

The PRD references screens by ID. Capture each at iPhone 15 Pro frame, dark canvas, full bleed.

| ID | Screen | How to reach it |
|---|---|---|
| **S-01** | Connect / device-not-found | Fresh load |
| **S-02** | Connect / scanning | Tap **Connect Dab Rite** |
| **S-03** | Choose — preset list + "New sesh" | Post-connect landing |
| **S-04** | Builder · Step 1 — Banger picker | Tap **New sesh** |
| **S-05** | Builder · Step 2 — Concentrate picker | Continue from S-04 |
| **S-06** | Builder · Step 2 — Blocked concentrate visible (e.g. RSO, Kief, 1–2 Star) | Scroll concentrate list |
| **S-07** | Builder · Step 3 — Wall thickness | Continue from S-05 |
| **S-08** | Builder · Step 4 — Review (calibration card + cold-start toggle ideal) | Continue from S-07 |
| **S-09** | Builder · Step 4 — Review with **HE Control Tower override** badge | Pick `Control Tower` + solventless |
| **S-10** | Session · Heat (torch countdown ring) | Start sesh |
| **S-11** | Session · Cool (orb shows live IR temp + drop-rate strip) | Wait through heat |
| **S-12** | Session · Cool — **DROPPING TOO FAST** warning | Trigger via underheated banger |
| **S-13** | Session · Heat — **REHEAT · MISSED WINDOW** state | Let cool phase elapse |
| **S-14** | Session · Dab phase (orb dimmed, "DABBING") | Lift to dab |
| **S-15** | Session · Dunk phase | Place back |
| **S-16** | Session · Clean phase | Auto-advance |
| **S-17** | Complete | End of session |

When inserting screenshots, place them inline at the section that names them, sized to phone aspect (≈9:19.5).

---

## 1. Problem & vision

### 1.1 The problem

Dabbing is the most flavor-sensitive way to consume cannabis concentrates, and also the most failure-prone. The interior surface temperature of the quartz banger at the moment the concentrate touches it determines whether the user gets:

- A clean, terpene-forward vapor (target window, typically 440–560°F surface depending on concentrate);
- A harsh, scorched hit (too hot — destroys monoterpenes, leaves carbon);
- A puddle that won't vaporize and leaves residue (too cold — wastes product, requires reheat).

The dab window is **30 seconds wide on a hot start**, and the banger's interior surface temperature is **not directly readable** by any consumer instrument. The DabRite Pro IR thermometer reads the underside of the banger, which differs from interior surface by **20–60°F** depending on banger geometry, wall thickness, and material (opaque vs clear quartz).

Today, even experienced terp-heads either:
1. **Eyeball it** (count seconds since torch-off, watch for color cues) — inconsistent.
2. **Run a DabRite manually** — better, but they have to memorize/calculate IR offsets per banger and per concentrate.
3. **Use static cheat-sheets** — out of date, don't account for cold-start vs hot-start, don't react to live cooldown.

### 1.2 The vision

Quartzie is a phone in your pocket that turns the DabRite from a dumb thermometer into an intelligent coach. It knows:

- **Your gear** — banger geometry, wall thickness, sensor.
- **Your concentrate** — every category from live rosin to THCa diamonds to temple ball, with anchor surface temps sourced from manufacturer specs and community-validated data (QuartzOS reference, 14 bangers × 38 concentrates).
- **The math** — `displayed = surface + (IR offset × sign) + wall modifier`, plus manufacturer overrides (e.g. HE Control Tower 450°F solventless / 550°F hydrocarbon).
- **The moment** — phase-aware coaching with live IR feedback, automatic reheat detection when cool rate exceeds 3°F/s, and miss-recovery when the user lifts late.

The goal isn't to replace the user's judgment — it's to remove every reason they'd ever take a bad dab.

### 1.3 What this PRD covers

**In scope (MVP single flow):**
- Device connection (BLE pairing with DabRite Pro)
- Preset library + custom session builder
- Live session: heat → cool → dab → dunk → clean
- Calibration math, manufacturer overrides, cold-start fork
- Reheat / missed-window recovery

**Out of scope (later milestones, not in this PRD):**
- Multi-device users / accounts / cloud sync
- Social, sharing, reviews
- Strain / brand / lineage tracking
- Wear OS / Apple Watch surfaces
- Sensor types other than DabRite IR (contact probe, e-nail PID)
- Hardware design of the DabRite itself

---

## 2. Target users & personas

### 2.1 Primary: "The Connoisseur" (Marcus, 32)

- 4+ years of dabbing, owns 3–6 bangers across geometries (flat top, terp slurper, opaque).
- Buys exclusively top-shelf solventless ($80+/g rosin). Cares about flavor first, intensity second.
- Already owns a DabRite or comparable IR. Uses Reddit, Hashwriter, 710 Labs anchors as reference.
- Pain: every concentrate has its own ideal temp; he's manually calibrating per session.
- **Win condition:** Quartzie feels like the cheat sheet he was building in his head.

### 2.2 Secondary: "The Upgrader" (Jess, 26)

- 1–2 years of dabbing, just bought their first IR. Was previously eyeballing.
- Owns one banger (a flat top), tries 2–3 concentrate types weekly.
- Pain: knows IR is supposed to be more accurate, but the readout doesn't match what they read online.
- **Win condition:** Quartzie explains *why* the numbers differ and picks the right one.

### 2.3 Tertiary: "The Curious" (Ron, 48)

- Medical patient, returning to concentrates. Owns a DabRite and a generic banger.
- Wants the lowest, gentlest temp possible. Doesn't care about the gear-head details.
- **Win condition:** Quartzie picks "low and slow" defaults and gets out of the way.

### 2.4 Anti-persona

We are not building for combustion-curious vapers, edibles users, or smokers. The product assumes the user has and wants to use a dab rig and an IR thermometer.

---

## 3. Goals & non-goals

### 3.1 Goals (MVP)

1. **Pair with a DabRite Pro over BLE in <10 seconds**, with no menu-diving.
2. **Cover ≥95% of typical inventory** — 14 banger SKU shapes, 38 concentrate categories.
3. **Compute displayed-temp targets within ±10°F** of the QuartzOS reference for every supported (banger, concentrate, wall) tuple.
4. **Coach a full session end-to-end** without the user having to read more than one sentence per phase.
5. **Auto-detect under-heat** and route the user into a half-time reheat — *before* they take a bad dab.
6. **Block concentrates that shouldn't be dabbed** (RSO, kief, 1–2 star bubble, hash holes) with explanatory copy.

### 3.2 Non-goals (MVP)

- ❌ Manual override of calibration math. The math is the product.
- ❌ Custom preset creation in this milestone — only built-in `SAVED_PRESETS`. (Save-on-the-way-out from a custom session is M2.)
- ❌ Logging / history / trends. Sessions evaporate when complete.
- ❌ Multi-rig switching mid-session.
- ❌ Photo capture / sharing.
- ❌ Strain database integration.

### 3.3 Explicit constraints

- **Single sensor support: DabRite Pro IR.** All math assumes IR; e-nail and contact-probe branches are stubbed in `computeCalibration` but disabled.
- **Imperial only (°F)** in MVP. Metric via Tweaks panel later.
- **Phone form factor only.** No tablet, no wearable.
- **Light-sensitive context.** UI is dark by default — users dab at night, rooms are dim.

---

## 4. User journeys

### 4.1 Journey A — Returning user, saved preset

> Marcus is loading a flat top with live resin. He opens Quartzie, hits "Quartz Recommended," torches when prompted, places back, lifts at the orb's cue, dabs. 90 seconds total. No reading required.

**Steps:**
1. App opens to **Connect (S-01)**. DabRite is on → app finds it in <2s → **Choose (S-03)**.
2. Marcus taps "Quartz Recommended" preset.
3. **Heat (S-10)**: torch ring counts down 30s. He torches, the ring drains.
4. **Cool (S-11)**: orb shows live IR descending toward 535°. When the orb shows "IN WINDOW · LIFT TO DAB", he lifts.
5. **Dab (S-14)**: orb dims, "DABBING". He drops the dab, caps, inhales.
6. **Dunk (S-15)**: he q-tips. **Clean (S-16)**: short prompt. **Complete (S-17)**: 95s elapsed.

### 4.2 Journey B — New user, custom build

> Jess just unboxed a Highly Educated Control Tower. They open Quartzie, tap **New sesh**, walk through banger → concentrate → wall → review.

**Steps:**
1. **Connect (S-01) → Choose (S-03)** with no saved presets selected.
2. Tap **New sesh** → **Builder Step 1 (S-04)**. Filter to "Slurper", select **Control Tower**.
3. **Step 2 (S-05)**: filter to Solventless, select Live Rosin.
4. **Step 3 (S-07)**: leave on Standard wall (default).
5. **Step 4 (S-09)**: review card shows **★ HE Control Tower override = 450°F solventless** badge. Cold-start toggle reads **IDEAL**, prefilled on. Formula: `450° (surface) + 20° (slurper IR) + 0° (wall) = 470°`.
6. Start sesh → enters live session as in Journey A.

### 4.3 Journey C — Underheated banger, auto-reheat

> Ron rushes the torch. The banger doesn't soak the heat. The IR sees a fast drop.

**Steps:**
1. He short-torches (real-world < min heat duration).
2. **Cool (S-11)** starts. Drop rate exceeds 3°F/s for 3 consecutive samples.
3. App routes to **Heat (S-13)** with eyebrow `REHEAT · HALF TIME`, copy: *"IR saw a fast drop — banger didn't soak the heat. Half-time torch to bring it back up."*
4. Torch ring is half the original duration.
5. Continues to cool → window → dab.

### 4.4 Journey D — Missed window

> Marcus is mid-conversation. The banger cools below the window before he lifts.

**Steps:**
1. **Cool (S-11)**: temp falls below `low - 5°F`.
2. App routes to **Heat (S-13)** with eyebrow `REHEAT · MISSED WINDOW`, copy: *"Temp fell below the dab window before you lifted. Half-time torch this round."*

### 4.5 Journey E — Blocked concentrate

> A user filters to Hash and taps "Kief / Static" in the builder.

**Steps:**
1. Card is rendered disabled with `BLOCKED` badge.
2. Italic explanatory line: *"Kief is too dusty for direct dabs and will combust unevenly. Press it to rosin first, or use as bowl topper."*
3. Continue button stays disabled until a non-blocked concentrate is chosen.

---

## 5. Feature specs

### 5.1 Connect (S-01, S-02)

**Purpose:** Pair to a DabRite Pro over BLE, hold the user there until paired.

**Behavior:**
- Idle state shows wordmark, placeholder orb (state `idle`, 200pt), `DEVICE NOT FOUND` eyebrow, headline "Connect your *Dab Rite* to begin."
- A status pill below: dot + `AWAITING DEVICE`.
- Primary button: **Connect Dab Rite**.
- On tap → searching state for ~1.4s (mock; real BLE handler in Section 8) → on success, app advances to **Choose**. Pill animates dot color + `SCANNING…` while searching.

**Hard rule:** No advance without a connected device. Footer mono: `NO ADVANCE WITHOUT A DEVICE`.

**Reference:** `ConnectStage` in `flow-shell.jsx`.

### 5.2 Choose (S-03)

**Purpose:** Pick a preset OR launch the custom builder.

**Layout:**
- Wordmark top-left, connection dot top-right.
- Persistent orb at `STANDBY` (160pt).
- Eyebrow `READY`, headline "Start a *sesh.*"
- Top card: **New sesh** (custom builder entry, equal visual weight).
- Divider hairline labeled `SAVED`.
- List of `SAVED_PRESETS` cards, each rendering live calibration via `computeCalibration` so DAB / DUNK pills always reflect current data.

**Built-in presets (MVP):** see `SAVED_PRESETS` in `flow-data.jsx` — 8 presets covering quartz default, opaque IR-friendly, 710 Labs solventless, cold-cure low & slow, hash coin cold-start, slurper sauce, temple ball, THCa diamonds.

**Reference:** `ChooseStage`, `PresetRow` in `flow-shell.jsx`.

### 5.3 Builder (S-04 → S-08)

Four-step linear flow. Sensor is fixed (DabRite IR) so it has no step.

| Step | Title | Required to advance |
|---|---|---|
| 1 | Pick your vessel. | `bangerId` set |
| 2 | What are you dabbing? | `concId` set, `concentrate.blocked == null` |
| 3 | Wall thickness? | `wallId` set (defaults `standard`) |
| 4 | Calibration locked. | always advanceable |

**Progress strip:** 4 hairline pills above the step title, current pill glows with brand `oklch(0.55 0.10 55)`.

#### 5.3.1 Banger picker (S-04)

- Filter chips: **All**, **Classic**, **Slurper**, **Specialty**, **Premium**.
- Cards show banger name, description, and a right-edge mono badge:
  - Bucket-class: `−<offset>°` (subtractive IR offset, e.g. `−35°`).
  - Slurper-class: `+<offset>°` (additive IR offset, colored cyan).
  - Insert: `INSERT`.
- Active card has elevated background and brand-tinted ring.

**Data shape:** see `BANGERS` array, 14 entries, each with `geometry`, `surface_range`, `ir_offset_f`, `ir_offset_sign`, `cold_start`, `heat_seconds`, `cool_seconds`, `pattern`, `zones`, `mfr_targets?`.

#### 5.3.2 Concentrate picker (S-05, S-06)

- Filter chips: **All**, **Solventless**, **Hash**, **Hydrocarbon**, **Distillate**, **Novel**.
- Cards show name, description, and right-edge `<surface_optimal>°F`.
- **Blocked items** (kief, RSO, 1–2 star, hash holes) render disabled with red-tinted ring, `BLOCKED` badge, italic `blocked` reason instead of description.
- Items with `warning` (e.g. "Will leave significant residue") show the warning in amber instead of the description.

**Data shape:** `CONCENTRATES`, 38 entries (4 blocked).

#### 5.3.3 Wall picker (S-07)

- 4 cards (`thin`, `standard`, `thick`, `unknown`).
- Each card shows `name · thickness`, `±mod°F adjustment · description`.
- Defaults to `standard` (mod 0).

#### 5.3.4 Review + cold-start toggle (S-08, S-09)

- **Calibration card** (top):
  - Eyebrow: `CALIBRATION · IR BRANCH`, brand color.
  - Three values in a row: `Display: <displayed>°` (large, brand color), `Surface: <surface>°`, right-aligned `<low>–<high>` window.
  - Hairline divider.
  - Mono formula: `<surface>° (surface) ± <ir>° (<geometry>-class IR) ± <wall>° (wall) = <displayed>°`.
  - **MFR override note (S-09)** if `banger.mfr_targets` matched: amber pill `★ Override: HE Control Tower spec for solventless = 450°F.`
- **Setup summary** (8-line grid):
  - `Banger`, `Hash`, `Sensor`, `Wall`, `IR aim`, `Heat` (`heat_time · pattern`), `Cooldown`, `Cue` (`visual_cue`).
- **Concentrate notes** card (if `notes.length > 0`): list with brand-color tick bullets, eyebrow shows `NOTES · <confidence>` (e.g. `NOTES · BRAND+COMMUNITY`).
- **Warning** (if `concentrate.warning`): amber strip.
- **Cold-start toggle** card:
  - Heading: `Cold start` + badge per `coldStartFit(concentrate, banger)`:
    - `IDEAL` (cyan) → "Both banger and concentrate are cold-start ideal. Strongly recommended for terpene preservation."
    - `RECOMMENDED` → "Concentrate prefers cold-start. Banger supports it."
    - `OPTIONAL` → "Available, but hot-start is the typical workflow for this combination."
    - `NOT AVAILABLE` (red) → "<Banger> is not cold-start compatible. Hot-start required." Toggle disabled.
  - Toggle on cold-start fork swaps phase track from `[heat, cool, dab, dunk, clean]` → `[load, heat, dab, dunk, clean]`. (The `load` phase UI is in the cold-start spec — see §5.6.)

**Reference:** `BuildStage`, `BangerChooser`, `ConcChooser`, `WallChooser`, `ReviewStep`, `ColdStartToggle` in `flow-build.jsx`.

### 5.4 Session — phase-aware shell

**Phase tracks:**
- Hot start: `heat → cool → dab → dunk → clean` (5 phases).
- Cold start: `load → heat → dab → dunk → clean` (5 phases).

**Persistent orb:** lives at top of the screen across all stages. Size, label, and contents morph per phase. Transition: `transform 700ms cubic-bezier(.22,1,.36,1)`.

**Eyebrow line in body content:** `<PHASE>[ · REHEAT] · <m:ss elapsed>`.

**Headlines (hot-start):**

| Phase | Headline | Sub copy |
|---|---|---|
| heat | "Torch the banger." | `<Banger.name> · target <heat_time>. Torch off when timer ends.` |
| cool | "Place back on the DabRite." | `Cooling toward <displayed>°. Lift the banger when the orb says LIFT TO DAB.` |
| dab | "Dab now." | `Apply the concentrate. Tap done when the banger comes back to the DabRite.` |
| dunk | "Dunk the q-tip." | `Cool enough to dunk and pull cap.` |
| clean | "Swab the residue." | `Q-tip the inside before the puddle hardens.` |

**Reheat headline overrides** (when `heatTimeFactor < 1`):
- `heatReason === 'missed'` → "Window slipped. Reheat." / "Temp fell below the dab window before you lifted. Half-time torch this round."
- `heatReason === 'underheated'` → "Underheated. Top it off." / "IR saw a fast drop — banger didn't soak the heat. Half-time torch to bring it back up."

**Reference:** `SessionStage`, `computeOrbProps`, `PersistentOrb` in `flow-shell.jsx`.

### 5.5 Session — Heat phase (S-10, S-13)

**Visual:** persistent orb replaces the IR dial with a torch countdown ring (290pt, custom SVG).

- Track: 6px stroke, dim ring color.
- Progress: brand-amber gradient, sweeps clockwise as time elapses (`stroke-dashoffset` linear 200ms).
- Center: 96pt italic serif numeral = seconds remaining; mono `SECONDS · <total>s TOTAL` underneath.
- **Reheat variant (S-13):** ring uses red gradient (`oklch(0.78 0.18 25)` → `oklch(0.55 0.18 18)`); eyebrow flips per reason.

**Timer:** `phaseDur = avg(banger.heat_seconds) × 1000 × heatTimeFactor`. Auto-advance to **cool** when progress ≥ 1 (with 200ms easing).

**No user action required** — purely time-driven. Banger is in the user's torching hand, not on the IR.

### 5.6 Session — Cool phase (S-11, S-12)

**Visual:** persistent orb is the standard `TempDial` showing live IR temperature (`coolTemp`).

**Cool curve simulation (MVP, mock until BLE wires up):**
- Peak = `target + 80°` at phase entry.
- Decay rate: `2.0°F/s` if `heatTimeFactor >= 1`, else `3.5°F/s`.
- Sampled every 1000ms, exposed as `coolTemp` and `coolDropRate`.

**Drop-rate strip** (below sub copy):
- Layout: mono pill, eyebrow `COOL RATE` left, value right (e.g. `2.0°/s · ideal 2°/s`).
- **`DROPPING TOO FAST` variant (S-12)** when `coolDropRate > 3°F/s`: red ring + amber-red text.

**Reheat triggers (auto-route to heat phase):**
1. `coolDropRate > 3°F/s` for **3 consecutive samples** (3s of fast drop) → `heatReason = 'underheated'`, `heatTimeFactor = 0.5`.
2. `coolTemp < (target_low - 5°F)` → `heatReason = 'missed'`, `heatTimeFactor = 0.5`.

**Cool does NOT auto-advance.** When the orb enters the window (`low ≤ coolTemp ≤ high`), label flips to `IN WINDOW · LIFT TO DAB`. The user must tap **Lift to dab →**.

**Action button:** primary, full-width, `Lift to dab →`. On tap → `phaseIdx = phaseTrack.indexOf('dab')`, progress reset.

### 5.7 Session — Dab phase (S-14)

**Visual:** orb dims to 240pt, label `DABBING`, `noReading: true` (no temp shown). Banger is off the DabRite — sensor sees ambient.

**Action button:** `Place back on DabRite →` → advances to **dunk**.

**No timer.** This phase is open-ended.

### 5.8 Session — Dunk phase (S-15)

**Visual:** orb shows simulated falling temp from target → dunk target (`displayed - 280°F`), label `DUNK READY`.

**Timer:** 4500ms, auto-advances to **clean**.

### 5.9 Session — Clean phase (S-16)

**Visual:** orb shrinks to 170pt, label `CLEAN UP`, temp simulated drifting from dunk target → ambient (78°F floor).

**Timer:** 5000ms, auto-advances to **complete**.

### 5.10 Complete (S-17)

**Visual:** orb at 150pt, label `COMPLETE`. Body: eyebrow `COMPLETE`, headline "Sesh logged." (note: not actually logged — see non-goals), elapsed time in `m:ss`. Single button **New sesh** → returns to Choose.

### 5.11 Disconnect

A `disconnect` button lives top-right whenever connected. Tapping it returns to **Connect** stage and clears all session state.

---

## 6. Data model / schema

All reference data is bundled at build time from `flow-data.jsx` (sourced from `uploads/quartzos.min.json`, schema `https://quartzos.app/schemas/reference-data-v1.json`, version 1.0.0).

### 6.1 `Banger` (14 entries)

```ts
type Banger = {
  id: string;                    // 'flat-top', 'terp-slurper', 'opaque', etc.
  name: string;
  category: 'classic' | 'slurper' | 'specialty' | 'premium';
  geometry: 'bucket' | 'slurper' | 'insert';
  description: string;
  surface_range: [number, number];     // °F, interior surface
  ir_offset_f: number;                 // °F
  ir_offset_sign: -1 | 1;              // bucket negative, slurper positive
  ir_aim: string;                      // free text instructions
  heat_time: string;                   // human-readable "20–40s"
  heat_seconds: [number, number];      // numeric range
  cool_seconds: [number, number];
  pattern: 'circular_sweep' | 'circular_sweep_outer_only' |
           'circular_sweep_floor' | 'sequenced' | 'simultaneous_sweep';
  heat_breakdown?: { stage: string; seconds: number; note: string }[];
  zones: { anatomy: string; pct: number }[];
  torch_distance: string;
  visual_cue: string;
  cold_start: 'YES' | 'NO' | 'OPTIONAL';
  tags: string[];
  mfr_targets?: { solventless?: number; hydrocarbon?: number };  // override hook
  mfrs: string[];
};
```

### 6.2 `Concentrate` (38 entries, 4 blocked)

```ts
type Concentrate = {
  id: string;
  name: string;
  cat: 'Solventless' | 'Hash' | 'Hydrocarbon' | 'Distillate' | 'Novel';
  description: string;
  surface_range: [number, number] | null;     // null = blocked
  surface_optimal: number | null;
  terps: 'high' | 'med' | 'low' | 'none';
  cold_start_good: boolean;
  notes?: string[];
  warning?: string;                            // soft yellow strip, still selectable
  blocked?: string;                            // hard red strip, NOT selectable
  confidence: 'BRAND' | 'BRAND+COMMUNITY' |
              'BRAND+MFR' | 'COMMUNITY' |
              'MFR+BRAND+COMMUNITY' | 'BRAND+MFR' |
              'SCIENCE+BRAND' | 'SCIENCE+ANECDOTAL' |
              'ANECDOTAL' | 'N/A';
  tags: string[];
};
```

### 6.3 `Sensor`

Single entry in MVP:

```ts
type Sensor = {
  id: 'ir';
  name: 'DabRite IR';
  short: string;
  method: 'ir';
  description: string;
  calibration: string;
};
```

### 6.4 `Wall`

```ts
type Wall = {
  id: 'thin' | 'standard' | 'thick' | 'unknown';
  name: string;
  thickness: string;
  mod: number;            // °F adjustment to displayed temp
  description: string;
};
```

### 6.5 `SavedPreset`

```ts
type SavedPreset = {
  id: string;
  name: string;
  kind: 'quartz' | 'opaque' | 'low' | 'custom';
  banger: string;            // FK → Banger.id
  concentrate: string;       // FK → Concentrate.id
  sensor: 'ir';
  wall: string;              // FK → Wall.id
  builtin: boolean;
  desc: string;
};
```

### 6.6 `Session` (in-memory only, MVP)

```ts
type Session = {
  startedAt: number;          // epoch ms
  presetId: string | null;
  bangerId: string;
  concId: string;
  sensorId: 'ir';
  wallId: string;
  coldStart: boolean;
  phaseTrack: string[];
  phaseIdx: number;
  phaseProgress: number;       // 0..1
  heatTimeFactor: number;      // 1 = fresh, 0.5 = reheat
  heatReason: 'normal' | 'missed' | 'underheated';
  windowState: 'waiting' | 'dabbing' | 'missed';
  windowSecondsLeft: number;
  sessionSeconds: number;
  coolTemp: number;
  coolDropRate: number;
};
```

### 6.7 Calibration math

```
displayed = surface
          + (banger.ir_offset_sign × banger.ir_offset_f)
          + wall.mod
```

With manufacturer override:
```
if banger.mfr_targets exists:
  if concentrate.cat in ('Solventless', 'Hash') and mfr_targets.solventless:
    surface = mfr_targets.solventless
  elif mfr_targets.hydrocarbon:
    surface = mfr_targets.hydrocarbon
```

Window: `[displayed - 15, displayed + 15]`.
Dunk target: `displayed - 280°F`.

**Reference impl:** `computeCalibration` in `flow-data.jsx`.

---

## 7. Hardware integration (BLE / IoT)

### 7.1 Supported device

**DabRite Pro** (the second-generation IR thermometer with BLE). Single SKU in MVP. Future expansion noted in non-goals.

### 7.2 Pairing

- App scans for advertised service UUID (TBD — DabRite spec TBC by hardware lead).
- Auto-pair on first match (single-device assumption).
- Show paired-device name in disconnect button area: `disconnect <name>`.
- Reconnect on app foreground if previously paired.

### 7.3 Data stream

Expected packets from DabRite (TBC):
- Temp reading (°F or °C, configurable)
- Sensor preset (Quartz / Opaque Quartz / Banger / etc.)
- Battery level
- Distance / aim quality (if available)

App-side polling: ≥ 4 Hz during cool/dab/dunk phases. Lower during heat (banger off-sensor).

### 7.4 Sensor preset switching

When user picks a banger with `id === 'opaque'`, the app must prompt the DabRite to switch its onboard emissivity preset to **Opaque Quartz** (TBC — depends on whether DabRite exposes that over BLE). If not exposable, show a one-time tip:

> "Switch your DabRite to **Opaque Quartz** preset for this banger. (Settings → Preset → Opaque Quartz)"

### 7.5 Calibration math vs sensor reading

The DabRite already produces a temperature reading. Quartzie does **not** correct that reading — it computes the **target displayed temp** that the user should see on the DabRite when the interior surface is at the optimal temp. The DabRite's number is ground truth for the orb; Quartzie's job is to tell the user what number to lift on.

### 7.6 Failure modes

| Mode | Behavior |
|---|---|
| BLE not granted | Show OS permission prompt; if denied, route to a dead-end with help link. |
| Device disappears mid-session | Pause the active phase, show reconnect banner over orb, resume on reconnect. |
| Stale packet (>3s no read) | Orb shows last value dimmed + `STALE` badge. |
| Battery <10% | Yellow chip in disconnect area. |

---

## 8. Technical architecture

### 8.1 Stack (current MVP prototype)

- **React 18 (UMD via unpkg)** for component model.
- **Babel standalone** for inline JSX (prototype only; production should pre-bundle).
- **No state library.** All state in the top-level `App` component (`flow-app.jsx`).
- **No router.** Stage transitions are state-driven (`stage` enum).
- **Vanilla CSS** with design tokens in `styles.css` (custom property tree under `:root`).

### 8.2 Module boundaries

| File | Responsibility |
|---|---|
| `flow-data.jsx` | Reference data (BANGERS, CONCENTRATES, SENSORS, WALLS, SAVED_PRESETS) + `computeCalibration` + `coldStartFit`. **Pure data + functions.** No React. |
| `flow-app.jsx` | Top-level `App`, all state, all phase timers, all transitions. |
| `flow-shell.jsx` | Stage shell, persistent orb, Connect / Choose / Session / Complete stages. |
| `flow-build.jsx` | Builder steps + chooser components. |
| `Dial.jsx` | `TempDial` IR readout component. |
| `Chrome.jsx` | `QPhone`, `QWordmark`, `TempPill`, `PresetGlyph`. |
| `Screens.jsx` | Legacy screens (kept for reference; not part of single flow). |
| `tweaks-panel.jsx` | Tweaks panel scaffold (deferred — not used in flow MVP). |

### 8.3 Phase state machine (production target)

For production, lift this out of timer-soup `useEffect`s into an explicit FSM (XState or hand-rolled reducer). Current MVP impl is correct but has nested timer cleanup risk. Acceptance criteria:

- States: `idle`, `connect.searching`, `connect.connected`, `choose`, `build.<step>`, `session.<phase>`, `complete`.
- Events: `CONNECT_PRESSED`, `DEVICE_FOUND`, `PRESET_PICKED`, `BUILDER_NEXT`, `BUILDER_BACK`, `PHASE_TICK`, `LIFT_TO_DAB`, `PLACE_BACK`, `COOL_FAST_DROP`, `COOL_MISSED_WINDOW`, `RESET`, `DISCONNECT`.
- Side effects (timers, BLE polling) wired as actors, not setIntervals inside effects.

### 8.4 BLE layer

Native module(s) bridging to:
- **iOS** — CoreBluetooth.
- **Android** — `BluetoothLeScanner` / `BluetoothGatt`.

If we pick React Native: `react-native-ble-plx`. If native: in-house wrapper. **Decision deferred** to platform pick (see Open Questions §11).

### 8.5 Performance budgets

- Cold start to **Connect** screen: ≤ 1.5s on iPhone 13.
- Pair to first DabRite reading: ≤ 5s steady-state, ≤ 10s 95th percentile.
- Frame rate during phase transitions: 60fps locked. The orb morph is the hottest animation; SVG transform/opacity only.
- Memory: ≤ 80 MB resident at session peak.

### 8.6 Telemetry (later milestone, listed for design)

Events to capture (no-op stubs in MVP):
- `connect_attempted`, `connect_succeeded`, `connect_failed`
- `preset_started`, `custom_started`
- `phase_entered`, `phase_completed`, `phase_aborted`
- `reheat_triggered` (with `reason`)
- `window_missed`
- `session_completed` (with elapsed)

PII: none. No user account in MVP.

---

## 9. Onboarding & first-run experience

**Principle:** the dabber is impatient and probably already torch-in-hand. Onboarding has to be invisible.

**First-run sequence:**

1. **Splash** — wordmark only, 600ms.
2. **BLE permission** — OS prompt, no pre-prompt.
3. **Connect (S-01)** — same screen as returning users. No tutorial overlay. The empty orb + "Connect your Dab Rite" copy is the tutorial.
4. **First post-connect** — instead of preset list, show a one-line tip atop the Choose screen:

   > *"Pick a saved sesh, or build your own. We'll handle the math."*

   Dismiss on first interaction; never shown again.

5. **First session** — when entering Heat phase for the first time, dim everything else and pulse the torch ring once. No copy.

**No accounts. No email gate. No tutorial video. No "skip" button — because there's nothing to skip.**

---

## 10. Edge cases & error states

### 10.1 Connection

| Case | Handling |
|---|---|
| BLE disabled at OS level | Show "Turn on Bluetooth to continue" + system-settings deeplink. |
| DabRite not advertising (off / sleeping) | Spinner runs 30s then collapses to "Couldn't find a DabRite. Power it on and try again." |
| Multiple DabRites in range | Pick strongest RSSI, show "Connecting to Dab Rite (XXX)" with a "wrong device?" link that lists all. |
| Pair succeeds but no reading after 8s | "We connected but aren't getting a reading. Move closer to the device." |

### 10.2 Builder

| Case | Handling |
|---|---|
| User picks blocked concentrate | Already disabled; can't be picked. |
| User picks `concentrate.warning` (e.g. pressed hash) | Selectable, warning surfaces in review. Continue still works. |
| Cold-start `BANGER_BLOCKS` (e.g. swing-arm) | Toggle is disabled and shaded; copy explains. |
| `mfr_targets` override applied | Amber `★ Override` note surfaces in review. |

### 10.3 Session

| Case | Handling |
|---|---|
| Heat ends, user hasn't placed back on IR within 8s | Orb shows ambient, label flips to `WAITING FOR BANGER`. No auto-advance. |
| Cool drop rate >3°F/s for 3 samples | Auto-route to reheat (half time). |
| Cool drops below `low - 5°F` | Auto-route to reheat (missed window). |
| User taps Lift to dab while still above window | Allowed. We don't override their judgment. Orb shows `EARLY LIFT` for 1s as a hint. *(Not in current code — recommended addition.)* |
| User abandons mid-phase (kills app) | Session evaporates. No persistence. |
| BLE drops during cool | Pause cool simulation, show reconnect banner, resume on packet. |
| DabRite battery <5% | Yellow banner: "DabRite battery low — readings may drift." |

### 10.4 Calibration math edge cases

| Case | Handling |
|---|---|
| Insert + cold-start | `computeCalibration` falls through to IR branch with insert offsets. Documented in `BANGERS[id='insert']`. |
| Wall = `unknown` | `mod = 0`. Treat as standard. |
| Concentrate has `surface_optimal: null` | Already gated by `blocked` → cannot reach review. |

---

## 11. Open questions & risks

### 11.1 Open questions

1. **DabRite BLE protocol.** Do we have a published spec, a sniffed protocol, or does Quartzie need an LOI with Dab Rite Inc.? Blocks Section 7 implementation.
2. **Sensor preset switching.** Can we change DabRite's emissivity preset over BLE, or do we have to fall back to user instructions?
3. **Platform pick.** React Native (faster shipping, single codebase) vs native iOS/Android (better BLE story, polish ceiling). Lean RN for MVP unless BLE blockers emerge.
4. **Custom preset save.** When does it ship? Currently slated post-MVP, but if early users complete a custom session and want to re-run it, we'll know fast.
5. **Imperial / metric.** Does QuartzOS data have °C equivalents, or do we convert at render time?
6. **Reference data versioning.** `flow-data.jsx` is bundled in MVP. As anchor research evolves (new bangers, updated mfr specs), do we OTA the JSON or ship app updates?
7. **Compliance / legal.** App-store rules around cannabis-adjacent apps (Apple is famously strict). Need legal review before TestFlight.
8. **Tweaks panel.** Stub exists but is unused in flow MVP. Decision: ship without, or surface temp unit + formula toggle as the only two MVP knobs?

### 11.2 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| App Store rejection on cannabis grounds | High | Position as "thermometer companion / coaching tool"; reference Storz & Bickel, Puffco companion apps as precedent; have legal review before submission. |
| BLE flakiness damages session feel | High | Production FSM (§8.3); aggressive reconnect; offline-tolerant orb states. |
| Reference data ages out (new gear, new concentrates) | Medium | OTA reference JSON via signed bundle on app open. |
| User expects logging / history | Medium | Add a clear "no logging in MVP" note on Complete screen; gather demand signal. |
| Custom session is too long for first-time user | Medium | New sesh has 4 steps; review screen does heavy lifting. Watch funnel. |
| IR offset math wrong for an edge banger | Low | Reference data is auditable; flag confidence levels in source (`MFR+BRAND+COMMUNITY` etc). |
| User torches with phone in same hand | Low — physical | Orb auto-grows during heat to be readable from arm's length; dim mode. |

### 11.3 Out-of-scope reminders (not risks, just clarity)

- No social / sharing
- No accounts / cloud
- No multi-rig
- No e-nail / contact-probe sensors
- No Apple Watch / Wear OS

---

## 12. Appendix — File map for engineers

```
Quartzie-Flow-src.html      Entry; mounts <window.QFlowApp />
styles.css                  Design tokens + global styles
flow-data.jsx               Reference data + math (PURE)
flow-app.jsx                Top-level App + state machine
flow-shell.jsx              Stage shell + persistent orb + Connect/Choose/Session/Complete
flow-build.jsx              Builder + choosers + Review
Dial.jsx                    TempDial IR readout
Chrome.jsx                  QPhone bezel, wordmark, pills, glyphs
tweaks-panel.jsx            (deferred)
```

**Ground rule for refactors:** `flow-data.jsx` stays React-free. All UI must consume it through the typed surface in §6, never reach into nested fields opportunistically.
