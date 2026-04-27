import { checksum } from '../utils/checksum';
import {
  ATT_MTU,
  CONFIG_BIT_LED_GUIDE,
  CONFIG_BIT_LIGHT_ALERT,
  CONFIG_BIT_NIGHT_MODE,
  CONFIG_BIT_OPAQUE_MODE,
  CONFIG_BIT_SOUND_ALERT,
  CONFIG_BIT_USE_CELSIUS,
  DAB_SOUND_LABELS,
  DUNK_SOUND_LABELS,
  FRAME_SETTINGS_LEN,
  FRAME_TEMP_LEN,
  FRAME_WRITE_COLORS_LEN,
  KEY_TONE_LABELS,
  OPCODE_QUERY,
  OPCODE_WRITE,
  PREAMBLE_APP_HI,
  PREAMBLE_APP_LO,
  PREAMBLE_DEV_HI,
  PREAMBLE_DEV_LO,
  TYPE_QUERY_REPLY,
  TYPE_WRITE_ACK,
} from './constants';
import type { DeviceSettings, RGB565 } from './types';

export { checksum };

// --- color helpers -----------------------------------------------------------

export function rgb888to565(r: number, g: number, b: number): number {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

export function rgb565to888(v: number): { r: number; g: number; b: number } {
  const r5 = (v >> 11) & 0x1F;
  const g6 = (v >> 5)  & 0x3F;
  const b5 =  v        & 0x1F;
  return {
    r: (r5 << 3) | (r5 >> 2),
    g: (g6 << 2) | (g6 >> 4),
    b: (b5 << 3) | (b5 >> 2),
  };
}

// --- internal helpers --------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function writeBE16(buf: Uint8Array, offset: number, value: number): void {
  buf[offset]     = (value >> 8) & 0xFF;
  buf[offset + 1] =  value       & 0xFF;
}

function readBE16(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 8) | buf[offset + 1]) & 0xFFFF;
}

function packConfigByte(s: DeviceSettings): number {
  let v = 0;
  if (s.useCelsius) v |= 1 << CONFIG_BIT_USE_CELSIUS;
  if (s.opaqueMode) v |= 1 << CONFIG_BIT_OPAQUE_MODE;
  if (s.soundAlert) v |= 1 << CONFIG_BIT_SOUND_ALERT;
  if (s.lightAlert) v |= 1 << CONFIG_BIT_LIGHT_ALERT;
  if (s.ledGuide)   v |= 1 << CONFIG_BIT_LED_GUIDE;
  if (s.nightMode)  v |= 1 << CONFIG_BIT_NIGHT_MODE;
  return v & 0xFF;
}

function unpackConfigByte(v: number): Pick<
  DeviceSettings,
  'useCelsius' | 'opaqueMode' | 'soundAlert' | 'lightAlert' | 'ledGuide' | 'nightMode'
> {
  return {
    useCelsius: ((v >> CONFIG_BIT_USE_CELSIUS) & 1) === 1,
    opaqueMode: ((v >> CONFIG_BIT_OPAQUE_MODE) & 1) === 1,
    soundAlert: ((v >> CONFIG_BIT_SOUND_ALERT) & 1) === 1,
    lightAlert: ((v >> CONFIG_BIT_LIGHT_ALERT) & 1) === 1,
    ledGuide:   ((v >> CONFIG_BIT_LED_GUIDE)   & 1) === 1,
    nightMode:  ((v >> CONFIG_BIT_NIGHT_MODE)  & 1) === 1,
  };
}

function packSoundByte(keyTone: number, volume: number): number {
  return (((keyTone & 0x0F) << 4) | (volume & 0x0F)) & 0xFF;
}

// --- encoders ----------------------------------------------------------------

/** 22-byte QUERY_SETTINGS frame: EE ED A5 00×16 97 0D 0A. */
export function encodeQuerySettings(): Uint8Array {
  const buf = new Uint8Array(FRAME_SETTINGS_LEN);
  buf[0] = PREAMBLE_APP_HI;
  buf[1] = PREAMBLE_APP_LO;
  buf[2] = OPCODE_QUERY;
  // bytes 3..18 are zero-initialized
  buf[19] = checksum([
    PREAMBLE_APP_HI,
    PREAMBLE_APP_LO,
    OPCODE_QUERY,
    0x0D,
    0x0A,
  ]); // = 0x97
  buf[20] = 0x0D;
  buf[21] = 0x0A;
  return buf;
}

/** 22-byte WRITE_ALL_SETTINGS frame. */
export function encodeWriteAll(s: DeviceSettings): Uint8Array {
  const buf = new Uint8Array(FRAME_SETTINGS_LEN);
  buf[0] = PREAMBLE_APP_HI;
  buf[1] = PREAMBLE_APP_LO;
  buf[2] = OPCODE_WRITE;
  writeBE16(buf, 3,  clamp(s.colors[0], 0, 0xFFFF));
  writeBE16(buf, 5,  clamp(s.colors[1], 0, 0xFFFF));
  writeBE16(buf, 7,  clamp(s.colors[2], 0, 0xFFFF));
  writeBE16(buf, 9,  clamp(s.colors[3], 0, 0xFFFF));
  writeBE16(buf, 11, clamp(s.dabAlarmF,  100, 900));
  writeBE16(buf, 13, clamp(s.dunkAlarmF, 100, 900));
  buf[15] = packConfigByte(s);
  buf[16] = packSoundByte(
    clamp(s.keyTone,  0, KEY_TONE_LABELS.length - 1),
    clamp(s.volume,   1, 3),
  );
  buf[17] = clamp(s.dabSound,  0, DAB_SOUND_LABELS.length  - 1) & 0xFF;
  buf[18] = clamp(s.dunkSound, 0, DUNK_SOUND_LABELS.length - 1) & 0xFF;
  buf[20] = 0x0D;
  buf[21] = 0x0A;
  // checksum = sum(bytes[0..18, 20..21]) & 0xFF
  let sum = 0;
  for (let i = 0; i <= 18; i++) sum = (sum + buf[i]) & 0xFF;
  sum = (sum + buf[20]) & 0xFF;
  sum = (sum + buf[21]) & 0xFF;
  buf[19] = sum;
  return buf;
}

