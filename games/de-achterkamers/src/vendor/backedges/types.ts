/**
 * Core geometric and structural types for the maze.
 *
 * Coordinate conventions:
 * - **Cell coordinates** (`cx`, `cy`) are integers indexing the infinite grid.
 * - **Plane coordinates** (`x`, `y`) are continuous units in the 2D plane,
 *   obtained by scaling cell coordinates by the configured cell size.
 * - Axis mapping for the three tunable dimensions:
 *   - `width`  -> extent along the plane X axis (cell footprint)
 *   - `height` -> extent along the plane Y axis (cell footprint)
 *   - `depth`  -> extent along the future extrusion Z axis (wall/ceiling height)
 */

/** A point in continuous 2D plane coordinates. */
export interface Vec2 {
  x: number;
  y: number;
}

/** The four cardinal directions an edge or movement can take. */
export type Direction = 'north' | 'east' | 'south' | 'west';

/** Ordered list of directions, useful for deterministic iteration. */
export const DIRECTIONS: readonly Direction[] = ['north', 'east', 'south', 'west'];

/**
 * Classifies the open character of a cell.
 *
 * - `corridor` - a narrow through-passage.
 * - `room` - part of an organic, blob-shaped merged open area.
 * - `hall` - part of a rare, bounded rectangular open space that may hold props.
 * - `atrium` - part of a very rare, larger rectangular open space that is always
 *   fully open and never holds props.
 */
export type CellKind = 'corridor' | 'room' | 'hall' | 'atrium';

/**
 * A hint describing the surface material an edge should adopt when extruded.
 *
 * These are evocative defaults; consumers driving 3D rendering may map them to
 * their own material library.
 */
export type SurfaceType =
  | 'drywall'
  | 'wallpaper'
  | 'paneling'
  | 'concrete'
  | 'tile'
  | 'carpet';

/** Ordered surface palette indexed by the cosmetic RNG. */
export const SURFACE_TYPES: readonly SurfaceType[] = [
  'drywall',
  'wallpaper',
  'paneling',
  'concrete',
  'tile',
  'carpet',
];

/**
 * Per-edge metadata produced for future 3D extrusion and material rendering.
 *
 * Every field here is cosmetic: it is drawn from the pluggable RNG and has no
 * effect on which edges are walls or where the player may move. Swapping the
 * RNG strategy changes these values and nothing else.
 */
export interface EdgeMetadata {
  /** Base wall height along the extrusion (Z) axis, in plane units. */
  heightBase: number;
  /** Permitted random deviation from {@link heightBase}, in plane units. */
  heightVariance: number;
  /** Wall thickness along the extrusion (Z) axis, in plane units. */
  thickness: number;
  /** Suggested surface material for the extruded face. */
  surfaceType: SurfaceType;
  /** Stable per-edge seed a renderer can use to vary texture/material detail. */
  materialSeed: number;
  /** Whether this edge bounds a room or a corridor. */
  classification: CellKind;
}

/**
 * A single boundary line of a cell.
 *
 * The line segment ({@link start} -> {@link end}) is expressed in plane
 * coordinates so it can be consumed directly by a renderer or an extrusion
 * pass. A non-solid edge is a passage the player may cross.
 */
export interface MazeEdge {
  /** Which side of the cell this edge occupies. */
  direction: Direction;
  /** `true` when the edge is a wall, `false` when it is an open passage. */
  solid: boolean;
  /** Start point of the boundary line, in plane coordinates. */
  start: Vec2;
  /** End point of the boundary line, in plane coordinates. */
  end: Vec2;
  /** Cosmetic metadata for downstream 3D extrusion. */
  metadata: EdgeMetadata;
}

/**
 * A standalone interior element that can occupy an open cell, such as a column
 * or a piece of furniture. Features are an attachment target for props in a
 * renderer; they never block the structural passability test.
 */
export type FeatureKind = 'column' | 'furniture';

/** Ordered feature palette indexed by the structural hash. */
export const FEATURE_KINDS: readonly FeatureKind[] = ['column', 'furniture'];

/**
 * A deterministic interior prop placed inside an open cell.
 *
 * Position and footprint are expressed in plane coordinates so a renderer can
 * place the prop directly; `variantSeed` is a stable per-feature seed for
 * choosing a model, rotation, or material variation.
 */
export interface CellFeature {
  /** The kind of prop occupying the cell. */
  kind: FeatureKind;
  /** Center of the prop, in plane coordinates. */
  position: Vec2;
  /** Approximate footprint radius of the prop, in plane units. */
  size: number;
  /** Stable seed a renderer can use to vary the prop's appearance. */
  variantSeed: number;
}

/** The three tunable dimensions of a generated cell, in plane units. */
export interface CellDimensions {
  /** Footprint extent along the plane X axis. */
  width: number;
  /** Footprint extent along the plane Y axis. */
  height: number;
  /** Extrusion extent along the future Z axis. */
  depth: number;
}

/**
 * A fully realized maze cell at integer grid coordinates.
 *
 * Cells are produced on demand and are pure functions of the seed and their
 * coordinates, which is what allows infinite generation with no precomputed
 * bounds.
 */
export interface MazeCell {
  /** Integer cell X coordinate. */
  cx: number;
  /** Integer cell Y coordinate. */
  cy: number;
  /** Whether this cell reads as a corridor or a room. */
  kind: CellKind;
  /** Axis-aligned footprint of the cell, in plane coordinates. */
  bounds: { min: Vec2; max: Vec2 };
  /** The cell's tunable dimensions. */
  dimensions: CellDimensions;
  /** The four boundary edges keyed by direction. */
  edges: Record<Direction, MazeEdge>;
  /** An interior prop occupying the cell, or `null` when empty. */
  feature: CellFeature | null;
}

/** Returns the opposite of a cardinal direction. */
export function opposite(direction: Direction): Direction {
  switch (direction) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

/** Returns the unit cell-coordinate step for a direction (north is -Y). */
export function step(direction: Direction): { dx: number; dy: number } {
  switch (direction) {
    case 'north':
      return { dx: 0, dy: -1 };
    case 'south':
      return { dx: 0, dy: 1 };
    case 'east':
      return { dx: 1, dy: 0 };
    case 'west':
      return { dx: -1, dy: 0 };
  }
}
