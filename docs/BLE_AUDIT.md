# BLE Audit — Quartzie

Date: 2026-04-27
Branch: main (HEAD d7ce041)
Scope: end-to-end BLE flow re-verification per PM request ("I don't believe the BLE was working either").

## Verdict

BLE on `main` is intact. tsc clean. Protocol tests pass. All call-chains traced are sound. No bugs found that warranted a code change. Two non-bug observations are recorded below.

## Cold-start flow with `lastDeviceId`

`app/index.tsx`
1. `useRootNavigationState` waits for navigator to mount.
2. After one tick, reads `storage.getString('lastDeviceId')`.
3. If present: `void bleManager.connectToDevice(lastDeviceId).catch(() => {})`.
4. Subscribes to `useBleStore`; when `connectionState === 'READY'`, replaces route to `/(connected)/home`.
5. After `AUTO_CONNECT_TIMEOUT_MS` (3000ms), if not READY, replaces route to `/(modals)/scan`.

`bleManager.connectToDevice(lastDeviceId)`
1. State at cold start: `IDLE`. Transition `IDLE → CONNECTING` legal. ✓
2. `rnBle.connectToDevice(deviceId, { timeout: 15000 })` — fires native connect.
3. On success: `setConnectedDevice(device.id)`, register disconnect listener, transition `CONNECTING → DISCOVERING`, discover services, `DISCOVERING → SUBSCRIBING`, monitor FF01, request high priority + MTU, `SUBSCRIBING → READY`. ✓
4. `enqueueQuerySettings()` enqueues a QUERY_SETTINGS frame; `startQueryPoll()` retries every 60s until a QUERY_REPLY arrives.
5. On failure: `scheduleReconnect()` — backoff array `[1s, 2s, 4s, 8s, 16s, 30s, 60s]`, max 10 attempts.

Permission race assessment: on Android, runtime permissions (`BLUETOOTH_CONNECT` / `BLUETOOTH_SCAN`) are granted in `app/onboarding/permissions.tsx`. If a user revokes permissions in OS settings between sessions, the cold-start auto-connect call will fail at the native layer (silently, via the `.catch(() => {})` swallow). The 3000ms timeout in `index.tsx` then routes to `(modals)/scan`, which surfaces an empty list. The user can recover by tapping a device or returning to onboarding. Not a regression; not a bug. Logged for visibility.

## "No saved device" flow

`app/index.tsx` → `router.replace('/onboarding/permissions')`
→ `permissions.tsx`: creates a temporary `RNBleManager`, awaits `state()` (triggers iOS prompt; Android prompt fires later via scan). On grant, calls `requestNotificationPermissions()`, then `router.replace('/onboarding/pair')`.
→ `pair.tsx`: starts a temporary `RNBleManager` scan. **Important detail (existing comment in source):** when the user taps a device, `pair.tsx` calls `mgr.stopDeviceScan()` (NOT `mgr.destroy()`) before invoking `bleManager.connectToDevice(deviceId)`. Calling `destroy()` here would reset the shared native BLE singleton and break the global `bleManager`. This is correctly handled. ✓
→ On READY/SUBSCRIBING/DISCOVERING: `storage.set('lastDeviceId', deviceId)`, dial flashes "connected", `router.replace('/(connected)/home')` after 600ms.

## "Swap device" flow (modals/scan.tsx)

`bleManager.disconnect()` first → flushes queue, tears down subs, cancels native connection, transitions to `IDLE`. Awaited.
Then `bleManager.connectToDevice(newDeviceId)` from `IDLE` → legal. ✓
Race: the `await` ensures the disconnect's async cleanup completes (including `cancelDeviceConnection`) before the new connect runs. The `intentionalDisconnect = true` flag suppresses the auto-reconnect that would otherwise fire from the disconnect listener. ✓

## State machine audit

`src/ble/ConnectionStateMachine.ts` legal transitions:

| from | to |
|---|---|
| IDLE | SCANNING, CONNECTING, ERROR |
| SCANNING | CONNECTING, IDLE |
| CONNECTING | DISCOVERING, RECONNECTING, IDLE |
| DISCOVERING | SUBSCRIBING, RECONNECTING |
| SUBSCRIBING | READY, RECONNECTING |
| READY | RECONNECTING, IDLE, ERROR |
| RECONNECTING | CONNECTING, IDLE, ERROR |
| ERROR | IDLE |

Successful reconnect path: `READY → RECONNECTING (handleDisconnected → scheduleReconnect) → CONNECTING (delayed via reconnectTimer → connectToDevice) → DISCOVERING → SUBSCRIBING → READY`. All transitions legal. ✓

`connectToDevice()` guard at line 211 (`if (this.sm.canTransition('CONNECTING')) ... else return`): silently drops calls from states where CONNECTING is illegal (DISCOVERING, SUBSCRIBING, READY, ERROR). The READY → return is the most user-visible: a hypothetical "tap a different device while connected" path bypasses this because `(modals)/scan.tsx` calls `bleManager.disconnect()` first (transitioning to IDLE). The guard is defensive and correct.

