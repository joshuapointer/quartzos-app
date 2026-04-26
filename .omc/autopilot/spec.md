# QuartzOS → Quartzie Redesign Spec

## Brand
- Display name: "QUARTZIE" (was "QUARTZOS")
- app.json `name`: "Quartzie"
- Internal IDs (MMKV, DB, bundle ID): unchanged

## Design Language
**Amethyst Crystalline Glassmorphism** — replacing amber/navy skeuomorphic chrome.

### Color Palette
| Token | Hex | Old Token |
|---|---|---|
| bgDeep | #120C1F | idleDeep #0A1F3D |
| surface1 | #110b1e | — |
| surface2 | #161023 | idleMid |
| surface3 | #1e182c | — |
| surface4 | #231c30 | idleLight |
| surface5 | #2d273b | — |
| surface6 | #383146 | — |
| surfaceBright | #3d364b | — |
| primary | #cfc1ff | activeAmber #FFA93C |
| primaryContainer | #b5a1ff | activeGlow #FFD27A |
| primaryFixedDim | #ccbdff | activeDark #D46A0B |
| secondary | #e1bae2 | — |
| secondaryContainer | #5a3c5d | — |
| onSurface | #e9def9 | textPrimary #FFF |
| onSurfaceVariant | #cac4d3 | textSecondary |
| outline | #938e9c | textDim |
| outlineVariant | #484551 | crystalEdge |
| glassBorder | rgba(204,189,255,0.10) | crystalEdge |
| glassFill | rgba(18,12,31,0.40) | glassDeep |
| error | #ffb4ab | alertRed |
| warning | #FF9F2E | alertAmber (kept) |
| success | #49D67A | success (kept) |
| — REMOVED — | chromeHi/Mid/Lo, bezelDark/Light | |

### Heat-State Colors (PRESERVED for usability)
- HEATING_UP: amber `#FFA93C` ring
- DAB_READY: amber-bright `#FFD27A` ring  
- DUNK_READY: cyan `#5AD9FF` ring
- COOLING: dim `rgba(140,180,255,0.5)` ring

### Gem Palette (new)
- ruby: #ff4d6d
- amethyst: #b5a1ff
- emerald: #06d6a0
- sapphire: #60a5fa
- citrine: #fbbf24

### Typography
- Font: Space Grotesk via `@expo-google-fonts/space-grotesk`
- Weights: 300, 400, 500, 700
- Scale: display(48sp,-0.04em,300w) / h1(32sp,-0.02em,400w) / h2(24sp,400w) / bodyLg(18sp,300w) / bodyMd(16sp,300w) / labelCaps(12sp,0.1em,500w,uppercase)

### Icon System
- Use `@expo/vector-icons` `MaterialIcons` (already available)
- Tab icons: home=`flare`, hub=`diamond`, presets=`auto-awesome`, settings=`settings-input-component`
- Header: `blur-on` (left), `account-circle` (right)

## Components

### QuartzBackground → AuraBackground
- Replace linear gradient + shimmer with:
  - Base: `#120C1F` solid
  - Top-left purple aura blob: `rgba(100,80,180,0.15)` blurred 120dp ellipse
  - Bottom-right secondary aura: `rgba(90,60,93,0.10)` blurred 150dp ellipse
  - No shimmer animation (preserve reduceMotion)

### GlassCard (refactor)
- Fill: `rgba(18,12,31,0.40)` + BlurView intensity 20
- Border: `rgba(204,189,255,0.10)` 1px
- Shadow: `rgba(0,0,0,0.37)` spread
- Remove: crystal gradient, top-edge gloss arc, amber highlights

### ChromeButton → GlassButton
- Primary: amethyst fill `primaryContainer` + glow shadow
- Secondary: glass fill `rgba(22,16,35,0.6)` + border
- Ghost: transparent + subtle border
- Remove all chrome gradient layers

### CrystalToggle (refactor)
- Active: primary `#cfc1ff` glow + primary knob
- Inactive: dark track `#05030A` + surface-variant knob
- Remove amber active state

### SkeuSlider (refactor)
- Track: recessed dark `#05030A` (keep)
- Fill: primary gradient (Dab) OR secondary gradient (Dunk) — add `variant` prop
- Thumb: `primaryContainer` fill with specular

### TemperatureOrb (rewrite)
- 280dp sphere (unchanged size)
- Two rotating refraction rings (border only, angled ±12 and ±45 deg)
- Central orb: radial gradient white→primary→bgDeep, amethyst glow shadow
- Temp readout: 72sp, white color (drop gradient text to avoid MaskedView dep)
- Sub-labels: "Current Temp" + "Target: X°" in labelCaps
- Heat-state ring: preserved amber/cyan color system (ring changes color per state)
- Pulse animation: preserved

### FloatingHeader (new)
- Floating pill: fixed, top: 16, left: 16, right: 16
- Height: 64dp, borderRadius: 16
- Background: `rgba(18,12,31,0.60)` + BlurView
- Border: `rgba(255,255,255,0.10)` 1px
- Left: MaterialIcons `blur-on` (primary color, 24sp)
- Center: "QUARTZIE" text bold tracking-[0.3em] color primaryContainer
- Right: MaterialIcons `account-circle` + StatusBadge pill

