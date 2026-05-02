# OLED · White-Hot Neon Edge — Design Spec

**Date:** 2026-05-02
**Branch target:** `develop` (or feature branch)
**Status:** Draft for review

---

## 1. Intent

Replace the current "warm obsidian" palette (warm-brown surfaces, ember-orange brand accent) with an **OLED black + neon edge** language. Background is true black. Components separate from the void via 1px luminous strokes plus outer glow rather than warm-brown gradient fills. The brand's heat semantic is no longer carried by orange — it is carried by **white intensity** (white glow). The cool / dunk semantic continues to be carried by **quartz cyan** (`#00a8ff` / `#95ccff`).

### Why
The user requested "OLED with a black background and component styling that pops on a black background." Selected direction: **Neon Edge**, with **White-Hot** as the replacement for orange. This collapses the duotone to white + cyan, which is more disciplined, reads as a true OLED demo unit, and uses the device's literal physics (heat → glow brightness) as the visual metaphor.

### Non-goals
- Not changing typography, spacing, motion timing, or component layout.
- Not adding new screens, features, or interactions.
- Not removing the cool/dunk quartz cyan accent.
- Not introducing dark/light theme support — this is a palette swap, not a theming system.

---

## 2. Body Language Rules

These are the rules every component must follow after the change.

1. **Black means black.** Every surface that is currently `voidObsidian` / `bgDeep` / `surface1` becomes `#000000`. No warm tint, no near-black browns.
2. **Edges are how things exist.** A surface is identified by its 1px stroke, not by a fill brighter than its parent. Default stroke is `rgba(255,255,255,0.10)`.
3. **Heat is brightness.** "Hot" components use a stronger white border + white outer glow. "At-target" is the brightest variant. "Heating" is dimmer with a pulsing glow. "Idle" is hairline-only.
4. **Cool is cyan.** The quartz cyan accent (`#00a8ff` border, `#95ccff` ramp tint) is reserved for cooling / dunk-ready / dunk states and for cool semantic UI (info, references, secondary CTAs).
5. **No orange anywhere.** All `ember*`, `firedAmber`, `amberGold`, `heatAmber`, `heatGlow`, `activeAmber`, `activeGlow`, `activeDark`, `emberGlow` tokens are rebound to white-intensity values. No literal `#ff7a00` / `#ffb68b` / `#e89240` may remain in `src/`.
6. **Type is white.** All "on-surface" type tokens collapse to a neutral grayscale ramp. Body type is pure white; secondary is mid-gray; disabled is dim gray.
7. **Brass survives.** `brass` (`#C4AC54`) is olive-gold, not orange. It is retained for the custom-preset accent because it is the one warm token that does not read as "ember orange" on pure black.
8. **Warning and error sharpen.** Warning was `#ffb68b` (orange-pink) — too close to the retired ember. Becomes amber-yellow `#ffd60a`. Error was `#ffb4ab` (salmon) — softens too much on OLED. Becomes `#ff5252`.

---

## 3. Token Rewrite

The change is concentrated in `src/design/tokens.ts` and `src/design/themes.ts`. Most components consume these tokens by name and do not need to be touched.

### 3.1 Backgrounds & surface ramp

| Token | Old | New |
|---|---|---|
| `background`, `surface`, `surfaceDim`, `bgDeep`, `surfaceDeep` | `#0e0905` | `#000000` |
| `voidObsidian`, `idleDeep`, `surfaceContainerLowest`, `surface1` | `#080503` | `#000000` |
| `surfaceContainerLow`, `surface2`, `surfaceMid` | `#251912` / `#291d16` | `#0a0a0a` |
| `surfaceContainer`, `surface3` | `#291d16` | `#111111` |
| `surfaceContainerHigh`, `surface4`, `surfaceRaised` | `#35271f` | `#181818` |
| `surfaceContainerHighest`, `surface5`, `surfaceVariant`, `surfaceMuted` | `#40322a` | `#1f1f1f` |
| `surface6`, `surfaceBright` | `#45362e` | `#262626` |

The surface ramp is preserved as a stepped gray scale so any component currently picking `surface3` vs `surface5` continues to render with a discernible difference. In practice, the OLED language uses these sparingly — surfaces are usually flat black, and definition comes from edges.

### 3.2 Type / "bone" ramp

| Token | Old | New |
|---|---|---|
| `onBackground`, `onSurface`, `bone100`, `warmBone`, `textPrimary` | `#f6ded2` | `#ffffff` |
| `bone90`, `boneMid` | `#ecceb9` / `#e0c0af` | `#d4d4d4` |
| `bone70`, `onSurfaceVariant`, `textSecondary` | `#e0c0af` | `#a0a0a0` |
| `bone50`, `outline`, `boneDim` | `#a78b7c` | `#666666` |
| `bone35`, `textDim`, `boneGhost` | `#7a5c4b` | `#444444` |
| `bone20`, `outlineVariant` | `#584235` | `#222222` |

