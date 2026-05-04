# dabwith.me — RN parity audit

Reference: `/Users/joshpointer/Developer/open-design/.od/projects/6e66b056-b75f-4a5e-bb79-5e395105ca17/dabwithme-flow.html` (3,819 lines)
Implementation: `src/dwm/` (81 files, mounted at `app/(connected)/home.tsx`)

Severity: **P0** = broken/missing; **P1** = visual regression; **P2** = polish

Each finding cites *prototype location* + *implementation location* + *fix*.

---

## P0 — Broken / missing

### P0-1 · Phase 4/5 visuals + copy swapped
- Prototype `PHASE_COPY` (lines 2143–2179): phase 4 id `dunk` → mood `dunk`, eye `happy`, extras `pool+bubbles`, copy *"time for a swim. one swipe, no scrubbing. residue lifts while the quartz is still warm."*; phase 5 id `clean` → mood `clean`, eye `tidy`, extras `suds`, copy *"final swab. cap it. last pass. drop the cap. next sesh starts cleaner this way."*
- Implementation `flow/copy.ts:22-23`, `flow/DwmFlow.tsx:117-118`, `backgrounds/PhaseBackground.tsx:31-32`: phase id `swab` (4th) gets clean/suds; phase id `dunk` (5th) gets dunk/water — reversed at every layer (copy, mood, extras, bg).
- Fix: swap (a) `PHASE_COPY.swab` ↔ `PHASE_COPY.dunk` content, (b) `BUB_BY_PHASE.swab` ↔ `BUB_BY_PHASE.dunk`, (c) `PhaseBackground` `case 'swab'` ↔ `case 'dunk'` mappings, so phase position 4 = dunk-mood/water-bg and phase position 5 = clean-mood/suds-bg.

### P0-2 · Stepper count is 3 in impl, prototype has 4 (banger / concentrate / wall / **review**)
- Prototype `renderBuild` (lines 2752–2762, 2773): `[0,1,2,3].map(...)` 4 dots; eyebrows are `step 1 of 4 · banger`, `step 2 of 4 · concentrate`, `step 3 of 4 · wall`, `step 4 of 4 · check`.
- Implementation `flow/copy.ts:14-17`: eyebrows `step 1 of 3`, `step 2 of 3`, `step 3 of 3`, `all set`. Stepper props at `screens/BangerScreen.tsx:35`, `screens/ConcentrateScreen.tsx:33`, `screens/WallScreen.tsx:25` use `count={3}`. Review screen has no Stepper.
- Fix: bump count to 4, update eyebrows to `step N of 4`, add Stepper(count=4, current=3) to `ReviewScreen`.

### P0-3 · Stepper dots not tappable to go back
- Prototype `renderBuild` (lines 2753–2757): clicking a `done` dot navigates back to that step.
- Implementation `primitives/Stepper.tsx:8-22` defines `onTapStep` but build screens don't pass it (`BangerScreen.tsx:35`, etc.). `useDwmPhase.ts` has no public goto-step API.
- Fix: thread a `setPhase` callback through `ScreenSlot` (already exposed via `useDwmPhase().setPhase`); add `onTapStep` to the build screens.

### P0-4 · Build screens have no "back" chip
- Prototype `renderBuild` (lines 2764–2767): every build step has a `back-chip` button labeled `home` on step 0, `back` otherwise.
- Implementation: no back affordance anywhere except wordmark long-press. Banger/Concentrate/Wall/Review screens don't render any back UI.
- Fix: add `BackChip` primitive; render on each build screen with target = previous phase (banger→presets, concentrate→banger, wall→concentrate, review→wall).

### P0-5 · No phase-strip during session phases
- Prototype `renderSession` (lines 3033–3037): renders 5-dot strip showing `heat / cool / dab / dunk / clean` with `done`/`current`/upcoming styling on every session phase.
- Implementation `screens/HeatScreen.tsx`, `WindowScreen.tsx`, `DabScreen.tsx`, `SwabScreen.tsx`, `DunkScreen.tsx`: none render a phase strip.
- Fix: render a 5-step phase strip on each session screen using a shared primitive.

