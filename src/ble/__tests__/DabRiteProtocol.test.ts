/**
 * DabRiteProtocol codec tests.
 *
 * These tests are written as self-contained assertions using a minimal
 * `expect`-style helper so they run under plain `ts-node` / `tsx` as well as
 * Jest, without pulling in a test-framework dependency that the quartzos-app
 * project does not yet declare.
 *
 * Under Jest: `describe` / `test` / `expect` are global and take precedence.
 * Standalone: invoke `runDabRiteProtocolTests()` from a script.
 */

import {
  decodeSettings,
  decodeTempStream,
  encodeQuerySettings,
  encodeWriteAll,
  encodeWriteColors,
  fragmentFrame,
  rgb565to888,
  rgb888to565,
} from '../DabRiteProtocol';
import { DEFAULT_SETTINGS, type DeviceSettings } from '../types';

// ---------------------------------------------------------------------------
// Minimal test harness that falls back when Jest isn't present.
// ---------------------------------------------------------------------------

type TestCase = { name: string; fn: () => void };
const pendingSuites: { name: string; cases: TestCase[] }[] = [];
let activeSuite: { name: string; cases: TestCase[] } | null = null;

const g = globalThis as unknown as {
  describe?: (name: string, fn: () => void) => void;
  test?: (name: string, fn: () => void) => void;
  it?: (name: string, fn: () => void) => void;
  expect?: (actual: unknown) => {
    toBe: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toBeNull: () => void;
    toHaveLength: (n: number) => void;
  };
};

const hasJest = typeof g.describe === 'function' && typeof g.expect === 'function';

function describe(name: string, fn: () => void): void {
  if (hasJest) {
    g.describe!(name, fn);
    return;
  }
  const suite = { name, cases: [] as TestCase[] };
  activeSuite = suite;
  pendingSuites.push(suite);
  fn();
  activeSuite = null;
}

function test(name: string, fn: () => void): void {
  if (hasJest) {
    (g.test ?? g.it)!(name, fn);
    return;
  }
  if (!activeSuite) throw new Error(`test("${name}") called outside describe()`);
  activeSuite.cases.push({ name, fn });
}

