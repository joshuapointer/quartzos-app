#!/usr/bin/env bash
#
# Xcode Cloud post-clone hook.
#
# Lives at the REPO ROOT (not ios/) so `expo prebuild --clean` does not
# nuke it. A symlink at ios/ci_scripts -> ../../ci_scripts is created by
# plugins/with-ci-scripts-symlink.js during prebuild.
#
# Responsibilities:
#   1. Land in the repo root regardless of where Xcode Cloud puts us.
#   2. Install Node (via mise, pinned to .nvmrc).
#   3. Install CocoaPods if missing.
#   4. Materialize an authenticated .npmrc if NPM_TOKEN is set.
#   5. Install JS deps using the detected package manager.
#   6. (tvOS only) export EXPO_TV=1 based on $CI_XCODEBUILD_SCHEME.
#   7. Run `expo prebuild` to generate ios/ from app.json.
#   8. Run `pod install`.
#   9. Sanity-check expo-updates wiring (Expo.plist).
#  10. Print a unique marker so we can grep build logs.

set -euo pipefail
set -x

# ---------------------------------------------------------------------------
# 1. Land in the repo root.
# ---------------------------------------------------------------------------
if [[ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]]; then
  cd "$CI_PRIMARY_REPOSITORY_PATH"
else
  # Fallback: this script lives at <repo>/ci_scripts/ci_post_clone.sh.
  cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi
echo "Working directory: $(pwd)"

# ---------------------------------------------------------------------------
# 2. Install Node via mise.
# ---------------------------------------------------------------------------
if ! command -v mise >/dev/null 2>&1; then
  brew install mise
fi
eval "$(mise activate bash)"

NODE_VERSION="$(cat .nvmrc 2>/dev/null || echo 20)"
mise use --global "node@${NODE_VERSION}"
mise install
node --version
npm --version

# ---------------------------------------------------------------------------
# 3. CocoaPods.
# ---------------------------------------------------------------------------
if ! command -v pod >/dev/null 2>&1; then
  brew install cocoapods
fi
pod --version

# ---------------------------------------------------------------------------
# 4. Authenticated .npmrc (no-op if NPM_TOKEN unset).
# ---------------------------------------------------------------------------
if [[ -n "${NPM_TOKEN:-}" ]]; then
  # Append auth WITHOUT clobbering the committed .npmrc (which carries
  # legacy-peer-deps=true).
  if ! grep -q "//registry.npmjs.org/:_authToken" .npmrc 2>/dev/null; then
    echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" >> .npmrc
  fi
fi

# ---------------------------------------------------------------------------
# 5. Install JS deps based on the lockfile.
# ---------------------------------------------------------------------------
if [[ -f pnpm-lock.yaml ]]; then
  corepack enable
  pnpm install --frozen-lockfile
elif [[ -f yarn.lock ]]; then
  corepack enable
  yarn install --frozen-lockfile
elif [[ -f package-lock.json ]]; then
  npm ci --legacy-peer-deps
else
  echo "No lockfile found; falling back to npm install" >&2
  npm install --legacy-peer-deps
fi

# ---------------------------------------------------------------------------
# 6. Per-scheme env (tvOS).
#    The repo currently ships iOS only; this branch is a forward-compat hook.
# ---------------------------------------------------------------------------
case "${CI_XCODEBUILD_SCHEME:-}" in
  *tvOS*|*TV*|Quartzie-TV)
    export EXPO_TV=1
    echo "tvOS scheme detected; EXPO_TV=1"
    ;;
  *)
    : "iOS scheme; EXPO_TV unset"
    ;;
esac

# ---------------------------------------------------------------------------
# 7. Prebuild ios/ from app.json. --no-install because we will run pod
#    install ourselves with explicit logging.
# ---------------------------------------------------------------------------
npx expo prebuild --platform ios --clean --no-install

# ---------------------------------------------------------------------------
# 8. CocoaPods install.
# ---------------------------------------------------------------------------
pushd ios >/dev/null
pod install --repo-update
popd >/dev/null

# ---------------------------------------------------------------------------
# 9. Verify expo-updates is wired in Expo.plist.
#    runtimeVersion in this repo is { policy: "fingerprint" }, so prebuild
#    computes the fingerprint and writes it into Expo.plist. We only check
#    that the file exists and has the expected keys.
# ---------------------------------------------------------------------------
if grep -q "\"expo-updates\"" package.json; then
  EXPO_PLIST="$(find ios -name 'Expo.plist' -print -quit)"
  if [[ -z "$EXPO_PLIST" ]]; then
    echo "ERROR: expo-updates installed but Expo.plist not generated" >&2
    exit 1
  fi
  echo "Expo.plist found at: $EXPO_PLIST"
  /usr/libexec/PlistBuddy -c "Print :EXUpdatesURL" "$EXPO_PLIST" || {
    echo "ERROR: EXUpdatesURL missing from Expo.plist" >&2
    exit 1
  }
  /usr/libexec/PlistBuddy -c "Print :EXUpdatesRuntimeVersion" "$EXPO_PLIST" || {
    echo "ERROR: EXUpdatesRuntimeVersion missing from Expo.plist" >&2
    exit 1
  }
fi

# ---------------------------------------------------------------------------
# 10. Marker.
# ---------------------------------------------------------------------------
echo "===== ci_post_clone.sh completed at $(date -u +%FT%TZ) ====="