### P0-6 · Choose screen layout inverted
- Prototype `renderChoose` (lines 2671–2715): "fresh sesh" card is FIRST, then a `divider` with label `your saved seshes`, then preset cards. Eyebrow `ready when you are`, headline `pick a sesh.` (no sub).
- Implementation `screens/ChooseScreen.tsx:46-104`: recents first → presets → "build a fresh sesh" button at BOTTOM. Eyebrow `pick a sesh`, headline `how we doing this?`, sub `tap a saved sesh, or build one fresh.`
- Fix: invert order, replace bottom button with a top `Card` styled "fresh sesh", update copy.

### P0-7 · Connect screen copy mismatched
- Prototype `renderConnect` (lines 2618–2640): `eyebrow no device · let's pair`, `headline hey. wake up your dabrite.`, `sub press & hold bub to start the scan. flick the IR thermometer on and i'll do the rest.`
- Implementation `flow/copy.ts:10`: eyebrow `step 01`, headline `wake up your dabrite.`, sub `tap and hold the side button until the LED breathes.`
- Fix: port verbatim.

### P0-8 · Connecting screen copy mismatched + extra button
- Prototype `renderConnect` scanning branch (lines 2622–2630): `eyebrow no device · pairing`, `headline looking for your dabrite…`, `sub flick the IR thermometer on. i'll catch the bluetooth handshake and we're live.` No cancel button.
- Implementation `flow/copy.ts:11`: different copy. `screens/ConnectingScreen.tsx:18-25` adds a `cancel scan` ghost button.
- Fix: port copy verbatim. Remove the `cancel scan` button (the BLE state-machine path back to `cold` is via error/idle anyway, and prototype has no cancel).

### P0-9 · Heat phase: missing fallback button is correct, but copy/sub differ; eyebrow doesn't show running session timer
- Prototype `renderSession` heat (lines 3068–3077, 3260): banner has `listening` / `torch on` label states, hint copy switches; eyebrow updates every second to `phase 1 · heat · M:SS`.
- Implementation `screens/HeatScreen.tsx:26`: hint hard-coded to `torch on` / `spark the torch — i'll start the timer`. No running timer in eyebrow. Has a "tap if it's hot enough" fallback button (acceptable BLE recovery; mark P1 below).
- Fix: drive the eyebrow with running session seconds; ensure listening/torch-on state cycles label.

