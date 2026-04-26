# Quartzos Redesign v2 — Implementation Plan (2026-04-25)
# SUPERSEDES previous plan — new architecture: single screen + bottom sheet

## Phase 1: Foundation (sequential)

### 1A: Install dependencies
- `npx expo install @expo-google-fonts/space-grotesk`

### 1B: Update tokens.ts
- Complete token overhaul per spec
- Add gem palette, heat-state colors, glass tokens
- Keep spacing/radius/animation/shadow structure

### 1C: Update app.json + app/_layout.tsx
- Change app name "QuartzOS" → "Quartzie"
- Update splash background #0A1F3D → #120C1F
- Update contentStyle backgroundColor
- Update iOS permission strings

## Phase 2: Shared Components (parallel)

### 2A: Background + Card components
- Rewrite QuartzBackground → AuraBackground (2 aura blobs, noise)
- Refactor GlassCard (glassFill, glassBorder, remove skeu chrome)
- Delete BevelFrame + GlossOverlay (keep file, remove content, export null/empty)

### 2B: Button + Toggle + Slider
- Rewrite ChromeButton → GlassButton (amethyst variants)
- Refactor CrystalToggle (amethyst active state)
- Refactor SkeuSlider (add variant prop: 'primary'|'secondary')

### 2C: TemperatureOrb
- Major rewrite: amethyst orb with refraction rings
- Preserve heat-state color ring system
- Update text rendering (solid white, no gradient)

### 2D: Shared FloatingHeader + FloatingTabBar
- Create new FloatingHeader component
- Rewrite ChromeTabBar → FloatingTabBar (pill, blur, amethyst icons)
- StatusBadge: move into FloatingHeader right side

## Phase 3: Navigation + Core Screens (parallel after Phase 2)

### 3A: Navigation (_layout.tsx)
- Replace ChromeTabBar with FloatingTabBar
- Add hub tab
- Remove history from tabs (keep route)
- New tab order: home/hub/presets/settings

### 3B: Home screen
- Apply new layout: FloatingHeader + pulsing status + new orb + data cards grid
- Remove bottom action buttons

### 3C: Hub screen (new file)
- Create app/(connected)/hub.tsx
- Bento grid navigation cards
- Register in tab layout

### 3D: Settings screen
- New section layout, gem picker, updated sliders+toggles

### 3E: Presets screen
- Slab gallery layout with gem colors and orbit animation

### 3F: History screen
- Session cards with sparkline + filter chips

## Phase 4: Secondary Screens + Brand Rename (parallel)

### 4A: Brand rename
- Update all "QuartzOS" → "Quartzie" user-facing strings
- src/notifications/backgroundTask.ts
- history.tsx Share title
- permissions.tsx body copy
- index.tsx wordmark

### 4B: Remaining screens (token swap + structural consistency)
- onboarding/permissions.tsx + pair.tsx
- modals/scan.tsx, color-picker.tsx, notification-config.tsx
- presets/[id].tsx + history/[id].tsx
- Apply new color tokens and FloatingHeader where appropriate

## Phase 5: Font Integration
- Add `useFonts` call in app/_layout.tsx (after db/notifications init)
- Thread `fontFamily: 'SpaceGrotesk_400Regular'` etc. into token system
- Fallback: system font if fonts not loaded
