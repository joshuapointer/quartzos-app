---
name: Quartzie

colors:
  # ── Core Backgrounds (Dark warm espresso / obsidian) ──
  background: "#1c110a"
  surface: "#1c110a"
  surface-dim: "#1c110a"
  surface-bright: "#45362e"
  
  # ── Surface Containers ──
  surface-container-lowest: "#160c06"
  surface-container-low: "#251912"
  surface-container: "#291d16"
  surface-container-high: "#35271f"
  surface-container-highest: "#40322a"
  surface-variant: "#40322a"
  
  # ── Typography Colors ──
  on-background: "#f6ded2"
  on-surface: "#f6ded2"
  on-surface-variant: "#e0c0af"
  
  # ── Primary (Ember / Warm) ──
  primary: "#ffb68b"
  on-primary: "#522300"
  primary-container: "#ff7a00"
  on-primary-container: "#5c2800"
  primary-fixed: "#ffdbc8"
  primary-fixed-dim: "#ffb68b"
  on-primary-fixed: "#321200"
  on-primary-fixed-variant: "#753400"
  
  # ── Secondary (Muted cool) ──
  secondary: "#c1c6d5"
  on-secondary: "#2b313c"
  secondary-container: "#414753"
  on-secondary-container: "#b0b5c3"
  secondary-fixed: "#dde2f1"
  secondary-fixed-dim: "#c1c6d5"
  on-secondary-fixed: "#161c26"
  on-secondary-fixed-variant: "#414753"

  # ── Tertiary (Quartz / Cool Blue) ──
  tertiary: "#95ccff"
  on-tertiary: "#003352"
  tertiary-container: "#00a8ff"
  on-tertiary-container: "#003a5c"
  tertiary-fixed: "#cde5ff"
  tertiary-fixed-dim: "#95ccff"
  on-tertiary-fixed: "#001d32"
  on-tertiary-fixed-variant: "#004a75"
  
  # ── Outlines & Error ──
  outline: "#a78b7c"
  outline-variant: "#584235"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"

typography:
  display-lg:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 300
    lineHeight: "1.1"
    letterSpacing: "-0.04em"

  headline-md:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "1.2"
    letterSpacing: "-0.02em"

  body-main:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
    letterSpacing: "0em"

  data-value:
    fontFamily: "Geist Mono, SF Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
    letterSpacing: "0em"

  data-label:
    fontFamily: "Geist Mono, SF Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "1.0"
    letterSpacing: "0.1em"

rounded:
  DEFAULT: "1rem"       # 16px
  lg: "2rem"            # 32px
  xl: "3rem"            # 48px
  full: "9999px"

spacing:
  unit: "4px"
  xs: "8px"
  sm: "16px"
  element-gap: "24px"
  md: "32px"
  container-padding: "40px"
  lg: "64px"
  xl: "128px"

elevation:
  glass-disc:
    description: "Cool/Warm-tinted backdrop-blur surface"
    backdropFilter: "blur(22px) saturate(1.2)"
    background: "radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%), rgba(41,29,22,0.55)"
    boxShadow:
      - "inset 0 0.5px 0 rgba(255,255,255,0.10)"
      - "inset 0 -0.5px 0 rgba(0,0,0,0.55)"
      - "inset 0 0 0 0.5px rgba(167,139,124,0.08)"
      - "0 12px 32px rgba(0,0,0,0.45)"

motion:
  duration:
    instant: "150ms"
    quick:   "200ms"
    base:    "400ms"
    smooth:  "600ms"
    enter:   "480ms"
    deliberate: "800ms"
    slow:    "900ms"
  easing:
    swoop:   "cubic-bezier(0.22, 1, 0.36, 1)"
    standard: "ease"
    in-out:  "ease-in-out"

components:
  q-action:
    description: "The primary CTA button, using primary-container for background and background color for text."
    typography: "{typography.data-label}"
    rounded: "{rounded.full}"
    padding: "20px 40px"
    color: "{colors.background}"
    background: "{colors.primary-container}"
    hoverBackground: "{colors.primary}"
    boxShadow:
      - "0 0 25px rgba(255,122,0,0.4)" # glow effect based on primary-container
    hoverBoxShadow:
      - "0 0 40px rgba(255,122,0,0.6)"

  orb:
    description: |
      The central piece of Quartzie, composed of multi-layered refractive glass over a core emitter.
      It uses tertiary-container for idle state and shifts to primary/ember for heating.
    states:
      idle:
        core: "bg-gradient-to-tr from-tertiary-container/40 to-transparent"
        glow: "bg-tertiary-container/20 blur-[60px]"
        shadow: "0 0 30px rgba(0,168,255,0.3)"
      heating:
        core: "bg-gradient-to-tr from-primary-container/40 to-transparent"
        glow: "bg-primary-container/20 blur-[60px]"
        shadow: "0 0 30px rgba(255,122,0,0.3)"
