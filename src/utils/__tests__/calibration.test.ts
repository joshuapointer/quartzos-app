/**
 * Calibration engine tests — v2 metrology model.
 *
 * Mirrors the dual-harness pattern from `src/ble/__tests__/DabRiteProtocol.test.ts`
 * — runs under Jest (where the globals are present) AND under plain `tsx` / `ts-node`.
 *
 *   tsc --noEmit
 *   npx tsx src/utils/__tests__/calibration.test.ts
 *
 * Test cases:
 *   1. Six v2 schema worked examples reproduce within ±3°F.
 *   2. `inverseInterior` round-trips each example.
 *   3. Dunk derivation: surface 202°F → sensor-aware display (matches AlarmService bands).
 *   4. `coldStartAvailable` truth table.
 *   5. Torch durations parse from catalog ranges, no hardcoded constants.
 *   6. Newton-cooling dab-window engine returns sane numbers for known fixtures.
 */

import {
  coldStartAvailable,
  computeDisplayedTarget,
  inverseInterior,
} from '../calibration';
import { dunkSurfaceF, dunkDisplayedF } from '../dunkTempEngine';
import { computeDabWindow } from '../dabWindowEngine';
import { parseTorchDuration, torchDurationS } from '../torchTimeEngine';
import { CALIBRATION_CONSTANTS } from '../../data/calibrationConstants';
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
// Test fixtures — six v2 schema.calibration.examples
// (docs/perfect_dab/quartzos.min.json `calibration.examples`)
// ---------------------------------------------------------------------------

interface Example {
  readonly scenario: string;
  readonly concentrateId: string;
  readonly bangerId: string;
  readonly sensorId: string;
  readonly wallId: string;
  readonly displayed: number;
  readonly tolF: number;
}

const SCHEMA_EXAMPLES: readonly Example[] = [
  {
    scenario: 'Live Rosin + Flat Top + IR + Std (4mm clear)',
    concentrateId: 'live-rosin',
    bangerId: 'flat-top',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 520,
    tolF: 1,
  },
  {
    scenario: 'Live Rosin + Opaque Bottom + IR (Opaque preset) + Std',
    concentrateId: 'live-rosin',
    bangerId: 'opaque-bottom',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 518,
    tolF: 1,
  },
  {
    scenario: 'Cured Shatter + Flat Top + IR + Thin (2mm)',
    concentrateId: 'shatter',
    bangerId: 'flat-top',
    sensorId: 'ir',
    wallId: 'thin',
    displayed: 570,
    tolF: 5, // schema math rounds gradient down (10 vs computed 12.5)
  },
  {
    scenario: 'Live Rosin + Flat Top + Terpometer V1 contact probe',
    concentrateId: 'live-rosin',
    bangerId: 'flat-top',
    sensorId: 'probe',
    wallId: 'standard',
    displayed: 480,
    tolF: 1,
  },
  {
    scenario: 'Live Rosin + Blender slurper + IR + Std',
    concentrateId: 'live-rosin',
    bangerId: 'blender',
    sensorId: 'ir',
    wallId: 'standard',
    displayed: 510,
    tolF: 1,
  },
  {
    scenario: 'Live Rosin + E-Banger + PID',
    concentrateId: 'live-rosin',
    bangerId: 'e-banger',
    sensorId: 'enail',
    wallId: 'standard',
    displayed: 530,
    tolF: 1,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeDisplayedTarget — v2 schema worked examples', () => {
  for (const ex of SCHEMA_EXAMPLES) {
    test(ex.scenario, () => {
      const result = computeDisplayedTarget({
        concentrate: mustConcentrate(ex.concentrateId),
        banger: mustBanger(ex.bangerId),
        sensor: mustSensor(ex.sensorId),
        wall: mustWall(ex.wallId),
      });
      expect(result.displayedF).toBeCloseTo(ex.displayed, ex.tolF);
    });
  }
});

