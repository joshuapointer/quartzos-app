#!/usr/bin/env bash
#
# Xcode Cloud pre-xcodebuild hook. Runs after dependencies are resolved
# but before xcodebuild starts. Stub for now.
#
# Add things here that need to mutate the workspace immediately before
# the build (e.g. injecting build numbers, writing GoogleService-Info.plist
# from a secret, etc.).

set -euo pipefail
set -x

if [[ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]]; then
  cd "$CI_PRIMARY_REPOSITORY_PATH"
else
  cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

echo "===== ci_pre_xcodebuild.sh completed at $(date -u +%FT%TZ) ====="