### P0-10 · Window phase: no in-window dwell-fill bar (1.7s hold detector)
- Prototype `runCoolPhase` (lines 3344–3461): inside `temp-banner` a `temp-banner__fill` bar fills 0%→100% over 1.7s while temp is in window; banner glows mint when in-window, peach when "lifted"; advances when fill reaches 100%.
- Implementation `screens/WindowScreen.tsx:27-42`: simple Banner with mint mood when within ±15F, no dwell timer. The `useDwmPhase` advances on `windowVelocityF_per_s = -50` (line 242) — different mechanism.
- Fix: add a dwell-fill bar to the Window banner that tracks how long live temp has been within ±15F of target. Cap at 100% over ~1.7s. (Phase advancement still uses BLE velocity per state machine — the bar is purely visual to mirror prototype's "the screen shows what the sensor saw" model.)

### P0-11 · Review screen has no Stepper, missing review-pair visual + temps grid
- Prototype `renderBuild` else (lines 2842–2884): renders stepper, back-chip, eyebrow `step 4 of 4 · check`, headline `all set?`, lede `press & hold bub to start the sesh.`, then `review-pair` (banger illo + plus + concentrate illo) and `review-temps` grid (3 cells: dab°, dunk°, torch s).
- Implementation `screens/ReviewScreen.tsx:28-62`: eyebrow `all set` (impl uses `PHASE_COPY.review.eyebrow`), no stepper, no back-chip, three Cards stacked, no temps grid. Headline says `ready when you are.`
- Fix: rebuild as `Stepper(count=4, current=3)` + back-chip + eyebrow `step 4 of 4 · check` + headline `all set?` + side-by-side review-pair illos + 3-cell temps grid.

### P0-12 · Complete screen layout differs heavily
- Prototype `renderComplete` (lines 3537–3586): eyebrow `sesh logged`, headline `that was nice.` (with `nice` in accent), lede `i saved it. you can pull up this exact sesh from the home screen any time — or tweak it.`, 2-stat grid (time on rig + dab @), 2 finish-cards (peach `another one` + lilac `back home`).
- Implementation `screens/CompleteScreen.tsx:25-69`: 4-card grid with peak/banger/window/`good sesh`/`well done` (extra "good sesh" card has no semantic content); 2-action row labeled `Again`/`New` with bare card primitive.
- Fix: 2 stats (time on rig from session timer, dab° from concentrate target); 2 cards `another one` (same banger, same hash) and `back home` (pick a different sesh) using `peach`/`lilac` glyphs.

---

## P1 — Visual regressions

### P1-1 · Stepper "current" dot uses opacity, not gradient
- Prototype `.stepper .dot.current` (line 1163-1165): `linear-gradient(90deg, var(--accent), var(--border))` (left half peach → right half border).
- Implementation `primitives/Stepper.tsx:60-62`: solid `palette.accent` at `opacity: 0.55`.
- Fix: use `expo-linear-gradient` with `[accent, border]` colors horizontal.

### P1-2 · Wordmark has no "disconnect" pill when online
- Prototype `setStatus(label, kind)` with `kind === 'disconnect'` (lines 2456–2477): renders a `wordmark__disconnect` clickable pill labeled `disconnect` when connected, with `disconnect` callback.
- Implementation `primitives/Wordmark.tsx:81-88`: chip is non-interactive, just shows `online` / `offline`.
- Fix: add optional `onDisconnect` callback; when online and provided, render as Pressable with label "disconnect".

### P1-3 · No idle Bub long-press peek hint when on connect screen
- Prototype `setBubHoldAction(connect, 'hold to scan')` (line 2639): orb-cell shows hint `hold to scan` (different from impl's `hold to find your dabrite`).
- Implementation `flow/DwmFlow.tsx:124-127`: hint label `hold to find your dabrite` for cold phase.
- Fix: change hint to `hold to scan`.

### P1-4 · Build screens use wrong category chip taxonomy
- Prototype `BANGER_CATS` (lines 2118–2123): `all`, `quartz`, `thermochromic`. `CONC_CATS` (lines 2130–2135): `all`, `rosin`, `resin`, `diamonds`.
- Implementation `screens/BangerScreen.tsx:12-17`: `classic`, `slurper`, `specialty`, `premium`. `screens/ConcentrateScreen.tsx:12-15`: `solventless`, `hydrocarbon`.
- Fix: the underlying `BANGERS` and `CONCENTRATES` data ships its own `category` taxonomy (cannot edit `src/data/`). The chip set is read from data, so this can't be naively renamed without mutating the immutable subsystems. **Documented limitation — flag in audit, not auto-fixed.** Keep current categories.

### P1-5 · Mood-heat does not animate Bub faster
- Prototype `.bub.mood-heat .bub__wrap` (lines 1486-1488): wobble 3.6s + breathe 1.4s (vs default 4.5s/3.2s).
- Implementation `bub/Bub.tsx:57-72`: wobble + breathe durations are constant regardless of mood.
- Fix: parameterize wobble/breathe duration on mood; speed up for `heat`.

### P1-6 · Mood-dunk does not animate Bub swimming
- Prototype `.bub.mood-dunk .bub__wrap` + `@keyframes bub-swim` (lines 1741-1747): rotates -7°→7° + translateXY swim, 2.6s.
- Implementation `bub/Bub.tsx`: no special animation for dunk.
- Fix: when `mood === 'dunk'` (post-swap, the position-5 phase) replace wobble with swim cycle.

### P1-7 · Bub squish on tap not wired
- Prototype `elBub.click` (lines 2361-2365): adds `tapped` class triggering `bub-squish` 480ms cubic-bezier.
- Implementation `bub/Bub.tsx:79-96` accepts `squish` prop and runs the matching curve, but `flow/DwmFlow.tsx:474` only sets `onPress` for the heat phase (skip-to-window) and never sets `squish`.
- Fix: when Bub gets a tap (any phase), trigger a one-shot squish — set `squish` to true and revert.

### P1-8 · Connecting screen has cancel-scan ghost button
Same as P0-8 (the extra button) — flagged here for visual parity.

### P1-9 · Heat phase has fallback button
- Prototype: no in-phase fallback chip — the bg countdown always reaches zero and auto-advances.
- Implementation `screens/HeatScreen.tsx:39-48`: ghost button `tap if it's hot enough` shown after `showHeatFallback`.
- Decision: keep as a BLE recovery affordance (the BLE temp ramp may not actually fire phase-advance in real-world conditions — see `useDwmPhase.ts:228`). Document as deliberate divergence.

### P1-10 · Window phase has fallback button
- Prototype: no fallback — the IR-detected lift always fires.
- Implementation `screens/WindowScreen.tsx:43-52`: ghost button `tap to dab now`.
- Decision: same — keep, document as BLE recovery.

### P1-11 · Review screen lacks "press & hold bub" hint label
- Prototype: stage renders `lede` `press & hold bub to start the sesh.`
- Implementation `screens/ReviewScreen.tsx:58-60` renders `HintLabel` with `copy.sub` which is "hold me down to start the sesh." (close but not verbatim).
- Fix: port verbatim sub.

### P1-12 · Choose screen "fresh sesh" should be a Card with peach glyph
- Prototype `renderChoose` (lines 2674–2683): peach-glyph Card titled `a fresh sesh`, sub `tell me your banger and what you're dabbing.`, with `plus` icon.
- Implementation `screens/ChooseScreen.tsx:97-104`: a generic `PressableButton` at the bottom labeled `build a fresh sesh`.
- Fix: replace with a top-of-list Card, peach glyph, plus icon, two-line copy.

### P1-13 · Choose screen divider missing
- Prototype: divider with rule + label `your saved seshes` + rule between fresh-sesh card and saved seshes.
- Implementation: section labels `RECENT` / `SAVED`.
- Fix: replace with a divider (left rule + label `your saved seshes` + right rule).

### P1-14 · Heat banner missing listening/torch-on visual states
- Prototype `.heat-banner.listening` (lines 1718–1737): different gradient bg, blue listening dot, slow listen-pulse animation; switches to peach + torch-pulse when on.
- Implementation `screens/HeatScreen.tsx:31-38`: just toggles hint text; banner mood always `peach`.
- Fix: pass listening/torch-on state to Banner, switch mood `lilac` (cool blue) → `peach` accordingly.

### P1-15 · BubHalo blur — RN cannot do CSS filter:blur
- Prototype `.bub__halo` (line 595): `filter: blur(20px)` on radial-gradient halo.
- Implementation `bub/BubHalo.tsx`: solid radial gradient via `react-native-svg` with no blur. Documented in caveat #3.
- Decision: acceptable; the soft alpha-falloff achieves a similar mood per phase. P2.

### P1-16 · Bub torch is too small relative to Bub
- Prototype `.bub__torch` (line 1518–1520): width 230px height 253px (Bub is 220px), positioned right:-78 bottom:-86.
- Implementation `bub/extras/Torch.tsx:23-24`: RENDER_W=56, RENDER_H=132 — about 25% of prototype size. Positioned bottom:-48 right:-78 — only a thin sliver visible.
- Fix: enlarge to ~140×175 (proportional to prototype), reposition.

### P1-17 · Carousel has no edge-fade gradients
- Prototype `.carousel-wrap::before/::after` (lines 1316-1333): linear-gradient horizontal fades on both edges to suggest scroll-bleed.
- Implementation `primitives/Carousel.tsx:94`: bleeds via negative margin but no fade.
- Fix: P2 — add `LinearGradient` overlays at left/right edges.

### P1-18 · Stepper "current" gradient
Subset of P1-1.

---

## P2 — Polish (deferred unless cheap)

- P2-1 · Bub face highlight position offset by 1-2px (acceptable approximation).
- P2-2 · Carousel category chip taxonomy (P1-4 — data-driven, cannot fix here).
- P2-3 · Bub starry eye uses 4-pointed SVG path vs prototype `✦` Unicode — visually similar.
- P2-4 · `bub-squish` ms math: prototype uses 0%/35%/70%/100% keyframe stops on a 480ms cubic-bezier(.34, 1.56, .64, 1); impl approximates with three withTiming segments using `Easing.bezier(0.34, 1.56, 0.64, 1)`. Visually within tolerance.
- P2-5 · Sparkles position math has a bug (Sparkles.tsx:141-142 has `* 1.36 / 1.36 * 1.36` which simplifies but is opaque). Cosmetic.
- P2-6 · Halo uses fixed solid alpha — prototype uses CSS blur(20px). Approximation is acceptable.
- P2-7 · `peek-in` per-child stagger animation on session phase change (prototype lines 783-792): impl screens don't peek-in from their wrappers. P2 — would require wrapping each `<Text>` in `Animated.View` with delayed mount. Defer.
- P2-8 · Heat banner background gradients use solid tints rather than radial; close enough.
- P2-9 · Review screen `review-temps` torch seconds display — acceptable cosmetic addition.
- P2-10 · BubBody static SVG gradient IDs — caveat #2 from spec. Verified only one Bub mounts at a time (one `<Bub>` instance in `DwmFlow.tsx:467`). Confirmed safe.

---

## Verification of caveats from task spec

1. **Torch SVG flickers via Reanimated scale-pulse, not SMIL** — partially addressed by P1-16 (size). Pulse looks alive; addressed by enlarging.
2. **BubBody static gradient IDs** — confirmed only one `<Bub>` is mounted (DwmFlow.tsx:467, single instance). Safe.
3. **BubHalo no blur** — kept; alpha falloff substitutes adequately. P2.
4. **Window-fallback chip on review screen omitted** — verified: prototype review screen does NOT have a tap-to-skip fallback; the only commit gesture is hold-Bub. Impl correctly mirrors. The HoldBub already covers this. The `torchFallback` setState in DwmFlow.tsx:220-241 is unused (computed but never read) — flagged as P2 dead state.

---

## Fixed

### P0 (all)
- **P0-1** — Phase 4/5 visual + content swap. `flow/copy.ts` PHASE_COPY ported verbatim from prototype (phase 4 → "phase 4 · dunk / time for a swim"; phase 5 → "phase 5 · clean / final swab. cap it."). `flow/DwmFlow.tsx` BUB_BY_PHASE: swab→{mood:'dunk',eye:'happy',extras:['bubbles','wave']}, dunk→{mood:'clean',eye:'tidy',extras:['suds']}. `backgrounds/PhaseBackground.tsx` swab→WaterBg, dunk→SudsBg.
- **P0-2** — Stepper count is now 4. Build screen eyebrows show "step N of 4". ReviewScreen renders Stepper(count=4, current=3).
- **P0-3** — Stepper dots tap-to-go-back wired. `screens/{Banger,Concentrate,Wall,Review}Screen.tsx` pass `onTapStep` mapping idx→phase. `flow/ScreenSlot.tsx` + `flow/DwmFlow.tsx` thread `onSetPhase={setPhase}`.
- **P0-4** — `primitives/BackChip.tsx` added. Banger→presets, Concentrate→banger, Wall→concentrate, Review→wall.
- **P0-5** — `primitives/PhaseStrip.tsx` added. Rendered on Heat/Window/Dab/Swab/Dunk screens at indices 0-4.
- **P0-6** — ChooseScreen rebuilt: fresh-sesh Card first, divider "your saved seshes", recents/presets below.
- **P0-7** — Connect screen copy ported verbatim (`flow/copy.ts:cold`).
- **P0-8** — Connecting screen copy ported verbatim; cancel-scan ghost button removed.
- **P0-9** — HeatScreen eyebrow now appends running session timer ("phase 1 · heat · M:SS"). Banner mood toggles `lilac` (listening) ↔ `peach` (torch on). Hint copy switches to "low · even · sweep" / "spark the torch — i'll start the timer". Banner eyebrow surfaces `LISTENING`/`TORCH ON` label.
- **P0-10** — WindowScreen now shows a temp banner with dwell-fill bar; `flow/DwmFlow.tsx` tracks `windowDwellPct` over a 1.7s in-window dwell; bar fills 0%→100% inside the banner, then flips to peach "lifted" gradient at completion.
- **P0-11** — ReviewScreen rebuilt: Stepper(4,3) + back-chip + eyebrow `step 4 of 4 · check` + headline `all set?` + lede + side-by-side review-pair illos with `+` divider + 3-cell temps grid (DAB / DUNK / TORCH).
- **P0-12** — CompleteScreen rebuilt: 2 stat cards (TIME ON RIG, DAB @) + 2 finish-cards (peach `another one` / lilac `back home`). Headline "that was nice." with `nice` in accent.

### P1 (all)
- **P1-1** — `primitives/Stepper.tsx` "current" dot uses `expo-linear-gradient` accent→border instead of opacity.
- **P1-2** — `primitives/Wordmark.tsx` `DisconnectChip` renders as Pressable when `onDisconnect` is provided + online. Wired to `bleManager.cancelReconnect() + bleManager.disconnect()` in `flow/DwmFlow.tsx:handleDisconnect`.
- **P1-3** — Cold hint label now `hold to scan` (was `hold to find your dabrite`).
- **P1-5** — `bub/Bub.tsx` mood-`heat` uses faster wobble (3.6s) + breathe (1.4s) via `ANIM_SPECS`.
- **P1-6** — `bub/Bub.tsx` mood-`dunk` uses bigger swing (±7°) + side-to-side translation, mirroring prototype `bub-swim` keyframe.
- **P1-7** — `bub/Bub.tsx` taps now fire the squish curve via `fireSquish` before forwarding `onPress`. Press-handler always fires squish.
- **P1-8** — covered by P0-8.
- **P1-9** — kept as deliberate BLE recovery affordance, documented below.
- **P1-10** — kept as deliberate BLE recovery affordance, documented below.
- **P1-11** — ReviewScreen `lede` now reads `press & hold bub to start the sesh.` verbatim.
- **P1-12** — covered by P0-6.
- **P1-13** — covered by P0-6.
- **P1-14** — HeatScreen Banner mood and label drive listening/torch-on visual states.
- **P1-16** — `bub/extras/Torch.tsx` accepts `bubSize` prop, scales render dimensions to the prototype's 230×253 @ 220px-ref. Adds 70-80ms opacity flicker overlay so the flame reads as alive without SMIL.
- **P1-17** — `primitives/Carousel.tsx` adds left/right `LinearGradient` edge fades.

## Deferred (P2)
- **P2-1** Bub face highlight position 1-2 px off — visually within tolerance.
- **P2-2** Carousel category chip taxonomy (`classic|slurper|specialty|premium` vs prototype `quartz|thermochromic`). Driven by immutable `src/data/bangers.ts` + `src/data/concentrates.ts` taxonomy; cannot be fixed without modifying preserved data subsystems.
- **P2-3** Bub starry eye uses 4-pointed SVG path; prototype uses `✦` Unicode glyph. Visually equivalent.
- **P2-4** `bub-squish` ms math approximated via three `withTiming` segments using `Easing.bezier(0.34, 1.56, 0.64, 1)`. Within tolerance; matching exact 0/35/70/100 keyframes is impractical without a CSS engine.
- **P2-5** `bub/extras/Sparkles.tsx` position arithmetic has a redundant `* 1.36 / 1.36 * 1.36` term. Cosmetic, correctness preserved.
- **P2-6** `bub/BubHalo.tsx` uses solid radial alpha falloff in lieu of `filter: blur(20px)` (RN-SVG limitation). Mood-per-phase reads correctly.
- **P2-7** `peek-in` per-child stagger on session phase changes is not implemented per-screen. Would require wrapping each `<Text>` in `Animated.View` with delayed mount; defer.
- **P2-8** Heat banner backgrounds use solid tints in lieu of CSS radial-gradient combinations. Visually close.
- **P2-9** Sparkles position math redundancy (P2-5 dup tag, harmless).
- **P2-10** BubBody static SVG gradient IDs — only one `<Bub>` mounts at a time (`flow/DwmFlow.tsx:467`). Verified safe.

## Caveat verifications (from task spec)
1. **RN-SVG cannot run SMIL** — confirmed; `bub/extras/Torch.tsx` now combines scale + rotation + 70-80ms opacity flicker. Reads as alive at the new (P1-16) larger render size.
2. **BubBody static gradient IDs / single-Bub guarantee** — confirmed: `flow/DwmFlow.tsx` mounts exactly one `<Bub>` (line 467, single instance). Safe.
3. **No CSS blur on halo** — accepted; alpha-falloff radial gradient substitutes.
4. **Window-fallback chip on review screen** — verified the prototype review screen does NOT have a tap-to-skip fallback; the only commit gesture is press-and-hold-Bub. The impl matches. Note: the unused `torchFallback` setState in `flow/DwmFlow.tsx:220-241` is now harmless (computed but never read) — left in place; cheap to remove later.

## File count
Started: 81 files under `src/dwm/`. Now: 85 files (84 `.ts`/`.tsx` + `PARITY_AUDIT.md`). New files: `primitives/BackChip.tsx`, `primitives/PhaseStrip.tsx`, `PARITY_AUDIT.md`. No existing files deleted.

---

## Final tsc output

```
$ npx tsc --noEmit
(0 errors, exit 0)
```