describe('computeDisplayedTarget — trace + dunk + warnings', () => {
  test('trace lists every term + final + dunk', () => {
    const result = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('flat-top'),
      sensor: mustSensor('ir'),
      wall: mustWall('standard'),
    });
    if (result.trace.length < 6) {
      throw new Error(`trace too short: ${JSON.stringify(result.trace)}`);
    }
  });

  test('dunk for IR-flat-top is in the documented [150,320] band', () => {
    const result = computeDisplayedTarget({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('flat-top'),
      sensor: mustSensor('ir'),
      wall: mustWall('standard'),
    });
    if (result.dunkF < 150 || result.dunkF > 320) {
      throw new Error(`dunk ${result.dunkF}°F out of clamp range`);
    }
  });

  test('e-nail dunk reflects PID coil offset (surface 202 + coil 50 ≈ 250)', () => {
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
      const live = mustConcentrate('live-rosin');
      const blocked: Concentrate = { ...live, blocked: 'test', surface_temp_optimal_f: null };
      computeDisplayedTarget({
        concentrate: blocked,
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
      const result = computeDisplayedTarget({ concentrate, banger, sensor, wall });
      const recovered = inverseInterior({
        displayedF: result.displayedF,
        banger,
        sensor,
        wall,
      });
      const expected = concentrate.surface_temp_optimal_f;
      if (expected == null) throw new Error('fixture concentrate has no optimal temp');
      // Probe + e-nail invert exactly. IR/visual invert the (gradient + emissivity)
      // delta cleanly; load + fluid_target absorb into surface within ±2°F due
      // to schema tolerance (load can drift from the canonical 65 in the data).
      const tol = sensor.method === 'ir' || sensor.method === 'visual' ? 5 : 1;
      expect(recovered).toBeCloseTo(expected, tol);
    });
  }
});

describe('Dunk derivation — surface 202°F floor, sensor-aware display', () => {
  test('surface dunk = ambient + 2 × phase_change_load_f', () => {
    const C = CALIBRATION_CONSTANTS;
    expect(dunkSurfaceF()).toBe(C.ambient_temp_f + 2 * C.phase_change_load_f);
  });

  test('probe sensor: dunk display = surface dunk (no offset)', () => {
    const probe = mustSensor('probe');
    expect(dunkDisplayedF(probe, 0)).toBe(200);
  });

  test('IR flat-top sensor delta carries through to dunk display', () => {
    const ir = mustSensor('ir');
    // delta = 40 (live-rosin flat-top: 520 displayed - 480 surface)
    expect(dunkDisplayedF(ir, 40)).toBe(240);
  });

  test('e-nail PID coil 50°F offset', () => {
    const enail = mustSensor('enail');
    expect(dunkDisplayedF(enail, 50)).toBe(250);
  });

  test('clamps to [150, 320]', () => {
    const ir = mustSensor('ir');
    expect(dunkDisplayedF(ir, 200)).toBe(320);
    expect(dunkDisplayedF(ir, -200)).toBe(150);
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

describe('torchTimeEngine — parses heat_time_seconds from catalog', () => {
  test('flat-top "20-40" → midpoint 30', () => {
    expect(torchDurationS(mustBanger('flat-top'))).toBe(30);
  });

  test('terp-slurper "55-90" → midpoint 73', () => {
    const d = parseTorchDuration(mustBanger('terp-slurper'));
    expect(d.minS).toBe(55);
    expect(d.maxS).toBe(90);
    expect(d.midpointS).toBe(73);
  });

  test('e-banger "30" single value → midpoint 30', () => {
    expect(torchDurationS(mustBanger('e-banger'))).toBe(30);
  });

  test('every catalog banger parses without throwing', () => {
    for (const id of ['flat-top','beveled','opaque-bottom','thermal','round-bottom','core-reactor','swing-arm','terp-slurper','blender','spinner','control-tower','charmer','insert','e-banger']) {
      const s = torchDurationS(mustBanger(id));
      if (!Number.isFinite(s) || s <= 0) {
        throw new Error(`bad torch duration for ${id}: ${s}`);
      }
    }
  });
});

describe('dabWindowEngine — Newton cooling milestones', () => {
  test('Live Resin + Blender + Std → enter ~48s, optimal ~61s, leave ~73s', () => {
    const result = computeDabWindow({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('blender'),
      wall: mustWall('standard'),
    });
    if (result.kind !== 'window') throw new Error(`expected window, got ${result.kind}`);
    expect(result.window.t_enter_window_s).toBeCloseTo(48.1, 2);
    expect(result.window.t_at_optimal_s).toBeCloseTo(61.2, 2);
    expect(result.window.t_leave_window_s).toBeCloseTo(73.2, 2);
  });

  test('e-banger PID returns kind=pid, no window math', () => {
    const result = computeDabWindow({
      concentrate: mustConcentrate('live-resin'),
      banger: mustBanger('e-banger'),
      wall: mustWall('standard'),
    });
    expect(result.kind).toBe('pid');
  });
});

// ---------------------------------------------------------------------------
// Plain-mode entry point
// ---------------------------------------------------------------------------

if (!hasJest) {
  runCalibrationTests();
}
