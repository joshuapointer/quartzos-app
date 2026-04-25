export function checksum(bytes: Uint8Array | number[]): number {
  let sum = 0;
  for (const b of bytes) sum = (sum + b) & 0xFF;
  return sum;
}
