/**
 * Typed configuration for the maze API, with a single resolution function that
 * fills every field from sensible defaults.
 */

import { defaultRngFactory, RngFactory } from './rng';

/** An inclusive numeric range used for dimension bounds. */
export interface Range {
  /** Lower bound (inclusive). */
  min: number;
  /** Upper bound (inclusive). */
  max: number;
}

/**
 * Key bindings for the default GUI. Each action lists the keys that trigger it;
 * none of these are hardcoded in the GUI itself.
 */
export interface ControlBindings {
  moveNorth: string[];
  moveSouth: string[];
  moveEast: string[];
  moveWest: string[];
  /** Keys (or key combinations) that exit the standalone application. */
  exit: string[];
}

/**
 * The full configuration surface. Every field is optional at call time; pass a
 * partial object and {@link resolveConfig} supplies the rest.
 */
export interface MazeConfig {
  /** Seed controlling all structural generation. Same seed -> same maze. */
  seed: number;
  /** Size of one grid cell in plane units. */
  cellSize: number;
  /** Bounds for the cell footprint width (plane X extent). */
  width: Range;
  /** Bounds for the cell footprint height (plane Y extent). */
  height: Range;
  /** Bounds for the extrusion depth (future Z extent). */
  depth: Range;
  /**
   * Probability in `[0, 1]` that any given internal edge is an open passage
   * before {@link minConnections} braiding is applied. Higher values yield more
   * open, interconnected layouts.
   */
  passageDensity: number;
  /**
   * Minimum number of open edges every cell is guaranteed, in the range
   * `0..4`. A value of `2` braids the maze so no cell is a dead end, which lets
   * the player travel and backtrack endlessly. `1` only guarantees the maze is
   * traversable (dead ends allowed); `0` disables the guarantee entirely.
   */
  minConnections: number;
  /**
   * Threshold in `[0, 1]` controlling how often cells form rooms. Adjacent room
   * cells merge into a single open area, so even small values open up sizeable
   * spaces. Keep it low to apply rooms sparingly between corridor stretches.
   */
  roomFrequency: number;
  /**
   * Per-cell probability in `[0, 1]` of anchoring a rectangular open hall. Halls
   * are deliberately rare and bounded by {@link hallSize}; the default places
   * roughly 1% of cells inside a hall. These are the larger rectangular spaces
   * that occasionally open up as the player progresses.
   */
  hallFrequency: number;
  /**
   * Inclusive bounds, in cells, for a hall's side length. Both width and height
   * are drawn from this range, so halls stay rectangular without growing too
   * large.
   */
  hallSize: Range;
  /**
   * Probability in `[0, 1]` that an open cell (room or hall) holds an interior
   * prop such as a column or furniture. The default places a prop in roughly
   * 0.25% of all cells.
   */
  propFrequency: number;
  /**
   * Per-cell probability in `[0, 1]` of anchoring an atrium: a larger, always
   * fully open rectangular space that never holds props. Atriums are sized from
   * {@link hallSize} (about 5% larger than a hall, with 10% variance) and the
   * default keeps them very rare, covering roughly 0.1% of cells.
   */
  atriumFrequency: number;
  /** Factory producing the RNG used for cosmetic per-edge metadata. */
  rng: RngFactory;
  /** Key bindings for the default GUI. */
  controls: ControlBindings;
  /**
   * Maximum number of cells retained in the memoization cache. The least
   * recently used cells are evicted past this limit, bounding memory over
   * extended play. Set to `0` to disable eviction (unbounded cache).
   */
  cacheLimit: number;
}

/** A configuration with every field guaranteed present. */
export type ResolvedConfig = Readonly<MazeConfig>;

/** Default key bindings: WASD plus arrow keys, with Ctrl+C to exit. */
export const DEFAULT_CONTROLS: ControlBindings = {
  moveNorth: ['w', 'ArrowUp'],
  moveSouth: ['s', 'ArrowDown'],
  moveEast: ['d', 'ArrowRight'],
  moveWest: ['a', 'ArrowLeft'],
  exit: ['Ctrl+C'],
};