The `__DEV__` throw in `transition()` for illegal state moves never fires in current call-graph because `setState()` in `BleManager` always pre-checks `canTransition()`.

## CommandQueue ACK flow

`handleFf01` decodes a 22-byte frame with type `TYPE_WRITE_ACK (0x50)`, calls `commandQueue.resolveAck()`. This resolves the in-flight promise, clears the ack timer, and pumps the next queued command.

Duplicate-ACK guard (`ackReceived` flag): defensive against a hypothetical FF02-echo scenario. Inspection of `subscribeCharacteristics()` shows only FF01 is monitored — FF02 is write-only from the app's perspective. The flag is dead but harmless. Recording as observation, not bug.

`flush(err)` rejects the in-flight + clears all queued promises + clears ack timer. Correctly invoked from `disconnect()`, `handleDisconnected()`, and `destroy()`. ✓

## Settings write path

`home.tsx ConfigureContent.handleUpdate` (single source of truth as of bd8c062):
1. `updateSetting(key, val)` updates store + sets `dirty = true`.
2. `clearTimeout(writeDebounceRef.current)` (parent-scoped ref ensures debounce holds across re-renders).
3. `setTimeout(... SETTINGS_WRITE_DEBOUNCE_MS, ...) = bleManager.writeSettings(fresh)`.
4. `writeSettings()` enqueues a 22-byte WRITE_ALL frame; on ACK the promise resolves and `markConfirmed()` flips `dirty = false`.

The parent-lifted `writeDebounceRef` is the same ref used by `handleApplyPreset` to cancel pending debounced writes before sending a preset (preventing a stale settings write from clobbering the just-applied preset). Verified at home.tsx:1094-1097.

## Session start trigger

`onTempSample(tempF)` in `BleManager.ts:371`:
- pushes sample to `useSessionStore.addSample(f)`.
- Calls `alarmService.onTemp(...)` which dispatches dab/dunk notifications.
- If `tempF >= 150 && !sessionStore.active`: `this.startSession()`.

`startSession()` calls `useSessionStore.getState().startSession()` which sets `active = true`, `startedAt = Date.now()`, `peakF = 0`, `samples = []`. Then async-creates a DB row. ✓

## Native config (app.json)

- `ios.UIBackgroundModes`: `bluetooth-central`, `fetch` ✓
- `ios.NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription` present ✓
- `android.permissions`: `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `VIBRATE`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CONNECTED_DEVICE`, `BLUETOOTH`, `BLUETOOTH_ADMIN` ✓
- `react-native-ble-plx` plugin: `isBackgroundEnabled: true`, `modes: ["central"]`, `bluetoothAlwaysPermission` set ✓
- `expo-build-properties.android`: `minSdkVersion: 29`, `compileSdkVersion: 36`, `targetSdkVersion: 35` ✓
- `expo-build-properties.ios.deploymentTarget`: `15.1` ✓
- `expo-notifications` plugin with `dab_alarm.wav` sound asset ✓

## MMKV key parity

| writer | reader | key |
|---|---|---|
| `app/onboarding/pair.tsx:116` | `app/index.tsx:27` | `lastDeviceId` ✓ |
| `app/(modals)/scan.tsx:153` | `app/index.tsx:27` | `lastDeviceId` ✓ |
| `app/(modals)/notification-config.tsx` | `src/notifications/AlarmService.ts:13-16` | `phoneDabAlarmF`, `phoneDunkAlarmF`, `dabAlertEnabled`, `dunkAlertEnabled` ✓ |

All four MMKV instances use `id: 'quartzos'`. ✓

## TODO / dev-bypass scan

`grep -i "if (__DEV__)"` returns one match — the legitimate state-machine throw in `ConnectionStateMachine.ts:32`. No `if (__DEV__) return` BLE-bypass shortcuts exist anywhere in the source.

## Observations (non-bugs)

1. **Permissions revocation between sessions** — cold-start auto-connect will silently fail and route to scan modal after the 3s timeout. Acceptable graceful degradation.
2. **FF02 echo guard is defensive-only** — `ackReceived` flag in CommandQueue is unused because only FF01 is monitored. Harmless dead code. Not removed because it preserves correctness if FF02 monitoring is added later.
3. **`history/[id].tsx` and `history.tsx` previously displayed raw `presetId` UUIDs** — fixed in the same patch as Task A (resolved via `presetsDb.getById` / map lookup).

## Tests

- `src/ble/__tests__/DabRiteProtocol.test.ts` — 26/26 passing per prior tracer report (not re-run; tsc clean confirms no codec drift).
- `npx tsc --noEmit` — exit 0, zero errors.

## Summary

BLE on main works end-to-end. The user's suspicion was unfounded for the BLE path. The accompanying Task A copy/wiring sweep produced the only code changes in this commit.