### FloatingTabBar (replaces ChromeTabBar)
- Floating pill: position absolute, bottom: 24, left: 24, right: 24
- Height: 80dp, borderRadius: 32
- Background: `rgba(18,12,31,0.80)` + BlurView
- Border: `rgba(255,255,255,0.05)` 1px + top `rgba(255,255,255,0.10)` 1px
- Shadow: `0 -10dp 40dp rgba(181,161,255,0.10)`
- Active icon: primaryContainer color + `drop-shadow` glow, scale 1.1
- Inactive icon: `rgba(255,255,255,0.30)`
- No text labels

## Navigation
New tab order (4 tabs):
1. `home` — icon: `flare`
2. `hub` (NEW) — icon: `diamond`
3. `presets` — icon: `auto-awesome`
4. `settings` — icon: `settings-input-component`

History: navigable via `router.push('/(connected)/history')` from Hub card; not a tab.

## Screens

### app/index.tsx (splash gate)
- Change "QuartzOS" wordmark → "QUARTZIE"
- Update background to `#120C1F`

### app/(connected)/home.tsx
- Add FloatingHeader (use across all screens)
- Add pulsing "LIVE SYNC" status pill (primary color dot + label)
- Replace TemperatureOrb with new amethyst orb
- 2-col grid: session time card + peak temp card (glass panels)
- Full-width range card: shows "Optimal Range: [dabTemp - 20]° – [dabTemp + 20]°" with gradient bar
- Remove: bottom ChromeButtons (Settings / Scan shortcuts)
- Bottom: FloatingTabBar

### app/(connected)/hub.tsx (NEW FILE)
- FloatingHeader
- Page header: h1 "Awaken the Device." subtitle
- Bento grid (single column on mobile, approximated):
  - Hero card: "Initialize Ritual" → pushes to home; amethyst gradient bg + crystal image placeholder
  - Presets card: → pushes to presets tab
  - History card: → pushes to history screen
  - Settings card: → pushes to settings tab
- FloatingTabBar

### app/(connected)/settings.tsx
- FloatingHeader
- Page header: display "Device Config" + subtitle
- Sections: "Thermal Limits", "Aura Core", "Haptics & Flow" (+ existing Sound/Phone Alerts sections)
- Thermal sliders: new SkeuSlider variant prop (dab=primary, dunk=secondary)
- Aura Core: 4 gem buttons (ruby/amethyst/emerald/sapphire) — visual only, sets existing display color slots
- Toggles: new CrystalToggle style
- FloatingTabBar

### app/(connected)/presets.tsx
- FloatingHeader
- Page header: display "Presets" + subtitle
- "CRYSTALLIZE NEW" glass button (replaces + FAB)
- Vertical slab gallery: each preset as tall card (300×500 approx)
  - Per-preset gem color (hash name to gem palette)
  - Inner radial glow matching gem color
  - Spinning dashed orbit ring (Reanimated rotation)
  - Preset name, description, dab temp badge, duration/ramp metadata
  - Edit/delete via long-press context or small action buttons
- FloatingTabBar

### app/(connected)/history.tsx
- FloatingHeader  
- Page header: "Session Logs" centered + subtitle
- Filter chips: All / High Temp / Low Temp (horizontal scroll)
- Session cards (glass):
  - Sparkline SVG with amethyst glow stroke (fiber-optic style)
  - Peak temp in display size
  - Category icon (derive from peak: >500=flare/Deep Focus, 400-500=auto-awesome/Flavor, <400=water_drop/Low Temp)
  - Duration + formatted date
  - Chevron to detail
- FloatingTabBar (hidden tab — no bottom nav shown on history since it's not a tab)

### Partial updates (brand + tokens only)
- `app/onboarding/permissions.tsx` — update "QuartzOS" text, apply tokens
- `app/onboarding/pair.tsx` — apply tokens
- `app/(modals)/scan.tsx` — apply tokens
- `app/(modals)/color-picker.tsx` — apply tokens
- `app/(modals)/notification-config.tsx` — update brand text, apply tokens
- `app/(connected)/presets/[id].tsx` — apply tokens
- `app/(connected)/history/[id].tsx` — apply tokens

## Dependencies to Install
- `@expo-google-fonts/space-grotesk`

## Brand Strings to Update
- `app/index.tsx`: "QuartzOS" → "QUARTZIE"
- `app/onboarding/permissions.tsx`: "QuartzOS reads..." → "Quartzie reads..."
- `app/(connected)/history.tsx`: Share title "QuartzOS Session History" → "Quartzie Session History"
- `src/notifications/backgroundTask.ts`: "QuartzOS Active" → "Quartzie Active", "QuartzOS is monitoring" → "Quartzie is monitoring"
- `app.json`: name "QuartzOS" → "Quartzie", iOS perm strings "QuartzOS" → "Quartzie"
