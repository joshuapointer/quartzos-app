# EAS Updates Per-Branch Design

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Publish OTA (over-the-air) JS/asset updates automatically on every git branch push, targeting both development and preview installed builds — without consuming EAS Build credits.

## Architecture

### Core Concept

EAS Update has two layers:
- **Branch** — a named stream of updates (e.g., `quartzie`, `main`, `fix/dial-bug`)
- **Channel** — baked into the build at compile time (e.g., `development`, `preview`, `production`). A channel points to one branch at a time.

Every git branch push publishes to an EAS branch of the same name. Channels are not auto-rerouted (avoids last-push-wins chaos with parallel branches). Exception: `production` channel is always auto-pointed at `main` on every push to `main`.

### Channel → Branch Routing

| Build Profile | Channel (baked in) | Default Branch | Reroute to test |
|---|---|---|---|
| development | `development` | last set manually | `eas channel:edit development --branch <name>` |
| preview | `preview` | last set manually | `eas channel:edit preview --branch <name>` |
| production | `production` | `main` (auto) | — |

### Runtime Version Strategy

Use `"policy": "fingerprint"` — Expo computes a fingerprint of native dependencies automatically. Updates are only delivered to builds whose native fingerprint matches, preventing JS/native mismatches. No manual version bumping required.

## Components Changed

### 1. `package.json`
Install `expo-updates`.

### 2. `app.json`
Add under `"expo"`:
```json
"updates": {
  "url": "https://u.expo.dev/<project-id>",
  "enabled": true,
  "fallbackToCacheTimeout": 0
},
"runtimeVersion": {
  "policy": "fingerprint"
}
```

### 3. `eas.json`
Add `channel` to each build profile:
```json
"development": { ..., "channel": "development" },
"preview": { ..., "channel": "preview" },
"production": { ..., "channel": "production" }
```

### 4. `.github/workflows/eas-update.yml` (new file)
- Triggers on push to **any branch**
- Runs `eas update --branch <git-branch-name> --message "<commit-message>"`
- For pushes to `main` only: also runs `eas channel:edit production --branch main` to keep production auto-following main
- Uses existing `EXPO_TOKEN` secret
- Does NOT trigger EAS Build — no build credits consumed

### 5. `docs/eas-updates-guide.html` (new file)
Single-page visual reference showing the full flow, channel/branch mapping table, and quick-reference commands.

## Existing Workflow

`.github/workflows/eas-build.yml` is left **unchanged**. It handles full native builds (manual/production only) and is separate from OTA updates.

## Quick Reference (Post-Setup)

```bash
# Test feature branch on dev build
eas channel:edit development --branch your-branch-name

# Test feature branch on preview build  
eas channel:edit preview --branch your-branch-name

# See what each channel is pointing at
eas channel:list

# See all published branches
eas branch:list
```

## What Does NOT Change

- Native code changes still require a new EAS Build
- The existing `eas-build.yml` workflow is untouched
- No new EAS Build credits are consumed by OTA updates
