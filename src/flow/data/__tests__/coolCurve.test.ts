/**
 * coolCurve tests.
 *
 * Self-contained assertions using a minimal `expect`-style helper so they run
 * under plain `ts-node` / `tsx` as well as Jest, without pulling in a
 * test-framework dependency.
 *
 * Under Jest: `describe` / `test` / `expect` are global and take precedence.
 * Standalone: invoke `runCoolCurveTests()` from a script.
 */

import { COOL_TOTAL_MS, predictCoolDropRate, predictCoolTemp } from '../coolCurve';

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
    toBeGreaterThan: (n: number) => void;
    toBeLessThan: (n: number) => void;
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
    toBeGreaterThan(n: number) {
      if (typeof actual !== 'number' || actual <= n) {
        throw new Error(`expected ${fmt(actual)} to be greater than ${n}`);
      }
    },
    toBeLessThan(n: number) {
      if (typeof actual !== 'number' || actual >= n) {
        throw new Error(`expected ${fmt(actual)} to be less than ${n}`);
      }
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

export function runCoolCurveTests(): void {
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
    throw new Error('coolCurve tests failed');
  }
  console.log(`coolCurve: ${passed} tests passed`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('predictCoolTemp', () => {
  test('returns peak at elapsedMs = 0', () => {
    const result = predictCoolTemp(0, 600, 520);
    // Should equal peak (600) at t=0 — the exponential decay starts at peak
    expect(Math.round(result)).toBe(600);
  });

  test('returns ~515 (target - 5) at COOL_TOTAL_MS', () => {
    const result = predictCoolTemp(COOL_TOTAL_MS, 600, 520);
    expect(result).toBeGreaterThan(513);
    expect(result).toBeLessThan(517);
  });

  test('is monotonically decreasing over sample of time points', () => {
    const times = [0, 2500, 5000, 10000, 15000, 20000, COOL_TOTAL_MS];
    for (let i = 0; i < times.length - 1; i++) {
      const earlier = predictCoolTemp(times[i]!, 600, 520);
      const later = predictCoolTemp(times[i + 1]!, 600, 520);
      expect(earlier).toBeGreaterThan(later);
    }
  });

  test('degenerate input (peak <= ambient) returns target flat', () => {
    // peak=100, ambient=150 by default → peak <= ambient → flat
    expect(predictCoolTemp(0, 100, 520)).toBe(520);
  });

  test('negative elapsed clamps to behavior at 0 (returns peak)', () => {
    const atZero = predictCoolTemp(0, 600, 520);
    const atNeg = predictCoolTemp(-100, 600, 520);
    expect(Math.round(atNeg)).toBe(Math.round(atZero));
  });
});

describe('predictCoolDropRate', () => {
  test('drop rate at t=0 is positive and larger than at t=20000', () => {
    const rateEarly = predictCoolDropRate(0, 600, 520);
    const rateLate = predictCoolDropRate(20000, 600, 520);
    expect(rateEarly).toBeGreaterThan(0);
    expect(rateEarly).toBeGreaterThan(rateLate);
  });

  test('degenerate input returns 0', () => {
    expect(predictCoolDropRate(0, 100, 520)).toBe(0);
  });
});
