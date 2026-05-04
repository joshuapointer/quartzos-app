export const SERVICE_UUID    = '0000ff00-0000-1000-8000-00805f9b34fb';
export const CHAR_FF01_UUID  = '0000ff01-0000-1000-8000-00805f9b34fb';
export const CHAR_FF02_UUID  = '0000ff02-0000-1000-8000-00805f9b34fb';

export const PREAMBLE_APP_HI  = 0xEE;
export const PREAMBLE_APP_LO  = 0xED;
export const PREAMBLE_DEV_HI  = 0xFE;
export const PREAMBLE_DEV_LO  = 0xFD;

export const OPCODE_WRITE     = 0xA0; // WRITE_COLORS (14B) and WRITE_ALL (22B) — same opcode, different length
export const OPCODE_QUERY     = 0xA5;
export const TYPE_WRITE_ACK   = 0x50;
export const TYPE_QUERY_REPLY = 0x55;

export const FRAME_TEMP_LEN         = 7;
export const FRAME_WRITE_COLORS_LEN = 14;
export const FRAME_SETTINGS_LEN     = 22;
export const ATT_MTU                = 20;

export const CONFIG_BIT_USE_CELSIUS  = 0;
export const CONFIG_BIT_OPAQUE_MODE  = 1;
export const CONFIG_BIT_SOUND_ALERT  = 2;
export const CONFIG_BIT_LIGHT_ALERT  = 3;
export const CONFIG_BIT_LED_GUIDE    = 4;
export const CONFIG_BIT_NIGHT_MODE   = 5;

export const KEY_TONE_LABELS = ['None', 'Arcade', 'Calypso', 'Classic 1', 'Classic 2', 'Ratchet', 'RPG', 'Define'] as const;
export const DAB_SOUND_LABELS  = ['—', 'Cloud9', 'Codex', 'Excalibur', 'Lush', 'Saucer', 'Submerge', 'OG Beep', 'Define'] as const;
export const DUNK_SOUND_LABELS = ['—', 'Blocks', 'Codex', 'Excalibur', 'Lush', 'Saucer', 'Submerge', 'OG Beep', 'Define'] as const;

export const QUARTZ_DAB_ALARM_F  = 550;
export const QUARTZ_DUNK_ALARM_F = 250;
export const OPAQUE_DAB_ALARM_F  = 530;
export const OPAQUE_DUNK_ALARM_F = 275;

// First entry bumped 1000 → 3000ms: when the DabRite power-cycles
// (idle auto-off then user re-powers it), the device needs ~3-5s to
// bring its BLE stack back up + start advertising. A 1s retry hits the
// device before it's ready to negotiate, which can wedge its firmware.
export const RECONNECT_DELAYS_MS = [3000, 5000, 8000, 16000, 30000, 60000];
export const MAX_RECONNECT_ATTEMPTS = 10;
/** Quiet period after reconnect READY before the first frame goes out.
 *  Longer than the inter-frame quiet (POST_ACK_QUIET_MS=80ms) because a
 *  freshly-booted device is still finishing GATT init when READY transitions
 *  in — slamming it with QUERY_SETTINGS too soon can lock up the firmware. */
export const POST_RECONNECT_QUIET_MS = 500;
/** Maximum disconnects we'll absorb in a rolling window before bailing to
 *  ERROR. If we hit this, the firmware is likely stuck — surface to the
 *  user with a "power-cycle the DabRite" toast instead of looping forever. */
export const DISCONNECT_STORM_THRESHOLD = 3;
export const DISCONNECT_STORM_WINDOW_MS = 60_000;
// Bumped from 1500ms — stressed firmware (torch heat, RF noise) can be slow to ACK.
// A short timeout combined with retries was causing duplicate frames to be
// re-sent while the device was still committing the previous one.
export const WRITE_ACK_TIMEOUT_MS  = 3000;
export const QUERY_INTERVAL_MS     = 60_000;
export const SETTINGS_WRITE_DEBOUNCE_MS = 300;
export const OPAQUE_MODE_ALARM_DELAY_MS = 10_000;
