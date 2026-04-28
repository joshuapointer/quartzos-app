# Hybrid CI: Xcode Cloud + EAS Update

> **⚠️ Action required before this branch is functional.** The agent
> generated three GitHub Actions workflow files but could not push them
> into `.github/workflows/` — the harness PAT lacks GitHub's `workflow`
> scope. The finished workflow files are committed under
> `docs/ci/pending-workflows/`. You need to move them into place and
> push with credentials that carry `workflow` scope (any normal
> `git push` from your machine works). See
> [§ Activating the workflow files](#activating-the-workflow-files) below.

This repo's CI is split in two so that JS/asset-only changes ship in
seconds via EAS Update, while native-affecting changes get a fresh
`.ipa` from Xcode Cloud and land in TestFlight.

## Activating the workflow files

The three workflow files live at `docs/ci/pending-workflows/` instead of
`.github/workflows/` because the harness's PAT can't write to the
`workflow` scope. After pulling this branch locally:

```bash
git checkout claude/bootstrap-hybrid-ci-6bGMC && git pull
git rm .github/workflows/eas-build.yml
git mv docs/ci/pending-workflows/ci-router.yml          .github/workflows/ci-router.yml
git mv docs/ci/pending-workflows/xcode-cloud-trigger.yml .github/workflows/xcode-cloud-trigger.yml
git mv docs/ci/pending-workflows/eas-update.yml         .github/workflows/eas-update.yml
rmdir docs/ci/pending-workflows docs/ci 2>/dev/null
git commit -m "chore(ci): activate hybrid CI workflows"
git push
```

Once that lands, the path-filtered router runs on every push and
delete `eas-build.yml` (the old `eas build --local` workflow) is gone.

## Architecture

```
                   ┌──────────────┐
                   │  push / PR   │
                   └──────┬───────┘
                          ▼
              ┌───────────────────────┐
              │   ci-router.yml       │
              │   (paths-filter)      │
              └─────────┬─────────────┘
            ┌───────────┴────────────┐
            ▼                        ▼
   native_changed=true      js_changed=true
                            AND native_changed=false
            ▼                        ▼
xcode-cloud-trigger.yml         eas-update.yml
 (force-push to                  (eas update
  xcode-cloud-trigger/ios)        --branch <chan>)
            ▼                        ▼
      Xcode Cloud                Expo update servers
       → TestFlight              → installed clients
```

When BOTH filters fire, only the native path runs. The JS layer ships
on a follow-up commit (or a manual `eas update`) once the new binary
is live in TestFlight; OTA-ing against an in-flight binary is the #1
cause of "the update went out but the app didn't pick it up".

## What I (the agent) did

| File | Why |
| --- | --- |
| `ci_scripts/ci_post_clone.sh` | Xcode Cloud entry point. Installs Node via mise, CocoaPods, deps, runs `expo prebuild --platform ios --clean --no-install`, then `pod install`. Verifies `Expo.plist` carries the updates URL + runtime version. |
| `ci_scripts/ci_pre_xcodebuild.sh` | Stub for build-time mutations (build numbers, secret plists). |
| `ci_scripts/ci_post_xcodebuild.sh` | Stub. Includes a commented-out webhook for posting build status back to GitHub. |
| `plugins/with-ci-scripts-symlink.js` | Expo config plugin that creates `ios/ci_scripts -> ../../ci_scripts` during prebuild so Xcode Cloud finds the scripts at the path it expects, while the originals live at the repo root and survive `--clean`. |
| `app.json` | Registered `./plugins/with-ci-scripts-symlink` in `expo.plugins`. No other changes. |
| `eas.json` | Added `update` block with `production`/`preview`/`development` channels, mirroring the existing `build` profile channels. |
| `.nvmrc` | Pins Node 20 (matches what `eas-update.yml` was already using inline). Picked up by `mise` in `ci_post_clone.sh` and by `actions/setup-node@v4` in the workflows. |
| `.github/workflows/ci-router.yml` | New. Runs on every push/PR, classifies the diff via `dorny/paths-filter@v3`, and dispatches to the native or OTA workflow. |
| `.github/workflows/xcode-cloud-trigger.yml` | New. Force-pushes the current commit to `xcode-cloud-trigger/ios`. Posts a PR comment when run from a PR. |
| `.github/workflows/eas-update.yml` | Refactored. Was a top-level `on: push` workflow; now a `workflow_call`-only callee invoked by `ci-router.yml`. Branch→channel mapping (`main→production`, `preview→preview`, `develop(ment)→development`, `feature/*→development`, else ref) preserved from the prior version. |
| `.github/workflows/eas-build.yml` | **Deleted** per your decision. The previous workflow built `.ipa`s on a GitHub `macos-latest` runner via `eas build --local`; Xcode Cloud now owns the native build path. |

## What you must do (human)

### 1. Apple side
- In **App Store Connect → Apps**, ensure there's an iOS app record for bundle ID `com.quartzos.app`.
- Note your Apple Team ID — replace `<YOUR_TEAM_ID>` everywhere it appears below.

### 2. Xcode side (one-time, per platform)
1. Open Xcode, sign in to your Apple ID under **Settings → Accounts**.
2. Open the prebuilt project (`npx expo prebuild --platform ios` locally if `ios/` is not present, then `open ios/Quartzie.xcworkspace`).
3. **Product → Xcode Cloud → Create Workflow**.
4. Configure the workflow:
   - **Name**: `iOS — Trigger branch`
   - **Start Conditions → Branch Changes**: source branch `xcode-cloud-trigger/ios`, "Any change". Remove any default `main` trigger.
   - **Environment**: latest stable Xcode + macOS.
   - **Actions → Archive**:
     - Scheme: `Quartzie` (or whatever `expo prebuild` generated)
     - Platform: iOS
     - Distribution: App Store Connect (TestFlight)
   - **Post-Actions → TestFlight Internal Testing**: pick a tester group.
   - **Environment Variables** (case-sensitive):
     - `NPM_TOKEN` — only if you ever introduce a private registry; safe to leave unset today.
     - `EXPO_PUBLIC_*` — any client-visible env your app reads at runtime.
     - `TEAM_ID` = `<YOUR_TEAM_ID>` (some plugins want it).
5. Save. The first build will start when GitHub Actions next pushes to `xcode-cloud-trigger/ios`.

### 3. GitHub side
- **Repository secrets → Actions**:
  - `EXPO_TOKEN` — required by `eas-update.yml`. Generate at <https://expo.dev/accounts/joshpointer-dev/settings/access-tokens>.
  - `XCODE_CLOUD_TRIGGER_TOKEN` *(optional)* — only needed if your org policy disallows the default `GITHUB_TOKEN` from pushing branches. Otherwise leave unset; the workflow falls back to `GITHUB_TOKEN`.
- Confirm Actions is enabled for the repo (Settings → Actions → General → "Allow all actions and reusable workflows").
- **Branch protection on `main`** (recommended): require `CI router / Classify diff` to pass before merge.

### 4. Expo side
- `eas init` has already been run (project ID `bf01e852-e296-4c49-88e8-a9b709c17cab` is committed in `app.json`). Nothing to do.
- `expo-updates` is wired (`expo.updates.url`, `expo.updates.enabled`, `runtimeVersion.policy: "fingerprint"`). Nothing to do.
- If you ever want to flip the runtime-version policy to `appVersion` (looser — JS updates ride on top of any binary with the same marketing version), edit `app.json → expo.runtimeVersion`.

### 5. First-run validation
1. **JS-only push**: edit a file in `app/` or `src/`, push to a branch. Expect: `ci-router` → `eas-update.yml` runs, no Xcode Cloud activity.
2. **Native push**: bump a dep in `package.json`, push. Expect: `ci-router` → `xcode-cloud-trigger.yml` force-pushes `xcode-cloud-trigger/ios`, Xcode Cloud picks it up, builds, archives, and uploads to TestFlight.
3. **PR with native changes**: open a PR with a `package.json` change. Expect a bot comment "Native changes detected → Xcode Cloud build queued for: ios".

## Per-platform table

| Platform | Scheme | Bundle ID | Trigger branch | `EXPO_TV` | macOS strategy |
| --- | --- | --- | --- | --- | --- |
| iOS | `Quartzie` | `com.quartzos.app` | `xcode-cloud-trigger/ios` | unset | n/a |
| iPadOS | _disabled_ (`supportsTablet: false` in `app.json`) | — | — | — | — |
| tvOS | _not configured_ — would require migrating `react-native` → `react-native-tvos` | — | — | `1` | — |
| macOS | _not configured_ — pick Catalyst (flip an `app.json` flag) or `react-native-macos` (separate package, separate target) | — | — | — | TBD |

## Troubleshooting

- **`GetEnv.NoBoolean` patch-package note**: if you add `patches/` and a patch touches RN's env handling, ensure `EXPO_TV` is exported as a string (`export EXPO_TV=1`, not unset+set). The post-clone script already does this.
- **Symlink missing after prebuild**: the config plugin isn't registered. Confirm `app.json → expo.plugins` contains `"./plugins/with-ci-scripts-symlink"`. If you regenerate `app.json` from a tool, re-add it.
- **tvOS scheme builds for iOS**: `EXPO_TV` is not set per scheme. The `case "$CI_XCODEBUILD_SCHEME"` branch in `ci_post_clone.sh` keys off the scheme name — make sure the tvOS scheme contains `tvOS`, `TV`, or matches `Quartzie-TV`.
- **EAS Update went out but the app doesn't pick it up**: runtime-version mismatch. With `policy: "fingerprint"`, every native dep change bumps the fingerprint and the OTA bundle becomes incompatible with older binaries. The path filter routes those changes to Xcode Cloud — if you've manually edited `app.json` plugins or `package.json` deps and only ran the OTA path, you'll see this.
- **Xcode Cloud builds JS-only changes anyway**: the Xcode Cloud workflow is still pointing at `main` (or wherever) instead of `xcode-cloud-trigger/ios`. Re-check **App Store Connect → Xcode Cloud → Workflows → Start Conditions**.
- **Path-filter false negatives** (a native-touching file slipped through to OTA): add the path to the `native:` block in `.github/workflows/ci-router.yml`. Order matters — paths are matched against the first filter that lists them, and `native:` is declared first.
- **"`actions/checkout@v4` failed with token permission denied"** from `xcode-cloud-trigger.yml`: your repo settings restrict `GITHUB_TOKEN` write access. Either flip Settings → Actions → General → Workflow permissions to "Read and write", or create `XCODE_CLOUD_TRIGGER_TOKEN` (PAT with `contents:write` on this repo).

## Cost expectations

- **Xcode Cloud**: Apple Developer Program includes 25 compute hours/month free. A clean Quartzie build is roughly 6–10 minutes; with the trigger-branch pattern you only pay when native paths actually change, so 25 h/month covers heavy iteration.
- **EAS Update**: free tier is 1,000 MAU + unlimited updates for personal/individual usage (check current Expo pricing — they revise periodically).
- **GitHub Actions**: the router runs on `ubuntu-latest`, which is free for public repos and generous for private ones. The `eas-update.yml` Linux job is the only meaningful spend.
