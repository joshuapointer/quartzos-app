/**
 * Tests for `validateAlarms`. Mirrors the dual-harness pattern used by
 * `calibration.test.ts` so this file runs under Jest *and* under plain
 * `tsx` / `ts-node`:
 *
 *   tsc --noEmit
 *   npx tsx src/utils/__tests__/temperature.test.ts
 */

import { validateAlarms } from '../temperature';

// ---------------------------------------------------------------------------
// Minimal harness (Jest fallback)
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
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`expected\n  ${a}\nto equal\n  ${b}`);
    },
  };
}

function fmt(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function runTemperatureTests(): void {
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
    throw new Error('temperature tests failed');
  }
  console.log(`temperature: ${passed} tests passed`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateAlarms — bounds', () => {
  test('clamps dab below 100°F up to 100', () => {
    expect(validateAlarms(50, 40)).toEqual({ dab: 100, dunk: 90 });
  });

  test('clamps dab above 900°F down to 900', () => {
    expect(validateAlarms(1200, 250)).toEqual({ dab: 900, dunk: 250 });
  });

  test('clamps dunk below 100°F up to 100', () => {
    expect(validateAlarms(550, 50)).toEqual({ dab: 550, dunk: 100 });
  });
});

describe('validateAlarms — cross-field constraint (dunk ≤ dab - 10)', () => {
  test('passes through a valid pair untouched', () => {
    expect(validateAlarms(550, 250)).toEqual({ dab: 550, dunk: 250 });
  });

  test('clamps dunk equal to dab down to dab - 10', () => {
    expect(validateAlarms(500, 500)).toEqual({ dab: 500, dunk: 490 });
  });

  test('clamps dunk above dab down to dab - 10', () => {
    expect(validateAlarms(400, 450)).toEqual({ dab: 400, dunk: 390 });
  });

  test('clamps dunk within 10°F of dab down to dab - 10', () => {
    expect(validateAlarms(600, 595)).toEqual({ dab: 600, dunk: 590 });
  });
});

describe('validateAlarms — non-integer input', () => {
  test('rounds fractional values', () => {
    expect(validateAlarms(550.6, 250.4)).toEqual({ dab: 551, dunk: 250 });
  });
});

describe('validateAlarms — boundary cases', () => {
  test('dab at protocol minimum forces dunk to dab - 10', () => {
    // dab=100, dunk floor of 100 vs upper of 90 — cross-field wins
    expect(validateAlarms(100, 100)).toEqual({ dab: 100, dunk: 90 });
  });

  test('dab at protocol maximum allows dunk anywhere up to 890', () => {
    expect(validateAlarms(900, 890)).toEqual({ dab: 900, dunk: 890 });
    expect(validateAlarms(900, 950)).toEqual({ dab: 900, dunk: 890 });
  });
});

// ---------------------------------------------------------------------------
// Plain-mode entry point
// ---------------------------------------------------------------------------

if (!hasJest) {
  runTemperatureTests();
}