### 3.3 Heat ramp ("ember" tokens) — rebound to white intensity

These keep their names so consumers don't need rewrites. The values change from orange to a white-intensity ramp.

| Token | Old | New | Role |
|---|---|---|---|
| `primary`, `primaryFixedDim`, `emberBright`, `firedAmber`, `amberGold` | `#ffb68b` (or `#e89240`) | `#ffffff` | At-target / fully active (full white) |
| `primaryContainer`, `ember`, `emberGlow`, `heatAmber`, `heatGlow`, `activeAmber`, `activeGlow`, `activeDark` | `#ff7a00` | `#e6e6e6` | Heating / active-dim |
| `emberMid`, `warning` (was) | `#a04e00` / `#ffb68b` | `#888888` | Heating ring dim |
| `emberCool`, `heatCooling` | `#b86838` | `#5fa8d4` | Cooling — blends white → quartz cyan |
| `emberDeep`, `onPrimaryContainer`, `onPrimary`, `inversePrimary`, `onPrimaryFixed` | `#5c2800` / `#522300` / `#321200` | `#000000` (on-color) / `#1a1a1a` (deep) | Inverse (text on a white pill) |
| `primaryFixed` | `#ffdbc8` | `#ffffff` | Fixed bright |
| `onPrimaryFixedVariant` | `#753400` | `#222222` | Inverse variant |

### 3.4 Cool / quartz ramp — unchanged

`tertiary`, `tertiaryContainer`, `quartzBright`, `quartz`, `quartzDim`, `quartzDeep`, `quartzMid`, `coldSlate`, `heatIdle`, `heatCyan`, `secondary`-family, `amethyst`, `sapphire` all retain current values.

### 3.5 Lens colors (TempDial inner glass)

| Token | Old | New |
|---|---|---|
| `lensIdle` | `#1a2740` | `#0a0a0a` |
| `lensHeating` | `#3a1a08` | `#1a1a1a` |
| `lensTarget` | `#5c2800` | `#2a2a2a` (lens stays dark; brightness comes from the ring + glow) |
| `lensCooling` | `#3e2212` | `#0a1218` (faint cyan tint) |
| `lensDunk` | `#0c2640` | `#0c2640` (unchanged) |

### 3.6 Glass / borders / shadows

| Token | Old | New |
|---|---|---|
| `glassFill`, `glassDeep` | `rgba(28,17,10,0.6)` | `rgba(0,0,0,0.6)` |
| `glassBorder`, `crystalEdge` | `rgba(246,222,210,0.08)` | `rgba(255,255,255,0.10)` |
| `SHADOW_COLOR` (private) | `#080503` | `#000000` |
| `shadow.orb.shadowColor` | `#ff7a00` | `#ffffff` (heat orb glow → white) |

### 3.7 Semantic accents

| Token | Old | New |
|---|---|---|
| `warning` | `#ffb68b` | `#ffd60a` (amber-yellow) |
| `success` | `#7EC8A0` | `#7EC8A0` (unchanged) |
| `error` | `#ffb4ab` | `#ff5252` |
| `errorContainer` | `#93000a` | `#330000` |
| `onError` | `#690005` | `#000000` |
| `onErrorContainer` | `#ffdad6` | `#ffd6d6` |
| `brass` (custom preset) | `#C4AC54` | `#C4AC54` (unchanged — non-orange) |
| `citrine` (legacy alias) | `#C4AC54` | `#C4AC54` (unchanged) |
| `ruby` (legacy alias) | `#ffb4ab` | `#ff5252` |

### 3.8 Gradients

| Gradient | Old | New |
|---|---|---|
| `background` | `['#251912', '#0e0905', '#080503']` | `['#000000', '#000000', '#000000']` |
| `ember`, `primary` | `['#ffb68b', '#ff7a00', '#5c2800']` | `['#ffffff', '#cccccc', '#222222']` (intensity ramp) |
| `quartz`, `secondary`, `amethyst` | unchanged | unchanged |
| `heatCore` | warm-orange RGBAs | `['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.45)']` |
| `cardActive` | `['#2a1a10', '#080503']` | `['#1a1a1a', '#000000']` |
| `cardInactive` | `['#0e0905', '#080503']` | `['#0a0a0a', '#000000']` |
| `cardNeutral` | `['#1f130c', '#080503']` | `['#0a0a0a', '#000000']` |
| `wordmark` | `['#f6ded2', '#e0c0af']` | `['#ffffff', '#d4d4d4']` |
| `crystal` | warm-bone RGBAs | `['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0)']` |
| `gloss` | warm-bone RGBAs | `['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']` |

