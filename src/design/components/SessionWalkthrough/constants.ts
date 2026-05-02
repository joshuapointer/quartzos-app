import { findBanger } from '../../../data/bangers';
import { findConcentrate } from '../../../data/concentrates';
import { findSensor } from '../../../data/sensors';
import { findWallThickness } from '../../../data/wallThicknesses';

// ─── Ring geometry ───────────────────────────────────────────────────────────

export const DEFAULT_HEAT_FALLBACK_S = 30;
export const RING_RADIUS = 110;
export const RING_STROKE = 6;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Fallback catalog entries ────────────────────────────────────────────────

function mustFind<T>(value: T | undefined, label: string): T {
  if (!value) throw new Error(`SessionWalkthrough: required catalog entry missing: ${label}`);
  return value;
}

export const FALLBACK_BANGER = mustFind(findBanger('flat-top'), 'banger:flat-top');
export const FALLBACK_CONCENTRATE = mustFind(findConcentrate('live-resin'), 'concentrate:live-resin');
export const FALLBACK_SENSOR = mustFind(findSensor('ir'), 'sensor:ir');
export const FALLBACK_WALL = mustFind(findWallThickness('standard'), 'wall:standard');
