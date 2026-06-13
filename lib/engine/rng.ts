// Deterministic, seedable pseudo-random number generator (mulberry32).
// All randomness in the simulation flows through this so that a given seed
// always produces the same game — essential for reproducible single/multi play
// and for testing.

export interface RngState {
  seed: number;
}

/** Create a fresh RNG state from a numeric seed. */
export function createRng(seed: number): RngState {
  // Avoid a zero state which would collapse the generator.
  return { seed: (seed | 0) || 1 };
}

/** Advance the generator and return a float in [0, 1). Mutates state. */
export function nextFloat(state: RngState): number {
  let t = (state.seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Random integer in [min, max] inclusive. */
export function nextInt(state: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(state) * (max - min + 1));
}

/** Random float in [min, max). */
export function nextRange(state: RngState, min: number, max: number): number {
  return min + nextFloat(state) * (max - min);
}

/** Approximate standard-normal sample via averaging (Irwin–Hall). */
export function nextGaussian(state: RngState, mean = 0, stdev = 1): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += nextFloat(state);
  // sum has mean 3, variance 0.5 -> normalise to mean 0, stdev 1
  return mean + ((sum - 3) / Math.sqrt(0.5)) * stdev;
}

/** Return true with the given probability (0..1). */
export function chance(state: RngState, probability: number): boolean {
  return nextFloat(state) < probability;
}

/** Pick a random element from a non-empty array. */
export function pick<T>(state: RngState, items: readonly T[]): T {
  return items[nextInt(state, 0, items.length - 1)];
}

/** Weighted pick: items paired with non-negative weights. */
export function weightedPick<T>(
  state: RngState,
  items: readonly { item: T; weight: number }[],
): T {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[0].item;
  let r = nextFloat(state) * total;
  for (const { item, weight } of items) {
    r -= Math.max(0, weight);
    if (r <= 0) return item;
  }
  return items[items.length - 1].item;
}

/** Shuffle a copy of the array (Fisher–Yates). */
export function shuffle<T>(state: RngState, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(state, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
