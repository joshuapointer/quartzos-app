---
name: Quartzie
description: Companion app for the Dab Rite PRO v2.2 — real-time temperature ritual, precisely controlled.
colors:
  void-obsidian: "#050403"
  surface-deep: "#0c0908"
  surface-mid: "#1c1714"
  surface-raised: "#2a2320"
  surface-muted: "#352c27"
  surface-bright: "#3d342e"
  warm-bone: "#f4ede4"
  bone-mid: "#c7b8a4"
  bone-dim: "#9e907e"
  bone-ghost: "#6d6050"
  fired-amber: "#E89240"
  ember-glow: "#C97326"
  ember-deep: "#8A4E16"
  cold-slate: "#9ABDD8"
  quartz-mid: "#7BA8C4"
  quartz-dim: "#4A7490"
  brass: "#C4AC54"
  error: "#E07070"
  success: "#7EC8A0"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "48px"
    fontWeight: 300
    lineHeight: 1.0
    letterSpacing: "-1.92px"
  h1:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.64px"
  h2:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.2
  body-lg:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "18px"
    fontWeight: 300
    lineHeight: 1.4
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "16px"
    fontWeight: 300
    lineHeight: 1.5
  caption:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "12px"
    lineHeight: 1.4
    letterSpacing: "0.4px"
  label-caps:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "2.2px"
rounded:
  sm: "8px"
  md: "16px"
  lg: "22px"
  xl: "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "#E8924026"
    textColor: "{colors.warm-bone}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "#E8924040"
    textColor: "{colors.warm-bone}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-secondary:
    backgroundColor: "rgba(22,16,35,0.6)"
    textColor: "{colors.warm-bone}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-bone}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  glass-card:
    backgroundColor: "{colors.void-obsidian}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  preset-pill:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.warm-bone}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
---

# Design System: Quartzie

## 1. Overview

**Creative North Star: "The Ritual Instrument"**

Quartzie is a precision instrument built for ceremony. Cannabis concentrate sessions have a rhythm, a pace, a specific arc of heat and cool — the app exists to serve that arc, not interrupt it. Every interface decision asks: does this help the ritual, or does it intrude on it? The answer almost always points toward less: less chrome, less hierarchy, less ceremony around the ceremony itself.

The reference frame is not a tech product. It is a fine analog instrument in a dim, unhurried environment — the kind of thing a skilled bartender or sommelier handles without looking at it directly. The UI communicates with peripheral confidence: readable at a glance in low light, operable with one hand, invisible when nothing needs attention. Surfaces have material weight. Glass surfaces earned their blur. Amber and slate are not decorative — they are the language of heat.

The system is warm-dark, not cold-dark. The distinction matters: void obsidian has a warm brown cast, not a cool blue-black. Bone whites lean toward cream, not clinical white. Amber and slate state colors communicate device temperature unambiguously, not aesthetically.