function expect(actual: unknown) {
  if (hasJest) return g.expect!(actual);
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new Error(`expected ${fmt(actual)} to be ${fmt(expected)}`);
      }
    },
    toEqual(expected: unknown) {
      const a = JSON.stringify(actual, jsonReplacer);
      const b = JSON.stringify(expected, jsonReplacer);
      if (a !== b) throw new Error(`expected\n  ${a}\nto equal\n  ${b}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`expected ${fmt(actual)} to be null`);
    },
    toHaveLength(n: number) {
      const len = (actual as { length?: number } | null)?.length;
      if (len !== n) throw new Error(`expected length ${len} to be ${n}`);
    },
  };
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) return Array.from(value);
  return value;
}

function fmt(v: unknown): string {
  if (v instanceof Uint8Array) return `Uint8Array[${toHex(v)}]`;
  try {
    return JSON.stringify(v, jsonReplacer);
  } catch {
    return String(v);
  }
}

export function runDabRiteProtocolTests(): void {
  let passed = 0;
  let failed = 0;
  for (const suite of pendingSuites) {
    for (const tc of suite.cases) {
      try {
        tc.fn();
        passed++;
      } catch (err) {
        failed++;
        console.error(`FAIL ${suite.name} > ${tc.name}`);
        console.error(err instanceof Error ? err.stack ?? err.message : String(err));
      }
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} failed, ${passed} passed`);
    throw new Error('DabRiteProtocol tests failed');
  }
  console.log(`DabRiteProtocol: ${passed} tests passed`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

function fromHex(s: string): Uint8Array {
  const parts = s.trim().split(/\s+/);
  return new Uint8Array(parts.map((p) => parseInt(p, 16)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('encodeQuerySettings', () => {
  test('produces EE ED A5 00×16 97 0D 0A', () => {
    const frame = encodeQuerySettings();
    const expected = fromHex(
      'ee ed a5 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 97 0d 0a',
    );
    expect(frame).toHaveLength(22);
    expect(frame).toEqual(expected);
  });

  test('checksum byte at index 19 is exactly 0x97', () => {
    expect(encodeQuerySettings()[19]).toBe(0x97);
  });
});

describe('encodeWriteAll', () => {
  test('is 22 bytes long with correct preamble/opcode/terminator', () => {
    const frame = encodeWriteAll(DEFAULT_SETTINGS);
    expect(frame).toHaveLength(22);
    expect(frame[0]).toBe(0xEE);
    expect(frame[1]).toBe(0xED);
    expect(frame[2]).toBe(0xA0);
    expect(frame[20]).toBe(0x0D);
    expect(frame[21]).toBe(0x0A);
  });

  test('checksum for DEFAULT_SETTINGS is 0x98', () => {
    // DEFAULT_SETTINGS: colors [0x60CC, 0x700E, 0x8852, 0xE659],
    //                   dab=550 (0x0226), dunk=250 (0x00FA),
    //                   cfg=0x1C (sound+light+ledGuide+fahrenheit),
    //                   sound=0x03 (keyTone=0, volume=3),
    //                   dabSound=1, dunkSound=1
    // Expected: ee ed a0 60 cc 70 0e 88 52 e6 59 02 26 00 fa 1c 03 01 01 98 0d 0a
    const frame = encodeWriteAll(DEFAULT_SETTINGS);
    expect(frame[19]).toBe(0x98);
    const expected = fromHex(
      'ee ed a0 60 cc 70 0e 88 52 e6 59 02 26 00 fa 1c 03 01 01 98 0d 0a',
    );
    expect(frame).toEqual(expected);
  });

  test('config byte packs all six bits correctly', () => {
    const all: DeviceSettings = {
      ...DEFAULT_SETTINGS,
      useCelsius: true,
      opaqueMode: true,
      soundAlert: true,
      lightAlert: true,
      ledGuide: true,
      nightMode: true,
    };
    expect(encodeWriteAll(all)[15]).toBe(0x3F);

    const none: DeviceSettings = {
      ...DEFAULT_SETTINGS,
      useCelsius: false,
      opaqueMode: false,
      soundAlert: false,
      lightAlert: false,
      ledGuide: false,
      nightMode: false,
    };
    expect(encodeWriteAll(none)[15]).toBe(0x00);
  });

  test('sound byte packs keyTone high-nibble and volume low-nibble', () => {
    const s: DeviceSettings = { ...DEFAULT_SETTINGS, keyTone: 3, volume: 1 };
    expect(encodeWriteAll(s)[16]).toBe(0x31);
  });
});

describe('encodeWriteColors', () => {
  test('is 14 bytes long with correct framing', () => {
    const frame = encodeWriteColors([0x60CC, 0x700E, 0x8852, 0xE659]);
    expect(frame).toHaveLength(14);
    expect(frame[0]).toBe(0xEE);
    expect(frame[1]).toBe(0xED);
    expect(frame[2]).toBe(0xA0);
    expect(frame[12]).toBe(0x0D);
    expect(frame[13]).toBe(0x0A);
  });

  test('encodes colors as BE u16 with valid checksum', () => {
    const frame = encodeWriteColors([0x60CC, 0x700E, 0x8852, 0xE659]);
    // bytes 3..10 are the colors
    expect(frame[3]).toBe(0x60);
    expect(frame[4]).toBe(0xCC);
    expect(frame[5]).toBe(0x70);
    expect(frame[6]).toBe(0x0E);
    // verify checksum byte at index 11
    let sum = 0;
    for (let i = 0; i <= 10; i++) sum = (sum + frame[i]) & 0xFF;
    sum = (sum + frame[12]) & 0xFF;
    sum = (sum + frame[13]) & 0xFF;
    expect(frame[11]).toBe(sum);
  });
});

describe('decodeSettings', () => {
  test('round-trips DEFAULT_SETTINGS through encodeWriteAll', () => {
    const encoded = encodeWriteAll(DEFAULT_SETTINGS);
    // Flip app preamble to device preamble + WRITE_ACK type and recompute checksum.
    const buf = new Uint8Array(encoded);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = 0x50; // WRITE_ACK
    let sum = 0;
    for (let i = 0; i <= 18; i++) sum = (sum + buf[i]) & 0xFF;
    sum = (sum + buf[20]) & 0xFF;
    sum = (sum + buf[21]) & 0xFF;
    buf[19] = sum;

    const decoded = decodeSettings(buf);
    expect(decoded).toEqual(DEFAULT_SETTINGS);
  });

  test('accepts QUERY_REPLY (0x55) as well as WRITE_ACK (0x50)', () => {
    const encoded = encodeWriteAll(DEFAULT_SETTINGS);
    const buf = new Uint8Array(encoded);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = 0x55;
    let sum = 0;
    for (let i = 0; i <= 18; i++) sum = (sum + buf[i]) & 0xFF;
    sum = (sum + buf[20]) & 0xFF;
    sum = (sum + buf[21]) & 0xFF;
    buf[19] = sum;
    expect(decodeSettings(buf)).toEqual(DEFAULT_SETTINGS);
  });

  test('returns null on wrong length', () => {
    expect(decodeSettings(new Uint8Array(21))).toBeNull();
  });

  test('returns null on bad preamble', () => {
    const buf = new Uint8Array(22);
    buf[2] = 0x50;
    buf[20] = 0x0D;
    buf[21] = 0x0A;
    expect(decodeSettings(buf)).toBeNull();
  });

  test('returns null on bad type byte', () => {
    const encoded = encodeWriteAll(DEFAULT_SETTINGS);
    const buf = new Uint8Array(encoded);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = 0x42; // not 0x50 or 0x55
    expect(decodeSettings(buf)).toBeNull();
  });

  test('returns null on bad checksum', () => {
    const encoded = encodeWriteAll(DEFAULT_SETTINGS);
    const buf = new Uint8Array(encoded);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = 0x50;
    // Leave old (now wrong) checksum in place on purpose.
    expect(decodeSettings(buf)).toBeNull();
  });

  test('returns null on missing CRLF terminator', () => {
    const encoded = encodeWriteAll(DEFAULT_SETTINGS);
    const buf = new Uint8Array(encoded);
    buf[0] = 0xFE;
    buf[1] = 0xFD;
    buf[2] = 0x50;
    buf[21] = 0x00;
    expect(decodeSettings(buf)).toBeNull();
  });
});

describe('decodeTempStream', () => {
  test('decodes FE FD 02 77 8B 0D 0A to 631°F', () => {
    const buf = new Uint8Array([0xFE, 0xFD, 0x02, 0x77, 0x8B, 0x0D, 0x0A]);
    expect(decodeTempStream(buf)).toBe(631);
  });

  test('decodes idle frame FE FD 00 00 12 0D 0A to 0°F', () => {
    const buf = new Uint8Array([0xFE, 0xFD, 0x00, 0x00, 0x12, 0x0D, 0x0A]);
    expect(decodeTempStream(buf)).toBe(0);
  });

  test('returns null on bad checksum', () => {
    // Flip one checksum bit.
    const buf = new Uint8Array([0xFE, 0xFD, 0x02, 0x77, 0x00, 0x0D, 0x0A]);
    expect(decodeTempStream(buf)).toBeNull();
  });

  test('returns null on wrong length', () => {
    expect(decodeTempStream(new Uint8Array(6))).toBeNull();
    expect(decodeTempStream(new Uint8Array(8))).toBeNull();
  });

  test('returns null on bad preamble', () => {
    const buf = new Uint8Array([0x00, 0x00, 0x02, 0x77, 0x8B, 0x0D, 0x0A]);
    expect(decodeTempStream(buf)).toBeNull();
  });

  test('returns null on missing CRLF', () => {
    const buf = new Uint8Array([0xFE, 0xFD, 0x02, 0x77, 0x8B, 0x00, 0x0A]);
    expect(decodeTempStream(buf)).toBeNull();
  });
});

describe('fragmentFrame', () => {
  test('splits a 22-byte frame into [20, 2] with default MTU', () => {
    const frame = encodeQuerySettings();
    const chunks = fragmentFrame(frame);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(20);
    expect(chunks[1]).toHaveLength(2);
    // Trailing chunk should be the CRLF.
    expect(Array.from(chunks[1])).toEqual([0x0D, 0x0A]);
  });

  test('returns the frame as a single chunk when it fits within MTU', () => {
    const small = new Uint8Array([1, 2, 3, 4]);
    const chunks = fragmentFrame(small, 20);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(small);
  });

  test('respects a custom MTU', () => {
    const frame = new Uint8Array(10);
    const chunks = fragmentFrame(frame, 4);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(4);
    expect(chunks[1]).toHaveLength(4);
    expect(chunks[2]).toHaveLength(2);
  });
});

describe('rgb color helpers', () => {
  test('rgb888to565 packs channels correctly', () => {
    expect(rgb888to565(0, 0, 0)).toBe(0x0000);
    expect(rgb888to565(255, 255, 255)).toBe(0xFFFF);
    // Pure red: r=0xF8 keeps top 5 bits, g=0, b=0
    expect(rgb888to565(255, 0, 0)).toBe(0xF800);
    expect(rgb888to565(0, 255, 0)).toBe(0x07E0);
    expect(rgb888to565(0, 0, 255)).toBe(0x001F);
  });

  test('rgb565to888 expands channels with replicated low bits', () => {
    const white = rgb565to888(0xFFFF);
    expect(white).toEqual({ r: 255, g: 255, b: 255 });
    const black = rgb565to888(0x0000);
    expect(black).toEqual({ r: 0, g: 0, b: 0 });
  });
});
