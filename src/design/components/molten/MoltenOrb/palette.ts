// Orb radial-gradient stop colors.
// Cold ramp: cool-blue highlight → periwinkle mid → deep purple → near-black.
// Hot ramp:  bright cyan highlight → cyan-purple mid → vivid purple → near-black.
// tempK (0–1) linearly interpolates between the two ramps.

type StopColor = string;

interface Ramp {
  s0: [number, number, number]; // stop 0  — highlight
  s1: [number, number, number]; // stop 38% — mid
  s2: [number, number, number]; // stop 80% — deep
  s3: [number, number, number]; // stop 100% — core
}

// Hex-approximate of the HTML oklch values (lavalamp personality, cold state).
const COLD: Ramp = {
  s0: [0xc8, 0xe0, 0xf5], // oklch(0.96 0.05 220) ≈ #c8e0f5
  s1: [0x68, 0xa8, 0xd8], // oklch(0.74 0.10 215) ≈ #68a8d8
  s2: [0x2e, 0x1e, 0x5c], // oklch(0.36 0.10 270) ≈ #2e1e5c
  s3: [0x0e, 0x0a, 0x22], // oklch(0.16 0.06 250) ≈ #0e0a22
};

// Hot state: brighter cyan core with magenta drift.
const HOT: Ramp = {
  s0: [0xb8, 0xf2, 0xff], // bright cyan highlight
  s1: [0x3a, 0xcd, 0xf0], // prismCyan #3acdf0
  s2: [0x6a, 0x18, 0x6e], // purple-magenta deep
  s3: [0x08, 0x04, 0x18], // near-black core
};

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function toHex(r: number, g: number, b: number): string {
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

function lerpStop(cold: [number, number, number], hot: [number, number, number], t: number): StopColor {
  return toHex(lerp(cold[0], hot[0], t), lerp(cold[1], hot[1], t), lerp(cold[2], hot[2], t));
}

/**
 * Returns a 4-stop color array for the orb radial-gradient body.
 * @param tempK  0 = cold, 1 = fully heated
 */
export function getOrbStops(tempK: number): [StopColor, StopColor, StopColor, StopColor] {
  const t = Math.max(0, Math.min(1, tempK));
  return [
    lerpStop(COLD.s0, HOT.s0, t),
    lerpStop(COLD.s1, HOT.s1, t),
    lerpStop(COLD.s2, HOT.s2, t),
    lerpStop(COLD.s3, HOT.s3, t),
  ];
}
