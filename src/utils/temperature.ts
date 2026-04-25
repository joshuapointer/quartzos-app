export const fToC = (f: number): number => Math.round((f - 32) * 5 / 9);
export const cToF = (c: number): number => Math.round(c * 9 / 5 + 32);
export const formatTemp = (f: number, useCelsius: boolean): string =>
  useCelsius ? `${fToC(f)}°C` : `${f}°F`;