**Key Characteristics:**
- Warm obsidian depth scale: seven tonal steps from void-deep (#050403) to surface-bright (#3d342e)
- Functional color: amber means heat, slate means cool — color is data, not decoration
- Space Grotesk throughout: geometric restraint, not sterile precision
- Glass surfaces only where the glass metaphor is physically true (frosted panels, not every container)
- Spring-back haptic animation: press feedback mirrors physical material resistance
- Single-surface layout: TempDial anchors the home screen; all secondary content reveals in place


## 2. Colors: The Obsidian Ritual Palette

The palette is split into two semantic registers: temperature states (Ember and Quartz) and structural surfaces (Obsidian and Bone). Temperature colors carry all the expressive weight. Structural colors stay neutral and let the temperature states read clearly.

### Primary
- **Fired Amber** (#E89240): The at-target heat state. Used for the TempDial ring when temperature matches the preset, primary button fills (at 15% opacity with ember-tinted glow shadow), and active warnings. Appears in approximately 8-12% of any given screen. Its rarity is the signal.
- **Ember Glow** (#C97326): The actively-heating state. Deeper amber, used for the TempDial ring while the device climbs toward target. Also used for `ember` gradient steps.
- **Ember Deep** (#8A4E16): The deep-heat and inverse-primary token. Appears in gradient tails and selected-state fills where Fired Amber would be too bright.

### Secondary
- **Cold Slate** (#9ABDD8): The dunk-ready / fully-cooled state. The temperature complement to Fired Amber. Used for the TempDial ring when the device has cooled past the safe-dunk threshold, secondary container fills, and idle state accents. Cool without being cold; blue without being corporate.
- **Quartz Mid** (#7BA8C4): Active-dunk-in-progress ring state. Slightly deeper than Cold Slate.
- **Quartz Dim** (#4A7490): Idle ring state. The device is connected but not active. Understated, neutral.

### Tertiary
- **Brass** (#C4AC54): Custom preset accent gem color. User-assignable gem dots on preset pills. One-off, never used for structural UI.

### Neutral
- **Warm Bone** (#f4ede4): Primary text. The brightest surface-text value. Never pure white.
- **Bone Mid** (#c7b8a4): Secondary text, icon fills, onSurfaceVariant. One step dimmer, still readable.
- **Bone Dim** (#9e907e): Tertiary text, placeholder values.
- **Bone Ghost** (#6d6050): Disabled states, dividers, outline strokes. The boundary between visible and invisible.
- **Void Obsidian** (#050403): The deepest background. Full bleed; the app never uses pure black.
- **Surface Deep** (#0c0908) through **Surface Bright** (#3d342e): Six tonal steps for layered surfaces, sheets, and cards. Each step is ≈0.07 OKLCH lightness apart.

### Semantic
- **Error** (#E07070): Form errors, out-of-range temperature warnings. Ruby-warm, not red-cold.
- **Success** (#7EC8A0): Confirmation states, successful connection. Muted jade, not neon green.

### Named Rules

**The Functional Color Rule.** Amber and slate communicate device temperature — not product personality, not status hierarchy, not category labeling. Never use Fired Amber as a generic primary action color when it would appear during a non-heat-state screen.

**The Rarity Rule.** Fired Amber (#E89240) should occupy ≤12% of any screen surface. When the dial is amber, the screen is already lit by it. Do not compete.


## 3. Typography

**Display Font:** Space Grotesk (weights 300, 400, 500, 700; fallback sans-serif)
**Body Font:** Space Grotesk (same family, weight 300 for body)
**Wordmark/Logotype Font:** Georgia, serif — used only for the "Quartzie" wordmark, never for UI text
**Monospace (technical values):** Menlo, Courier New, monospace — sensor readings in debug views only

**Character:** Space Grotesk is geometric but not cold. Its rounded forms echo the dial and pill shapes in the layout without announcing themselves. The pairing of geometric 300-weight display against 500-weight label-caps creates hierarchy through weight contrast alone — no font switching needed.

### Hierarchy
- **Display** (weight 300, 48px, line-height 1.0, tracking -1.92px): Temperature readout in the TempDial. The single most-read value in the app; every design decision around it is legibility-first.
- **H1** (weight 400, 32px, line-height 1.1, tracking -0.64px): Screen titles, large confirmations.
- **H2** (weight 400, 24px, line-height 1.2): Sheet headers, section headings.
- **Body Large** (weight 300, 18px, line-height 1.4): Primary supporting text in sheets, prominent labels.
- **Body** (weight 300, 16px, line-height 1.5): Default text everywhere. Max line length 65ch.
- **Caption** (weight 400, 12px, tracking +0.4px): Secondary metadata, timestamps, status strings.
- **Label Caps** (weight 500, 10px, tracking +2.2px, all-caps): All UI metadata labels — "PRESET", "TARGET", "SESSION", tab labels, form field labels. This role handles all uppercase label work; nothing else should be uppercase.

### Named Rules

**The Weight Rule.** Hierarchy is weight + scale — never color alone. A larger, lighter-weight heading reads as primary; a smaller, heavier-weight label reads as metadata. Color should never be the sole differentiator of text hierarchy.

**The Label-Caps Monopoly.** Only `labelCaps` is uppercase. Never uppercase body, caption, or heading text. One role, one register.


## 4. Elevation

The system uses **ambient-glow elevation** rather than drop-shadow elevation. Surfaces are distinguished by warm-tinted tonal steps (the obsidian scale), not by shadow depth. Shadows appear only in two purposeful roles: the orb glow (state-driven, ember-colored) and the card lift (structural, near-black, 50% opacity).

Glass surfaces use `expo-blur` with `tint: "dark"` at intensity 15–40, backed by a `glassFill` semi-transparent overlay and a `glassBorder` 1px full-perimeter stroke. The blur is structural: it communicates "this panel floats above the surface below." It is never used decoratively.

### Shadow Vocabulary
- **Card Shadow** (`shadowColor: #000`, offset 0/4, opacity 0.50, radius 12, elevation 8): Structural lift for GlassCard containers. Grounds floating panels against the deep background.
- **Orb Glow** (`shadowColor: #E89240`, offset 0/0, opacity 0.30, radius 24, elevation 16): The TempDial ambient glow. Color-matches the current heat state; opacity scales with proximity to target temperature.
- **Button Lift** (`shadowColor: #000`, offset 0/2, opacity 0.40, radius 6, elevation 4): Subtle material weight under ChromeButtons. Present at rest; identical on hover (press feedback is spring-scale, not shadow change).

### Named Rules

**The Earned Blur Rule.** `BlurView` is reserved for surfaces that are semantically floating above other content: the main bottom sheet, GlassCard panels, PresetPill rows. Do not blur decorative containers, list items, or surfaces that are logically inline.

**The Glow-Follows-State Rule.** The orb glow color tracks the device temperature state. Ember glow during heating. Cold-slate glow during dunk. No glow during idle. The light source is the device, not the UI.


## 5. Components

### Buttons (ChromeButton)

Three variants; all share a 16px border-radius (rounded.md), 52px min-height, spring-scale press feedback (0.96× on press-in, rebound to 1.0× on release), and light haptic on each press.

- **Primary:** Background is Fired Amber at 15–30% opacity (`#E8924026`), border is Fired Amber at 35% opacity, ember-colored glow shadow. Text is Warm Bone (weight 700, 16px). Used for the single committed action per screen.
- **Secondary:** Background is a dark semi-transparent fill (`rgba(22,16,35,0.6)`), border is white at 10% opacity. Text is Warm Bone. Used for supporting actions alongside a primary.
- **Ghost:** Transparent background, border is white at 15% opacity. Text is Warm Bone. Used for de-emphasized or destructive-action pathways where color would mislead.

Disabled state: opacity 0.45 across all variants. No other visual change.

### Cards (GlassCard)

The canonical floating panel. `expo-blur` at intensity 20, dark tint, backed by `glassFill` (rgba(5,4,3,0.6) in default palette) and a `glassBorder` 1px full-perimeter stroke. A hairline top-left corner highlight (1px top + left only, rgba(255,255,255,0.03)) suggests material specular. Internal padding 16px. Border radius 22px (rounded.lg).

**The Glass-Only Rule.** GlassCard appears only when content floats above a visible background layer. Never use it as a generic list item container or section wrapper. If the card is flush against an opaque surface, it is not a glass card — it is a surface-raised container.

### Preset Pill (PresetPill)

48px height, 14px border radius. Glass fill with blur intensity 15. Left: 10px circular gem dot (user-assigned color, one of the mineral accent colors). Center: stacked PRESET label (9px, 1.2 tracking, 500 weight, uppercase) + preset name (14px, 400). Right: "Change" text (11px, bone-ghost) + chevron. Spring-scale press feedback (0.97×).

### Toggle (CrystalToggle)

56×32px track, 26px thumb. Track: glass fill + blur + gradient tint overlay that fades in when active (primary color at 50% → primaryContainer at 30%). Thumb: gradient from primaryContainer → primary (top to bottom), 0.5px specular border, lift shadow. Animated thumb position via spring (toggleSpring: damping 15, stiffness 260, mass 0.5). Active state adds a glow halo around the thumb.

### TempDial (Signature Component)

The anchoring element of the home screen. A large circular temperature display with a thermochromic ring that transitions between Quartz Dim (idle) → Ember Glow (heating) → Fired Amber (at target) → Cold Slate (cooling/dunk). The ring glow tracks temperature state continuously, not in discrete steps. The center lens color also tracks state (lensIdle through lensDunk). Temperature text is Display weight (48px, 300, -1.92 tracking). Target and current temperatures stack vertically inside the dial.

The dial has two scale states: full-size (centered on screen, ~280px diameter) and mini (compact, ~80px, anchored bottom-left during secondary-surface interactions). The spring transition between states is the primary animation in the app.

### Data Strip (DataStrip)

A horizontal row of labeled numeric values (e.g., peak temp, duration, hit count). Three cells per strip; each cell has a label-caps label above a body-lg value. Used in session summaries and history cards. No borders between cells; horizontal spacing creates the rhythm.


## 6. Do's and Don'ts

### Do:
- **Do** use the obsidian tonal scale (surface1–surface6) for progressive surface elevation — the 7-step warm-dark scale exists for exactly this.
- **Do** make temperature state color the loudest visual signal on any active-session screen. The ring is the primary communication channel.
- **Do** use `label-caps` (10px, 500, 2.2 tracking, all-caps) for every UI metadata label — PRESET, TARGET, CHANNEL, TAB NAMES.
- **Do** keep primary actions within thumb reach. Min-height 52px for any tappable target.
- **Do** earn blur. Only use `BlurView` when the panel is semantically floating above another layer.
- **Do** test readability in near-dark conditions. If a label requires squinting, increase contrast — the app is used in low light.
- **Do** use spring physics (damping 14–18, stiffness 200–260) for all interactive element feedback. No CSS-style ease-in-out for press states.

### Don't:
- **Don't** use cannabis leaf iconography, dispensary app visual language (Weedmaps/Leafly palette, neon greens, leaf motifs), or anything that signals the drug category rather than the instrument.
- **Don't** use clinical white medical device UI conventions: pure white surfaces, stark contrast, institutional typography, diagnostic color coding.
- **Don't** use neon-on-black headshop aesthetics: neon purple, neon green, neon pink, aggressive glows, LED-strip color palettes. The darkness should feel like a well-lit bar at night, not a blacklight room.
- **Don't** use SaaS dashboard chrome: sidebars, data tables, tabs-as-navigation, status-bar stacks, sterile gray scaffolding.
- **Don't** use pure black (#000000) or pure white (#FFFFFF) anywhere. Every neutral is tinted warm. Every surface has a brown cast.
- **Don't** apply `BlurView` to list items, cards in a list, or any container that does not float above a visible layered background. Blur is structural, not decorative.
- **Don't** use side-stripe borders (border-left/right >1px as a colored accent). Rewrite with full-perimeter borders, tonal fills, or leading gem dots.
- **Don't** use gradient text (background-clip: text). Single solid color; emphasis through weight or size.
- **Don't** introduce a second typeface for UI text. Space Grotesk handles all roles. Georgia is wordmark-only. Menlo is sensor-debug-only.
- **Don't** animate layout properties. Position, scale, and opacity only via Reanimated. Never width/height/padding in animated values.
- **Don't** add a modal as a first-response to secondary actions. The single-surface layout uses in-place reveal and bottom-sheet promotion. Modals are for interruptions that require a decision before proceeding.


## 7. Brand Kit & Production Assets

The Quartzie brand kit lives at `assets/brand/` (production-ready PNGs) with vector source SVGs at `assets/brand/source/`. The four runtime app icons live at `assets/`.

### Runtime app icons (`assets/`)

| File | Size | Purpose |
|---|---|---|
| `icon.png` | 1024×1024 | iOS app icon — full-bleed warm-obsidian + Q-as-dial monogram |
| `adaptive-icon.png` | 1024×1024 | Android adaptive-icon foreground; mark sized inside the 66% safe-zone; pairs with `app.json android.adaptiveIcon.backgroundColor: "#050403"` |
| `splash-icon.png` | 1024×1024 | Splash mark — wordmark "quartzie" over a quiet ember halo; pairs with `app.json splash.backgroundColor: "#050403"` |
| `favicon.png` | 512×512 | Web favicon (Expo Web) — color, retina-friendly |

All four are rendered from canonical SVG sources, so they can be regenerated at any size.

### Brand kit (`assets/brand/`)

| File | Size | Purpose |
|---|---|---|
| `monogram.png` / `monogram-512.png` | 1024² / 512² | The Q-as-dial mark on warm-obsidian, with 12% padding to the canvas edge. Use for press, profile avatars, square brand placements. |
| `wordmark-light.png` | 1200×320 | Wordmark on warm-obsidian (light text on dark). Default usage. |
| `wordmark-dark.png` | 1200×320 | Wordmark on warm-bone (dark text on light). For light surfaces or print. |
| `og-hero.png` | 1200×630 | Open-graph share image. Monogram + wordmark + tagline + descriptor. |
| `social-square.png` | 1080×1080 | Instagram / general social square. Centered monogram + wordmark stack. |

### The mark — design rationale

The Quartzie monogram is the **Q-as-thermal-dial**:

- The bowl of the Q is the TempDial outer ring at fired-amber (`#E89240`) — the at-target heat state.
- The descender is the heat-trace tangent leaving the ring at ~4 o'clock, ending in a small ember terminal.
- The center lens uses a warm-obsidian gradient (`lensTarget` → `surface1`) that reads as the inner crystal at temperature.
- A subtle bone gloss runs across the upper edge of the lens — the only specular highlight on the mark.
- A hairline bone tick at 12 o'clock anchors the dial.

The mark literally **is** what the app does: a temperature dial that spells Q. Premium without announcing itself.

### Texture (`assets/textures/`)

| File | Size | Purpose |
|---|---|---|
| `grain.png` | 512×512 | Tiled fractal-noise grain. Use at ≤4% opacity over `QBackground` for material weight. |

### Usage rules

1. The wordmark sits only on `#050403` (light variant) or `#f4ede4` (dark variant). Never on amber.
2. The monogram has a built-in ember halo — do not add an additional outer glow.
3. Minimum monogram size: 64×64 px (anything smaller becomes a flat amber dot).
4. Clear-space: at least 12.5% of the monogram width on every side.
5. Never tint the wordmark amber. Amber is a temperature signal, not a brand color (per the Functional Color Rule).
6. Re-rendering: SVG sources are deterministic. To regenerate PNGs, see `assets/brand/README.md`.
