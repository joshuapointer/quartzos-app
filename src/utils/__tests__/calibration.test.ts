/**
 * Calibration engine tests.
 *
 * Mirrors the dual-harness pattern from `src/ble/__tests__/DabRiteProtocol.test.ts`
 * — the same `describe` / `test` / `expect` shims so the file runs under Jest
 * (where the globals are present) AND under plain `tsx` / `ts-node`.
 *
 *   tsc --noEmit                                                          (typecheck)
 *   npx tsx src/utils/__tests__/calibration.test.ts                       (run)
 *
 * Test cases:
 *   1. The five `schema.json calibration.examples` reproduce within ±1°F.
 *   2. `inverseInterior` round-trips each example.
 *   3. `coldStartAvailable` matches a hand-checked truth table.
 */

import {
  coldStartAvailable,
  computeDisplayedTarget,
  inverseInterior,
  recommendDunk,
} from '../calibration';
import { findBanger, type Banger } from '../../data/bangers';
import { findConcentrate, type Concentrate } from '../../data/concentrates';
import { findSensor, type Sensor } from '../../data/sensors';
import { findWallThickness, type WallThickness } from '../../data/wallThicknesses';

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
    toBeCloseTo: (expected: number, withinF?: number) => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
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
    toBeNull() {
      if (actual !== null) throw new Error(`expected ${fmt(actual)} to be null`);
    },
    toHaveLength(n: number) {
      const len = (actual as { length?: number } | null)?.length;
      if (len !== n) throw new Error(`expected length ${len} to be ${n}`);
    },
    toBeCloseTo(expected: number, withinF: number = 1) {
      if (typeof actual !== 'number') {
        throw new Error(`expected ${fmt(actual)} to be a number`);
      }
      if (Math.abs(actual - expected) > withinF) {
        throw new Error(`expected ${actual} to be within ±${withinF} of ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`expected ${fmt(actual)} to be truthy`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`expected ${fmt(actual)} to be falsy`);
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

export function runCalibrationTests(): void {
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
    throw new Error('calibration tests failed');
  }
  console.log(`calibration: ${passed} tests passed`);
}

// ---------------------------------------------------------------------------
// Lookup helpers (force-narrow so test bodies stay tight)
// ---------------------------------------------------------------------------

function mustConcentrate(id: string): Concentrate {
  const c = findConcentrate(id);
  if (!c) throw new Error(`fixture: missing concentrate ${id}`);
  return c;
}
function mustBanger(id: string): Banger {
  const b = findBanger(id);
  if (!b) throw new Error(`fixture: missing banger ${id}`);
  return b;
}
function mustSensor(id: string): Sensor {
  const s = findSensor(id);
  if (!s) throw new Error(`fixture: missing sensor ${id}`);
  return s;
}
function mustWall(id: string): WallThickness {
  const w = findWallThickness(id);
  if (!w) throw new Error(`fixture: missing wall ${id}`);
  return w;
}

// ---------------------------------------------------------------------------
// Test fixtures — the five schema.calibration.examples
// ---------------------------------------------------------------------------

interface Example {
  readonly scenario: string;
  readonly concentrateId: string;
  readonly bangerId: string;
  readonly sensorId: string;
  readonly wallId: string;
  readonly displayed: number;
}

const SCHEMA_EXAMPLES: readonly Example[] = [
  {
    scenario: 'Live Resin + Flat Top + IR + Standard wall',
    concentrateId: 'live-resin',
    bangerId: 'flat-top',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 475,
  },
  {
    scenario: 'Live Resin + Blender + IR + Standard wall',
    concentrateId: 'live-resin',
    bangerId: 'blender',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 530,
  },
  {
    scenario: 'Cold Cure Rosin + Terp Slurper + IR + Standard wall',
    concentrateId: 'cold-cure',
    bangerId: 'terp-slurper',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 480,
  },
  {
    scenario: 'Live Resin + Flat Top + Probe + Standard wall',
    concentrateId: 'live-resin',
    bangerId: 'flat-top',
    sensorId: 'probe',
    wallId: 'standard',
    displayed: 510,
  },
  {
    scenario: 'Live Resin + E-Banger + PID + Standard wall',
    concentrateId: 'live-resin',
    bangerId: 'e-banger',
    sensorId: 'enail',
    wallId: 'standard',
    displayed: 560,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeDisplayedTarget — schema.calibration.examples', () => {
  for (const ex of SCHEMA_EXAMPLES) {
    test(ex.scenario, () => {
      const result = computeDisplayedTarget({
        concentrate: mustConcentrate(ex.concentrateId),
        banger: mustBanger(ex.bangerId),
        sensor: mustSensor(ex.sensorId),
        wall: mustWall(ex.wallId),
      });
      expect(result.displayedF).toBeCloseTo(ex.displayed, 1);
    });
  }
});

describe('computeDisplayedTarget — trace + dunk', () => {
  test('produces a non-empty trace and a dunk in [200, 320] for IR', () => {
    const result = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('flat-top'),
      sensor: mustSensor('ir'),
      wall: mustWall('standard'),
    });
    if (result.trace.length < 4) {
      throw new Error(`trace too short: ${JSON.stringify(result.trace)}`);
    }
    if (result.dunkF < 200 || result.dunkF > 320) {
      throw new Error(`dunk ${result.dunkF}°F out of clamp range`);
    }
  });

  test('e-nail dunk is fixed at 250°F', () => {
    const result = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('e-banger'),
      sensor: mustSensor('enail'),
      wall: mustWall('standard'),
    });
    expect(result.dunkF).toBe(250);
  });

  test('throws a friendly error for blocked concentrates', () => {
    let caught: unknown = null;
    try {
      computeDisplayedTarget({
        concentrate: mustConcentrate('kief'),
        banger: mustBanger('flat-top'),
        sensor: mustSensor('ir'),
        wall: mustWall('standard'),
      });
    } catch (err) {
      caught = err;
    }
    if (!(caught instanceof Error)) {
      throw new Error('expected blocked concentrate to throw');
    }
    if (!/should not be dabbed/i.test(caught.message)) {
      throw new Error(`unexpected error message: ${caught.message}`);
    }
  });

  test('tuneOffsetF nudges the displayed target', () => {
    const base = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('flat-top'),
      sensor: mustSensor('ir'),
      wall: mustWall('standard'),
    });
    const nudged = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('flat-top'),
      sensor: mustSensor('ir'),
      wall: mustWall('standard'),
      tuneOffsetF: 7,
    });
    expect(nudged.displayedF - base.displayedF).toBe(7);
  });
});

describe('inverseInterior round-trips schema examples', () => {
  for (const ex of SCHEMA_EXAMPLES) {
    test(`${ex.scenario} → recovers interior`, () => {
      const banger = mustBanger(ex.bangerId);
      const sensor = mustSensor(ex.sensorId);
      const wall = mustWall(ex.wallId);
      const concentrate = mustConcentrate(ex.concentrateId);
      const recovered = inverseInterior({
        displayedF: ex.displayed,
        banger,
        sensor,
        wall,
      });
      const expected = concentrate.surface_temp_optimal_f;
      if (expected == null) throw new Error('fixture concentrate has no optimal temp');
      expect(recovered).toBeCloseTo(expected, 1);
    });
  }
});

describe('recommendDunk', () => {
  test('clamps low end at 200°F', () => {
    const visual = mustSensor('visual');
    expect(recommendDunk(400, visual)).toBe(200);
  });
  test('clamps high end at 320°F', () => {
    const visual = mustSensor('visual');
    expect(recommendDunk(700, visual)).toBe(320);
  });
  test('passes through inside the band', () => {
    const ir = mustSensor('ir');
    expect(recommendDunk(530, ir)).toBe(250);
  });
  test('e-nail always returns 250°F', () => {
    const enail = mustSensor('enail');
    expect(recommendDunk(560, enail)).toBe(250);
    expect(recommendDunk(900, enail)).toBe(250);
  });
});

describe('coldStartAvailable truth table', () => {
  test('live-rosin + round-bottom = true (good_for_cold_start, banger YES)', () => {
    expect(
      coldStartAvailable(mustConcentrate('live-rosin'), mustBanger('round-bottom')),
    ).toBe(true);
  });

  test('live-resin + swing-arm = false (live-resin good_for_cold_start=false)', () => {
    expect(
      coldStartAvailable(mustConcentrate('live-resin'), mustBanger('swing-arm')),
    ).toBe(false);
  });

  test('kief + anything = false (surface_temp null + blocked)', () => {
    expect(coldStartAvailable(mustConcentrate('kief'), mustBanger('round-bottom'))).toBe(
      false,
    );
    expect(coldStartAvailable(mustConcentrate('kief'), mustBanger('flat-top'))).toBe(
      false,
    );
  });

  test('live-rosin + control-tower = false (banger.cold_start_compatible=NO)', () => {
    expect(
      coldStartAvailable(mustConcentrate('live-rosin'), mustBanger('control-tower')),
    ).toBe(false);
  });

  test('live-rosin + insert = true (banger.cold_start_compatible=YES)', () => {
    expect(
      coldStartAvailable(mustConcentrate('live-rosin'), mustBanger('insert')),
    ).toBe(true);
  });

  test('live-rosin + flat-top = true (banger.cold_start_compatible=OPTIONAL)', () => {
    expect(
      coldStartAvailable(mustConcentrate('live-rosin'), mustBanger('flat-top')),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Plain-mode entry point
// ---------------------------------------------------------------------------

if (!hasJest) {
  runCalibrationTests();
}