---

## 4. Component Rewrites

### 4.1 `QBackground.tsx` — full rewrite

Old: void-obsidian fill + animated warm-orange gradient + animated cool-blue gradient breathing back-and-forth.

New: pure-black fill + faint animated white radial + faint animated cyan radial. The breathe still happens, but at lower opacity (max ~12%) so it cannot compete with neon-edge components in the foreground.

```
Black fill (#000)
  ↓
Animated white radial (rgba(255,255,255,0.0–0.10), 7s sin)
  ↓
Animated cyan radial (rgba(0,168,255,0.0–0.08), 7s inverse-sin)
```

### 4.2 `SurfaceCard.tsx` — rewrite to neon-edge

The existing API (`variant: 'active' | 'inactive' | 'neutral'`, `borderRadius`, `elevated`) is preserved. The variants are reinterpreted:

| Variant | Fill | Border | Outer Glow |
|---|---|---|---|
| `active` | `#000` (or flat `cardActive` gradient `#1a1a1a → #000`) | `1px rgba(255,255,255,0.20)` | `shadowColor: #fff, opacity: 0.25, radius: 14` |
| `inactive` | `#000` | `1px rgba(255,255,255,0.06)` | none |
| `neutral` | `#0a0a0a` (or `cardNeutral` gradient) | `1px rgba(255,255,255,0.08)` | none |

Add a new optional prop: `glow?: 'hot' | 'cool' | 'none'` (default `none`). When set:
- `hot` → white border + white outer glow (overrides variant)
- `cool` → `#00a8ff` border + cyan outer glow

This new prop is how SessionWalkthrough, ChromeButton, and the TempDial wrapper escalate to "this thing is alive right now" without inventing per-component shadows.

### 4.3 `TempDial.tsx` — heat ramp via glow intensity

`STATE_LOOK` is rewritten so each state defines:
- `ring` (border color)
- `text` (numeric color)
- `lensTop` / `lensBottom` (interior glass)
- `glow` (new — outer shadow color)
- `glowOpacity` (new — drives breathe pulse intensity)

| State | ring | text | glow | glowOpacity |
|---|---|---|---|---|
| `idle` | `#444` | `#a0a0a0` | none | 0 |
| `heating` | `#888` → pulses to `#fff` | `#fff` | `#fff` | 0.2 → 0.55 (pulse) |
| `target` | `#fff` | `#fff` | `#fff` | 0.55 (steady) |
| `cooling` | `#5fa8d4` | `#d4d4d4` | `#5fa8d4` | 0.35 |
| `dunk` | `#00a8ff` | `#95ccff` | `#00a8ff` | 0.55 |

Existing pulse animation infrastructure stays; just the colors change.

### 4.4 Files with hardcoded hex literals — fix to use tokens

| File | Line(s) | Change |
|---|---|---|
| `QWordmark.tsx` | 66, 69, 114 | Line 66: `'#ffb68b'` → `colors.emberBright` (which is now `#ffffff`). Line 69 contains `state === 'dunk' ? '#95ccff' : '#ffb68b'` → `state === 'dunk' ? colors.quartzBright : colors.emberBright`. Line 114: `'#f6ded2'` → `colors.bone100` |
| `TempDial.tsx` | 34 | Replace `'#f6ded2'` with `colors.bone100` |
| `SessionWalkthrough/styles.ts` | 293 | Replace `'#f6ded2'` with `colors.bone100` |
| `SessionWalkthrough/index.tsx` | 282 | Replace `'#5aaa7a'` with `colors.success` (or new `successDim` token) |
| `SessionWalkthrough/StepIcons.tsx` | 53 | Replace `"#f6ded2"` with `colors.bone100` |

These five spots are the only places the rebind doesn't reach automatically. Once they're switched to tokens, the OLED palette flows through.

### 4.5 Shadow on heat-active components

`shadow.orb` is defined in `tokens.ts` with `shadowColor: '#ff7a00'`. Change that single literal to `'#ffffff'`. Any component consuming `shadow.orb` (e.g. `flow/components/Orb`) inherits the white halo automatically.

---

## 5. Acceptance Criteria

