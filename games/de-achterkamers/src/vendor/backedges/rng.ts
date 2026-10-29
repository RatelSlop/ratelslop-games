/**
 * Random-number-generation primitives and deterministic coordinate hashing.
 *
 * The generator draws a hard line between two kinds of randomness:
 *
 * - **Structural randomness** (which edges are walls, where rooms cluster) is
 *   derived exclusively from the integer hash helpers in this file. It never
 *   touches the pluggable RNG, so the maze layout is fixed by the seed alone.
 * - **Cosmetic randomness** (per-edge extrusion metadata) is drawn from a
 *   {@link Rng} produced by a {@link RngFactory}. Consumers may replace this
 *   factory to change only the metadata, never the layout.
 */

/**
 * A stateful pseudo-random number generator.
 *
 * Implementations must return values in the half-open interval `[0, 1)` and be
 * deterministic for a given construction seed.
 */
export interface Rng {
  /** Returns the next value in `[0, 1)`. */
  next(): number;
}

/**
 * Constructs an {@link Rng} from a 32-bit unsigned integer seed.
 *
 * Supplying a custom factory (seeded PRNG, Perlin/Simplex sampler, or any
 * deterministic function) is the supported extension point for cosmetic
 * metadata variation.
 */
export type RngFactory = (seed: number) => Rng;

/**
 * `mulberry32` PRNG. Small, fast, and good enough for cosmetic variation.
 *
 * @param seed - 32-bit unsigned integer seed.
 * @returns A deterministic {@link Rng}.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** The factory used when configuration does not specify one. */
export const defaultRngFactory: RngFactory = mulberry32;

/**
 * Mixes a 32-bit integer using a finalizer derived from MurmurHash3.
 *
 * @param value - Any 32-bit integer.
 * @returns A well-distributed 32-bit unsigned integer.
 */
export function mix32(value: number): number {
  let h = value | 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Combines a running hash with another integer. Order-sensitive.
 *
 * @param hash - Running hash accumulator.
 * @param value - Integer to fold in.
 * @returns Updated 32-bit unsigned hash.
 */
export function hashCombine(hash: number, value: number): number {
  let h = (hash ^ mix32(value | 0)) >>> 0;
  h = Math.imul(h, 0x9e3779b1) >>> 0;
  h = ((h << 13) | (h >>> 19)) >>> 0;
  return h >>> 0;
}

/**
 * Deterministically hashes a seed and an integer coordinate pair.
 *
 * The same inputs always produce the same output, which is what makes the maze
 * reproducible and consistent on backtrack without storing visited cells.
 *
 * @param seed - The maze seed.
 * @param x - Integer X coordinate (may be negative).
 * @param y - Integer Y coordinate (may be negative).
 * @param salt - Optional channel selector so independent values can be drawn
 * from one coordinate (defaults to `0`).
 * @returns A 32-bit unsigned hash.
 */
export function hashCoords(seed: number, x: number, y: number, salt = 0): number {
  let h = mix32(seed | 0);
  h = hashCombine(h, x);
  h = hashCombine(h, y);
  h = hashCombine(h, salt);
  return h >>> 0;
}

/**
 * Maps a 32-bit unsigned hash to a float in `[0, 1)`.
 *
 * @param hash - A 32-bit unsigned integer.
 * @returns A float in `[0, 1)`.
 */
export function unitFromHash(hash: number): number {
  return (hash >>> 0) / 4294967296;
}
