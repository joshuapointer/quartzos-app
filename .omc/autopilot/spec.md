# Quartzos App Redesign Spec v2
# Source: Brainstorming session 2026-04-25

## Design Decisions

### Navigation: Single screen + bottom sheet
- Remove Hub tab entirely (delete hub.tsx)
- Replace Tabs navigation with Stack (single visible screen)
- Main screen = live instrument view, always
- Bottom sheet slides up from bottom, three tabs: Presets / History / Configure
- No floating tab bar (replaced by bottom sheet)
- FloatingHeader: keep but simplify — no Hub navigation needed

### Theme System: Three named themes
Default: `warm-mineral`

**warm-mineral** (default)
- bgDeep: #0E0B08
- surface1: #171009
- surface3: #22180D
- surface6: #302212
- glassFill: rgba(30,18,8,0.45)
- glassBorder: rgba(210,185,145,0.10)
- primary: #D2B990 (warm gold)
- primaryContainer: #E8D0A8
- onSurface: #F5EBD8
- onSurfaceVariant: #C4AD8A
- outline: #8C7458

**smoke**
- bgDeep: #0D0918
- surface1: #110C1D
- surface3: #1A1528
- surface6: #2E2840
- glassFill: rgba(18,12,31,0.40)
- glassBorder: rgba(207,193,255,0.10)
- primary: #b5a1ff
- primaryContainer: #cfc1ff
- onSurface: #e9def9
- onSurfaceVariant: #cac4d3
- outline: #938e9c

**cool-shell**
- bgDeep: #0B0B12
- surface1: #0F0F1A
- surface3: #181826
- surface6: #272738
- glassFill: rgba(15,15,26,0.45)
- glassBorder: rgba(160,160,220,0.09)
- primary: #B4B4DC
- primaryContainer: #CACAEE
- onSurface: #DCDCF0
- onSurfaceVariant: #9898C0
- outline: #6868A0

Heat state colors CONSTANT across all themes:
- idle: rgba(140,180,255,0.5)
- heating: #FFA93C
- glow: #FFD27A
- ready: #5AD9FF (dunk)
- cooling: rgba(212,106,11,0.55)

Gem colors CONSTANT:
- ruby: #ff4d6d, amethyst: #b5a1ff, emerald: #06d6a0, sapphire: #60a5fa, citrine: #fbbf24

### Main Screen Layout
Top to bottom:
1. Ambient status row: colored dot + "Live" / "Connecting" / "Offline" (labelCaps, centered)
2. TemperatureOrb (keep existing Skia component — preserve ALL depth/gloss/pulse/heat state)
3. DataStrip: one frosted horizontal band — Session | Peak | Target (no cards)
4. PresetPill: gem dot + preset name + "Change" chevron (taps to sheet Presets tab)
5. Bottom sheet in PEEK state (drag handle visible + ~180px of content)

REMOVE: 2-column square card grid, Optimal Range card

### Bottom Sheet
- Snap points: PEEK (screen height - 180px from bottom), FULL (safe area top + 8px)
- PanGesture + withSpring for snapping
- BlurView + glassFill background
- Drag handle at top
- Tab bar: Presets | History | Configure (text, labelCaps style)
- Active tab underline indicator (primary color)
- Tab content area scrolls independently

### Copy Voice: Precise and calm
Remove all spiritual/woo microcopy:
- Hub screen entirely deleted (was: "Awaken the Device", "Select your state of resonance", "Initialize Ritual")  
- Presets subtitle: nothing (remove "Your saved transcendental states.")
- New preset button: "+ New Preset" (was: "+ Crystallize New")
- Settings subtitle: nothing (remove "Calibrate your rig parameters.")
- Status: "Live" / "Connecting" / "Offline" (was: "LIVE SYNC")
- Session categories: rename to functional names (see History section)

### History Tab
- Same data/logic
- Session categories by peak temp:
  - ≥500°F: "High Temp" (was "DEEP FOCUS")
  - 400-499°F: "Mid Temp" (was "RESTORATION")
  - <400°F: "Low Temp" (unchanged)
- Subtitle removed

### Configure Tab (replaces Settings screen)
Sections:
1. Temperatures — Dab Alarm slider, Dunk Alarm slider, unit toggle, quick defaults
2. Device — Opaque Mode, Sound Alert, Light Alert, LED Guide, Night Mode toggles
3. Sound — Volume slider, Key Tone, Dab Sound, Dunk Sound
4. Alerts — Configure Phone Alerts button
5. Appearance — Theme picker (3 options), °F/°C also lives here
6. Sync status + Save button at bottom

### Theme Picker Component
Three tappable tiles in Appearance section:
- Each shows: small phone icon with that theme's color palette
- Selected tile gets primary-color border
- Labels: "Warm Mineral" / "Smoke" / "Cool Shell"

## File Plan

### New Files
- src/design/themes.ts — ThemeName type + three theme objects
- src/design/ThemeContext.tsx — ThemeProvider + useTheme hook
- src/design/components/MainBottomSheet.tsx — full sheet implementation
- src/design/components/DataStrip.tsx — session/peak/target strip
- src/design/components/PresetPill.tsx — active preset indicator
- src/design/components/ThemePicker.tsx — three-tile theme selector

### Modified Files
- src/design/tokens.ts — add ThemeName + make surface/bg/glass tokens reference theme
- src/state/settingsStore.ts — add `theme: ThemeName` field, persist via MMKV
- app/(connected)/_layout.tsx — change Tabs → Stack (single screen)
- app/(connected)/home.tsx — full redesign per layout above
- app/(connected)/presets.tsx — adapt for bottom sheet tab (remove SafeAreaView top padding)
- app/(connected)/history.tsx — adapt for bottom sheet tab, update copy
- app/(connected)/settings.tsx — adapt for bottom sheet Configure tab, add Appearance section
- app/_layout.tsx — wrap with ThemeProvider

### Deleted Files
- app/(connected)/hub.tsx