- No occurrence of any of the retired hex values in `src/` (verified via `grep -rn` across `*.ts`/`*.tsx`):
  - Orange/ember: `#ff7a00`, `#ffb68b`, `#ffdbc8`, `#e89240`, `#5c2800`, `#522300`, `#321200`, `#a04e00`, `#753400`, `#b86838`, `#2a1a10`
  - Warm-brown surfaces: `#0e0905`, `#080503`, `#1c110a`, `#1f130c`, `#251912`, `#291d16`, `#35271f`, `#40322a`, `#45362e`
  - Bone/warm-type: `#a78b7c`, `#584235`, `#7a5c4b`, `#e0c0af`, `#ecceb9`, `#f6ded2`
  - Soft error/lens: `#ffb4ab`, `#ffdad6`, `#690005`, `#93000a`, `#1a2740`, `#3a1a08`, `#3e2212`
  - Off-token: `#5aaa7a`
- All `colors.background` / `colors.voidObsidian` / `colors.surface1` / `colors.bgDeep` resolve to `#000000`.
- `colors.emberBright` / `colors.firedAmber` resolve to `#ffffff`.
- `colors.warning` resolves to `#ffd60a`; `colors.error` to `#ff5252`.
- App runs (`npm start`) on iOS and Android without runtime errors and with the new palette visible.
- No screen renders any orange or warm-brown hue. Manual screen audit list:
  - Splash / wordmark
  - BangerChooser carousel
  - ConcChooser grid
  - WallChooser
  - SessionWalkthrough (idle / heating / at-target / cooling / dunk)
  - NewPresetWizard (all steps)
  - MainBottomSheet open + tab variants (Reference, Configure, Presets)
  - ErrorBoundary fallback
  - Toast variants
- TempDial state transitions show the new glow ramp: heating pulses white, at-target full white, cooling blends to cyan, dunk fully cyan.
- Brass (custom preset accent) and amber-yellow warning are visible somewhere in the running app to confirm they didn't get accidentally swept up in the orange purge.
- Type contrast on black: primary text ≥ AAA (white-on-black = 21:1); secondary text `#a0a0a0` on black = 8.5:1 (AAA).

---

## 6. Out of Scope (and why)

- **Theme switching** — there's no light theme today and the user didn't ask for one.
- **Component API redesign** — `SurfaceCard` adds one optional `glow` prop, but no breaking changes. Existing call-sites stay valid.
- **Motion changes** — pulse durations, easings, spring constants unchanged. Only the *colors* the existing animations interpolate change.
- **Dark/light asset swap** — concentrate tile PNGs and other photo assets are not retouched. They render fine on black.
- **Brand wordmark / logo redraw** — `QWordmark` only swaps its hardcoded hex to tokens; the gradient form is preserved.

---

## 7. Risks & Mitigations

1. **Loss of warmth-as-brand-identity.** Quartzie's prior identity leaned on warm ember. The new look is colder and more clinical. *Mitigation:* the user explicitly asked for OLED + pop, and explicitly rejected orange. The brass custom-preset accent and the cyan dunk-ramp keep two warm/cool poles intact, so the palette is duotone, not monochrome.
2. **State legibility for color-blind users.** With heat encoded as brightness only, users with monochrome vision will still distinguish heating/at-target/cooling via the existing pulse timing and the lens text. The cyan dunk state remains hue-distinct. No regression vs. current state.
3. **Outer glow performance on Android.** `shadowColor` + radius on Android is rendered via `elevation`, which doesn't tint. *Mitigation:* the glow effect is implemented as a separate translucent View ringing the component (already the pattern in the existing codebase for `Orb` and similar). No change to Android render strategy.
4. **Token rebind misses in third-party SVG/PNG assets.** Any baked-in orange in art assets cannot be solved by tokens. *Mitigation:* concentrate tiles use grayscale + brand-neutral tones already; the only branded art is `QWordmark` (vector, uses tokens after the hex-literal cleanup).

---

## 8. Implementation Plan (high-level)

To be expanded in the implementation plan via the writing-plans skill. High-level phases:

1. Rewrite `tokens.ts` (single source of truth).
2. Rewrite `themes.ts` to match.
3. Rewrite `QBackground.tsx`.
4. Rewrite `SurfaceCard.tsx` (preserve API, add `glow` prop).
5. Update `TempDial.tsx` `STATE_LOOK` for new heat-by-glow semantics.
6. Patch the five hardcoded-hex files (`QWordmark`, `TempDial` line 34, `SessionWalkthrough/styles.ts` line 293, `SessionWalkthrough/index.tsx` line 282, `StepIcons.tsx` line 53).
7. Manual screen-by-screen audit on iOS simulator; capture before/after screenshots.
8. Grep verification for retired hex literals; zero occurrences in `src/`.
9. Commit on a feature branch; PR with screenshot diffs.