/** 14-byte WRITE_COLORS frame. */
export function encodeWriteColors(
  colors: [RGB565, RGB565, RGB565, RGB565],
): Uint8Array {
  const buf = new Uint8Array(FRAME_WRITE_COLORS_LEN);
  buf[0] = PREAMBLE_APP_HI;
  buf[1] = PREAMBLE_APP_LO;
  buf[2] = OPCODE_WRITE;
  writeBE16(buf, 3, clamp(colors[0], 0, 0xFFFF));
  writeBE16(buf, 5, clamp(colors[1], 0, 0xFFFF));
  writeBE16(buf, 7, clamp(colors[2], 0, 0xFFFF));
  writeBE16(buf, 9, clamp(colors[3], 0, 0xFFFF));
  buf[12] = 0x0D;
  buf[13] = 0x0A;
  // checksum = sum(bytes[0..10, 12..13]) & 0xFF
  let sum = 0;
  for (let i = 0; i <= 10; i++) sum = (sum + buf[i]) & 0xFF;
  sum = (sum + buf[12]) & 0xFF;
  sum = (sum + buf[13]) & 0xFF;
  buf[11] = sum;
  return buf;
}

// --- decoders ----------------------------------------------------------------

/**
 * Decode a 22-byte WRITE_ACK (0x50) or QUERY_REPLY (0x55) frame.
 * Returns null if validation or checksum fails.
 */
export function decodeSettings(buf: Uint8Array): DeviceSettings | null {
  if (buf.length !== FRAME_SETTINGS_LEN) return null;
  if (buf[0] !== PREAMBLE_DEV_HI || buf[1] !== PREAMBLE_DEV_LO) return null;
  if (buf[2] !== TYPE_WRITE_ACK && buf[2] !== TYPE_QUERY_REPLY) return null;
  if (buf[20] !== 0x0D || buf[21] !== 0x0A) return null;

  let sum = 0;
  for (let i = 0; i <= 18; i++) sum = (sum + buf[i]) & 0xFF;
  sum = (sum + buf[20]) & 0xFF;
  sum = (sum + buf[21]) & 0xFF;
  if (sum !== buf[19]) return null;

  const colors: [RGB565, RGB565, RGB565, RGB565] = [
    readBE16(buf, 3),
    readBE16(buf, 5),
    readBE16(buf, 7),
    readBE16(buf, 9),
  ];
  const dabAlarmF  = readBE16(buf, 11);
  const dunkAlarmF = readBE16(buf, 13);
  const cfg = unpackConfigByte(buf[15]);
  const soundByte = buf[16];
  const keyTone = (soundByte >> 4) & 0x0F;
  const volume  =  soundByte       & 0x0F;
  const dabSound  = buf[17];
  const dunkSound = buf[18];

  return {
    colors,
    dabAlarmF,
    dunkAlarmF,
    ...cfg,
    volume,
    keyTone,
    dabSound,
    dunkSound,
  };
}

/**
 * Decode a 7-byte TEMPERATURE_STREAM frame.
 * Returns temperature in °F (BE u16) or null if validation/checksum fails.
 */
export function decodeTempStream(buf: Uint8Array): number | null {
  if (buf.length !== FRAME_TEMP_LEN) return null;
  if (buf[0] !== PREAMBLE_DEV_HI || buf[1] !== PREAMBLE_DEV_LO) return null;
  if (buf[5] !== 0x0D || buf[6] !== 0x0A) return null;

  // checksum = sum(bytes[0..3, 5..6]) & 0xFF, stored at byte[4]
  let sum = 0;
  for (let i = 0; i <= 3; i++) sum = (sum + buf[i]) & 0xFF;
  sum = (sum + buf[5]) & 0xFF;
  sum = (sum + buf[6]) & 0xFF;
  if (sum !== buf[4]) return null;

  return readBE16(buf, 2);
}

// --- ATT fragmentation -------------------------------------------------------

/**
 * Split a frame into BLE ATT-sized chunks (default MTU 20).
 * A 22-byte settings frame becomes [20 bytes, 2 bytes] (the trailing CRLF).
 */
export function fragmentFrame(frame: Uint8Array, mtu: number = ATT_MTU): Uint8Array[] {
  if (mtu <= 0) throw new Error('mtu must be > 0');
  if (frame.length <= mtu) return [frame];
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < frame.length; offset += mtu) {
    chunks.push(frame.slice(offset, Math.min(offset + mtu, frame.length)));
  }
  return chunks;
}
