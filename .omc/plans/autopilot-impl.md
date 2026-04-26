# EAS Updates Per-Branch — Implementation Plan (2026-04-26)

## Task 1: Install expo-updates
- Run `npx expo install expo-updates`
- Verify it appears in package.json dependencies

## Task 2: Update app.json
Add inside `"expo"` object:
```json
"updates": {
  "url": "https://u.expo.dev/bf01e852-e296-4c49-88e8-a9b709c17cab",
  "enabled": true,
  "fallbackToCacheTimeout": 0
},
"runtimeVersion": {
  "policy": "fingerprint"
}
```

## Task 3: Update eas.json
Add `"channel"` to each build profile:
- `development` → `"channel": "development"`
- `preview` → `"channel": "preview"`
- `production` → `"channel": "production"`

## Task 4: Create .github/workflows/eas-update.yml
New workflow that:
- Triggers on push to any branch
- Installs deps, sets up EAS
- Runs `eas update --branch ${{ github.ref_name }} --message "${{ github.event.head_commit.message }}" --non-interactive`
- For main branch only: also runs `eas channel:edit production --branch main --non-interactive`

## Task 5: Create docs/eas-updates-guide.html
Single-page visual reference with:
- Flow diagram: git push → GitHub Action → EAS Update → device
- Channel/branch routing table
- Quick-reference commands
- Warm obsidian aesthetic matching the app design language
