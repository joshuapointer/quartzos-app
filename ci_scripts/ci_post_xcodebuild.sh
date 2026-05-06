#!/usr/bin/env bash
#
# Xcode Cloud post-xcodebuild hook. Stub.
#
# To plumb Xcode Cloud build status back into GitHub Actions (so the
# router workflow can know when the native build finished), uncomment
# the block below and configure GITHUB_STATUS_WEBHOOK_URL +
# GITHUB_STATUS_WEBHOOK_SECRET as Xcode Cloud env vars.
#
# Recommended receiver: a GitHub repository_dispatch event handler in a
# workflow that listens for { event_type: "xcode-cloud-status" }.

set -euo pipefail
set -x

if [[ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]]; then
  cd "$CI_PRIMARY_REPOSITORY_PATH"
else
  cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

# # --- Optional: notify GitHub when the build finishes ---
# if [[ -n "${GITHUB_STATUS_WEBHOOK_URL:-}" && -n "${GITHUB_STATUS_WEBHOOK_SECRET:-}" ]]; then
#   STATUS="${CI_XCODEBUILD_EXIT_CODE:-unknown}"
#   PAYLOAD="$(printf '{"event_type":"xcode-cloud-status","client_payload":{"workflow":"%s","scheme":"%s","status":"%s","commit":"%s","build_number":"%s"}}' \
#     "${CI_WORKFLOW:-}" \
#     "${CI_XCODEBUILD_SCHEME:-}" \
#     "$STATUS" \
#     "${CI_COMMIT:-}" \
#     "${CI_BUILD_NUMBER:-}")"
#   curl -fsSL -X POST \
#     -H "Authorization: Bearer ${GITHUB_STATUS_WEBHOOK_SECRET}" \
#     -H "Accept: application/vnd.github+json" \
#     -H "Content-Type: application/json" \
#     -d "$PAYLOAD" \
#     "$GITHUB_STATUS_WEBHOOK_URL"
# fi

echo "===== ci_post_xcodebuild.sh completed at $(date -u +%FT%TZ) ====="