/** The default configuration applied when fields are omitted. */
export const DEFAULT_CONFIG: ResolvedConfig = {
  seed: 1,
  cellSize: 1,
  width: { min: 0.6, max: 1 },
  height: { min: 0.6, max: 1 },
  depth: { min: 2.5, max: 4 },
  passageDensity: 0.34,
  minConnections: 2,
  roomFrequency: 0.09,
  hallFrequency: 0.0011,
  hallSize: { min: 2, max: 4 },
  propFrequency: 0.082,
  atriumFrequency: 0.00014,
  rng: defaultRngFactory,
  controls: DEFAULT_CONTROLS,
  cacheLimit: 4096,
};

/** Clamps a value to an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalizes a range so `min <= max` and both are finite. */
function normalizeRange(range: Range | undefined, fallback: Range): Range {
  if (!range) {
    return { ...fallback };
  }
  const min = Number.isFinite(range.min) ? range.min : fallback.min;
  const max = Number.isFinite(range.max) ? range.max : fallback.max;
  return min <= max ? { min, max } : { min: max, max: min };
}

/** Normalizes a range to integers with `floor >= floor`, clamped to a minimum. */
function normalizeIntRange(range: Range | undefined, fallback: Range, lowerBound: number): Range {
  const base = normalizeRange(range, fallback);
  const min = Math.max(lowerBound, Math.trunc(base.min));
  const max = Math.max(min, Math.trunc(base.max));
  return { min, max };
}

/**
 * Merges a partial configuration over the defaults and validates bounds.
 *
 * Ranges are normalized so `min <= max`; probabilities are clamped to `[0, 1]`;
 * `cellSize` is forced positive; `cacheLimit` is forced to a non-negative
 * integer. Invalid individual fields fall back to their default rather than
 * throwing, so boundary inputs degrade gracefully.
 *
 * @param partial - Any subset of {@link MazeConfig} fields.
 * @returns A fully populated, frozen configuration.
 */
export function resolveConfig(partial: Partial<MazeConfig> = {}): ResolvedConfig {
  const seed = Number.isFinite(partial.seed) ? Math.trunc(partial.seed as number) : DEFAULT_CONFIG.seed;
  const cellSize =
    Number.isFinite(partial.cellSize) && (partial.cellSize as number) > 0
      ? (partial.cellSize as number)
      : DEFAULT_CONFIG.cellSize;

  return Object.freeze({
    seed,
    cellSize,
    width: normalizeRange(partial.width, DEFAULT_CONFIG.width),
    height: normalizeRange(partial.height, DEFAULT_CONFIG.height),
    depth: normalizeRange(partial.depth, DEFAULT_CONFIG.depth),
    passageDensity: Number.isFinite(partial.passageDensity)
      ? clamp(partial.passageDensity as number, 0, 1)
      : DEFAULT_CONFIG.passageDensity,
    minConnections: Number.isFinite(partial.minConnections)
      ? Math.trunc(clamp(partial.minConnections as number, 0, 4))
      : DEFAULT_CONFIG.minConnections,
    roomFrequency: Number.isFinite(partial.roomFrequency)
      ? clamp(partial.roomFrequency as number, 0, 1)
      : DEFAULT_CONFIG.roomFrequency,
    hallFrequency: Number.isFinite(partial.hallFrequency)
      ? clamp(partial.hallFrequency as number, 0, 1)
      : DEFAULT_CONFIG.hallFrequency,
    hallSize: normalizeIntRange(partial.hallSize, DEFAULT_CONFIG.hallSize, 1),
    propFrequency: Number.isFinite(partial.propFrequency)
      ? clamp(partial.propFrequency as number, 0, 1)
      : DEFAULT_CONFIG.propFrequency,
    atriumFrequency: Number.isFinite(partial.atriumFrequency)
      ? clamp(partial.atriumFrequency as number, 0, 1)
      : DEFAULT_CONFIG.atriumFrequency,
    rng: typeof partial.rng === 'function' ? partial.rng : DEFAULT_CONFIG.rng,
    controls: { ...DEFAULT_CONTROLS, ...(partial.controls ?? {}) },
    cacheLimit:
      Number.isFinite(partial.cacheLimit) && (partial.cacheLimit as number) >= 0
        ? Math.trunc(partial.cacheLimit as number)
        : DEFAULT_CONFIG.cacheLimit,
  });
}