---

## Brand & Style

Quartzie is a connected-device companion app for an IR thermometer used to time precision dabs on a quartz banger. The brand is built on a dark, warm, and sophisticated aesthetic: deep espresso/obsidian backgrounds, refractive glass surfaces, and vibrant, saturated ember and quartz accents. The personality is **minimalist, instrument-grade, and slightly theatrical**.

The defining move is the **central orb**. Every screen orbits a single refractive sphere whose color, size, and emission shift through the session: cold blue idle → glowing ember at target. The UI uses an MD3-inspired token structure with deep contrast.

## Colors

The palette leverages a dark, warm background with high-impact accents:
- **Surface & Background**: `surface-container-lowest` (`#160c06`) through `surface-container-highest` (`#40322a`). These form the deep, warm espresso/obsidian foundation.
- **Ember (Primary)**: `#ffb68b` and `#ff7a00`. Used for the active orb, the primary pill button, and heating states.
- **Quartz (Tertiary)**: `#95ccff` and `#00a8ff`. The cool counterpart used for "cold" states and idle glow.
- **Ink / Typography**: `on-surface` (`#f6ded2`) and `on-surface-variant` (`#e0c0af`) for warm, readable text against the dark backgrounds.

The atmospheric depth is built using bloom gradients: soft, massive blurred circles of `primary-container` and `tertiary-container` acting as ambient lighting in the background, creating a sense of deep space lit from the orb outward.

## Typography

The system uses **Geist** for display and body text, and **Geist Mono** for data and labels.
- **display-lg**: Geist Light (300) at 48px, line-height 1.1, negative tracking (`-0.04em`). Used for massive, unhurried headlines.
- **headline-md**: Geist Regular (400) at 24px, line-height 1.2, tracking `-0.02em`. Used for section headers.
- **body-main**: Geist Regular (400) at 16px, line-height 1.6. Supporting copy.
- **data-value**: Geist Mono Regular (400) at 14px, line-height 1.4. Used for tabular telemetry, timers, and measurements.
- **data-label**: Geist Mono Medium (500) at 12px, line-height 1.0, tracking `0.1em`. Used for eyebrows, button labels, and small metadata.

## Layout & Spacing

Spacing rhythm is strictly defined:
- **unit**: 4px
- **xs/sm/md/lg/xl**: 8px, 16px, 32px, 64px, 128px
- **element-gap**: 24px
- **container-padding**: 40px

The main content is centered in a `max-w-2xl` container. The orb anchors the layout, with typography and controls stacked below or around it. 

## Elevation & Depth

Depth is established through overlapping glass discs and ambient lighting:
- **The Void**: Solid `surface-container-lowest` background with screen-blended ambient blooms (`blur-[150px]`).
- **Glass Shells**: `backdrop-blur` with subtle white/transparent gradients and inner shadows (`inset 0 0 40px rgba(255,255,255,0.05)`).
- **Core Emitters**: Solid or gradient circles with massive blur (`blur-[8px]`, `blur-[60px]`) casting colored shadows onto the layers above them.

## Shapes

The shape language is heavily rounded:
- **Circles & Orbs**: `rounded-full` (`9999px`). The most important elements are circles.
- **Pills**: `rounded-full` buttons with ample padding (e.g., `px-10 py-5`).
- **Containers**: `rounded-DEFAULT` (1rem) up to `rounded-xl` (3rem) for cards and grouped content.

## Components

### The Orb (`TempDial`)
A multi-layered glass construct consisting of an external diffuse glow, an outer glass shell (`backdrop-blur-[22px]`), a mid-layer refraction, a core emitter (`tertiary-container` or `primary-container`), and an optical highlight on top. 

### Pill Buttons (`q-action`)
Large, emissive pills using `primary-container` background with an outer glow `shadow-[0_0_25px_rgba(255,122,0,0.4)]` that brightens on hover. Text is uppercase Geist Mono `data-label`.

### Ambient Lighting Blooms
Fixed position, pointer-events-none `div`s with `mix-blend-screen` and `blur-[120px]` to `blur-[150px]`, casting colored light (`primary-container` and `tertiary-container`) across the dark surface.