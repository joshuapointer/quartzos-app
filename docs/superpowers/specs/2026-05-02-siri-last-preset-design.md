# Siri App Intents for Quartzie — Design

**Date:** 2026-05-02
**Status:** Approved (autopilot path)

## Goal

Let a user say "Hey Siri, start my dab" (or pick from Shortcuts.app) and have Quartzie:

1. Apply the user's last-completed preset's settings to the Dab Rite over BLE.
2. Foreground the app at the heating/home screen.

Plus three companion intents: start with a named preset, open history, open presets.

## Approach

**A. Deep-link bridge with shared App Group catalog.**

```
┌──────────────┐  open URL   ┌──────────────┐  Linking   ┌──────────────────┐
│  AppIntent   │ ──────────► │ quartzos://  │ ─────────► │ Linking handler  │
│  (Swift)     │             │ intent/...   │            │ in _layout.tsx   │
└──────────────┘             └──────────────┘            └──────┬───────────┘
       ▲                                                         │
       │ reads catalog,                                           │ router.push
       │ lastPresetId                                             ▼
┌──────┴────────────┐         ┌────────────────────────────────────────┐
│ App Group         │ ◄────── │ siriBridge native module               │
│ UserDefaults      │  writes │ (exposed via local Expo module)        │
│ (group.com.       │         │ Called from src/db/presets.ts +        │
│  quartzos.app)    │         │ src/db/sessions.ts                     │
└───────────────────┘         └────────────────────────────────────────┘
```

## Why this approach

- **Business logic stays in JS.** BLE protocol, calibration, alarm validation, preset model — all of it lives in TypeScript today. Re-implementing in Swift would be untenable.
- **The user wants the app foregrounded anyway** ("apply preset + open the heating screen"). So the cost of "must launch the app" is zero.
- **Two layers, one mirror.** SQLite stays the source of truth; the App Group is a thin read-only mirror for Swift. JS pushes on every change.
- **Deep links already exist.** `app.json` declares `scheme: "quartzos"`; the only missing piece is a top-level Linking handler.

## Intents

| Intent | Phrase | Parameter | Effect |
|---|---|---|---|
| `StartLastSessionIntent` | "Start my dab" | none | Reads `lastPresetId` from App Group → opens `quartzos://intent/start-session?presetId=<id>` |
| `StartSessionWithPresetIntent` | "Start a ${preset} session" | `preset: PresetEntity` | Opens `quartzos://intent/start-session?presetId=<entity.id>` |
| `OpenHistoryIntent` | "Open Quartzie history" | none | Opens `quartzos://intent/open?screen=history` |
| `OpenPresetsIntent` | "Open Quartzie presets" | none | Opens `quartzos://intent/open?screen=presets` |

## Data flow

### JS → App Group (writes)

- After every `presets.create | update | remove | seedBuiltins`: serialize `[{id, name}]` and write to `presetCatalog`.
- In `sessions.end()`: when the session row has a `presetId`, write it to `lastPresetId`.

### App Group → Swift (reads)

- `PresetEntity.EntityQuery.suggestedEntities()` returns the catalog.
- `StartLastSessionIntent.perform()` reads `lastPresetId`.

### Swift → JS (deep links)

- All four intents conform to `OpensIntent` semantically (`openAppWhenRun = true`) and resolve a URL via `EnvironmentValues.openURL`.

### JS → routing (Linking)

- `app/_layout.tsx` adds `Linking.addEventListener('url', handle)` plus `Linking.getInitialURL()` for cold launch.
- Handler is a pure function in `src/utils/intentRouter.ts` that maps URL → `router.push(...)` action.
- For `start-session`, target is `/(connected)/home?applyPreset=<id>` so home.tsx's existing `handleApplyPreset` runs.

### home.tsx applyPreset trigger

- New `useLocalSearchParams<{ applyPreset?: string }>()` read.
- New effect: when `applyPreset` is present and `presets` array is non-empty, look up the preset and call `handleApplyPreset(preset)`. Then `router.setParams({ applyPreset: undefined })` to prevent re-fire.

## Module layout

```
modules/quartzie-siri-bridge/
├── package.json
├── expo-module.config.json
├── tsconfig.json
├── index.ts                              # public JS API
├── src/
│   ├── QuartzieSiriBridgeModule.ts       # native module typed handle
│   └── types.ts
├── ios/
│   ├── QuartzieSiriBridge.podspec
│   ├── QuartzieSiriBridgeModule.swift    # Expo module
│   └── Intents/
│       ├── SharedDefaults.swift
│       ├── PresetEntity.swift
│       ├── StartLastSessionIntent.swift
│       ├── StartSessionWithPresetIntent.swift
│       ├── OpenHistoryIntent.swift
│       ├── OpenPresetsIntent.swift
│       └── QuartzieAppShortcuts.swift
└── plugin/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts                      # withEntitlementsPlist + withInfoPlist
```

Plus:
- `app.json` — register the plugin
- `ios/Quartzie/Quartzie.entitlements` — add App Group (committed; plugin re-adds on prebuild --clean)
- `ios/Quartzie.xcodeproj/project.pbxproj` — bump deployment target to 26.0

## Edge cases

- **No completed session yet** → `StartLastSessionIntent.perform()` throws a localized dialog.
- **Catalog empty** → `PresetEntity` query returns `[]`. Siri responds with "I couldn't find any presets in Quartzie."
- **BLE not connected** → existing `handleApplyPreset` toast: "Couldn't reach the rig." User taps Retry.
- **Cold launch with deep link** → `getInitialURL` resolves after `dbReady`; we route once DB is ready.
- **Preset deleted between catalog sync and intent fire** → home.tsx applyPreset effect logs and bails when lookup fails.
- **Same intent fired twice rapidly** → param-clearing in home.tsx prevents double-apply.

## Out of scope

- Voice-controlled session readout
- Live Activities / Dynamic Island integration
- Watch app
- Android Assistant equivalents
