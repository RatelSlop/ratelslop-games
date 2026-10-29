/**
 * The framework-agnostic core: an infinite, deterministic, memoized maze.
 *
 * Structural decisions (walls vs. passages, room vs. corridor, footprint) are
 * pure functions of the seed and integer cell coordinates, computed from the
 * integer hash helpers. Nothing structural depends on the pluggable RNG, so the
 * layout is fixed by the seed alone and is identical every time a cell is
 * revisited. The pluggable RNG only colors the cosmetic edge metadata.
 */

import { MazeConfig, ResolvedConfig, resolveConfig } from './config';
import { hashCoords, unitFromHash } from './rng';
import {
  CellDimensions,
  CellFeature,
  CellKind,
  Direction,
  DIRECTIONS,
  EdgeMetadata,
  FeatureKind,
  FEATURE_KINDS,
  MazeCell,
  MazeEdge,
  opposite,
  step,
  SurfaceType,
  SURFACE_TYPES,
  Vec2,
} from './types';

/** Hash channel selectors keep independent draws from colliding. */
const SALT = {
  /** Openness of the vertical edge east of a cell. */
  edgeVertical: 0x01,
  /** Openness of the horizontal edge south of a cell. */
  edgeHorizontal: 0x02,
  /** Coarse room/corridor value-noise lattice. */
  roomNoise: 0x03,
  width: 0x10,
  height: 0x11,
  depth: 0x12,
  /** Whether a cell anchors a rectangular hall. */
  hallAnchor: 0x30,
  /** Hall width in cells. */
  hallWidth: 0x31,
  /** Hall height in cells. */
  hallHeight: 0x32,
  /** Whether a cell anchors a fully open atrium. */
  atriumAnchor: 0x50,
  /** Atrium base width draw. */
  atriumWidth: 0x51,
  /** Atrium base height draw. */
  atriumHeight: 0x52,
  /** Atrium width variance draw. */
  atriumVarWidth: 0x53,
  /** Atrium height variance draw. */
  atriumVarHeight: 0x54,
  /** Whether an open cell holds an interior prop. */
  prop: 0x40,
  /** Which kind of prop a cell holds. */
  propKind: 0x41,
  /** Prop position within its cell. */
  propPositionX: 0x42,
  propPositionY: 0x43,
  /** Prop footprint size. */
  propSize: 0x44,
  /** Stable per-prop cosmetic seed. */
  propVariant: 0x45,
  /** Seed channel for cosmetic edge metadata. */
  material: 0x20,
} as const;

/** Lattice spacing (in cells) for the room value-noise field. */
const ROOM_LATTICE = 3;

/** Atrium base size relative to a hall: 5% larger. */
const ATRIUM_SIZE_FACTOR = 1.05;

/** Symmetric per-side size variance applied to an atrium: +/-10%. */
const ATRIUM_SIZE_VARIANCE = 0.1;

/** Smoothstep easing for value-noise interpolation. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Linear interpolation. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Identity of the shared edge crossed when leaving a cell in `direction`. */
function edgeKey(
  cx: number,
  cy: number,
  direction: Direction,
): { ex: number; ey: number; salt: number } {
  switch (direction) {
    case 'east':
      return { ex: cx, ey: cy, salt: SALT.edgeVertical };
    case 'west':
      return { ex: cx - 1, ey: cy, salt: SALT.edgeVertical };
    case 'south':
      return { ex: cx, ey: cy, salt: SALT.edgeHorizontal };
    case 'north':
      return { ex: cx, ey: cy - 1, salt: SALT.edgeHorizontal };
  }
}

/**
 * Snapshot of cache behavior, useful for verifying memoization in tests and for
 * tuning {@link MazeConfig.cacheLimit} under extended play.
 */
export interface CacheStats {
  /** Cells currently held in the cache. */
  size: number;
  /** Configured maximum (`0` means unbounded). */
  limit: number;
  /** Cumulative cache hits. */
  hits: number;
  /** Cumulative cache misses (cells computed from scratch). */
  misses: number;
  /** Cumulative cells evicted due to the LRU limit. */
  evictions: number;
}

/**
 * Generates and memoizes maze cells on an infinite integer grid.
 *
 * The generator owns no rendering or input concerns; it is safe to embed in any
 * host (web app, IDE extension, GUI framework, or headless tooling).
 */
export class MazeGenerator {
  /** The resolved, frozen configuration in effect for this generator. */
  readonly config: ResolvedConfig;

  private readonly cache = new Map<string, MazeCell>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  /**
   * @param config - Partial configuration; omitted fields take their defaults.
   */
  constructor(config: Partial<MazeConfig> = {}) {
    this.config = resolveConfig(config);
  }

  /** String key for the cache and lookups. */
  private static key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  /**
   * Returns the cell at the given integer coordinates, computing it on first
   * access and serving it from the LRU cache thereafter. Repeated calls return
   * structurally identical cells regardless of cache state.
   */
  getCell(cx: number, cy: number): MazeCell {
    const key = MazeGenerator.key(cx, cy);
    const cached = this.cache.get(key);
    if (cached) {
      this.hits++;
      // Refresh LRU recency.
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    this.misses++;
    const cell = this.computeCell(cx, cy);
    this.cache.set(key, cell);
    this.evictIfNeeded();
    return cell;
  }

  /** Returns every cell whose coordinates fall in the inclusive rectangle. */
  getRegion(minCx: number, minCy: number, maxCx: number, maxCy: number): MazeCell[] {
    const cells: MazeCell[] = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        cells.push(this.getCell(cx, cy));
      }
    }
    return cells;
  }

  /**
   * Whether the player may cross from `(cx, cy)` in `direction`.
   *
   * This is the authoritative movement test and is symmetric: crossing an edge
   * from either side yields the same answer. An edge is open when any of the
   * following holds, all of which both adjacent cells compute identically:
   *
   * - both cells belong to the same atrium (its fully open interior);
   * - both cells belong to the same rectangular hall (its open interior);
   * - both cells are rooms (interior of a merged blob-shaped open area);
   * - the edge is open by base density; or
   * - either cell braids the edge open to reach {@link MazeConfig.minConnections}.
   */
  isPassable(cx: number, cy: number, direction: Direction): boolean {
    const { dx, dy } = step(direction);
    const nx = cx + dx;
    const ny = cy + dy;

    // Cells of one atrium share no interior walls; the atrium reads as one space.
    const atrium = this.atriumIdOf(cx, cy);
    if (atrium !== null && atrium === this.atriumIdOf(nx, ny)) {
      return true;
    }
    // An atrium's perimeter is governed by base density and braiding only, so
    // skip the hall/room merges when either side belongs to an atrium.
    if (atrium === null && this.atriumIdOf(nx, ny) === null) {
      const hall = this.hallIdOf(cx, cy);
      if (hall !== null && hall === this.hallIdOf(nx, ny)) {
        return true;
      }
      // Adjacent room cells share no wall, so a room cluster reads as one space.
      if (this.isRoom(cx, cy) && this.isRoom(nx, ny)) {
        return true;
      }
    }
    if (this.baseOpen(cx, cy, direction)) {
      return true;
    }
    // Braiding: each cell forces its lowest-hash edges open until it has at
    // least minConnections passages, which removes dead ends.
    if (this.forcedDirections(cx, cy).includes(direction)) {
      return true;
    }
    return this.forcedDirections(nx, ny).includes(opposite(direction));
  }

  /** Whether a cell belongs to a blob-shaped room. */
  isRoom(cx: number, cy: number): boolean {
    return this.classify(cx, cy) === 'room';
  }

  /** Whether a cell belongs to a prop-bearing rectangular hall. */
  isHall(cx: number, cy: number): boolean {
    return this.classify(cx, cy) === 'hall';
  }

  /** Whether a cell belongs to a fully open atrium. */
  isAtrium(cx: number, cy: number): boolean {
    return this.classify(cx, cy) === 'atrium';
  }

  /** Empties the cache without affecting determinism of future cells. */
  clearCache(): void {
    this.cache.clear();
  }

  /** Returns a snapshot of cache behavior. */
  stats(): CacheStats {
    return {
      size: this.cache.size,
      limit: this.config.cacheLimit,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  // --- Structural generation (seed-only, no pluggable RNG) -----------------

  /** Raw openness of the shared edge before braiding is applied. */
  private baseOpen(cx: number, cy: number, direction: Direction): boolean {
    const { ex, ey, salt } = edgeKey(cx, cy, direction);
    return unitFromHash(hashCoords(this.config.seed, ex, ey, salt)) < this.config.passageDensity;
  }

  /** Raw hash of a cell's edge in a direction, used to order braid choices. */
  private edgeHash(cx: number, cy: number, direction: Direction): number {
    const { ex, ey, salt } = edgeKey(cx, cy, direction);
    return hashCoords(this.config.seed, ex, ey, salt);
  }

  /**
   * Directions a cell forcibly opens to reach {@link MazeConfig.minConnections}
   * passages. The lowest-hash sealed edges are chosen first. Depends only on the
   * cell's own four edges, so both sides of any edge agree on the result, which
   * keeps passability symmetric.
   */
  private forcedDirections(cx: number, cy: number): Direction[] {
    const min = this.config.minConnections;
    if (min <= 0) {
      return [];
    }
    let openCount = 0;
    const sealed: { direction: Direction; hash: number }[] = [];
    for (const direction of DIRECTIONS) {
      if (this.baseOpen(cx, cy, direction)) {
        openCount++;
      } else {
        sealed.push({ direction, hash: this.edgeHash(cx, cy, direction) });
      }
    }
    const need = min - openCount;
    if (need <= 0) {
      return [];
    }
    sealed.sort((a, b) => a.hash - b.hash);
    return sealed.slice(0, need).map((entry) => entry.direction);
  }

  /** Coarse, smoothed value-noise field driving room clustering. */
  private roomNoise(cx: number, cy: number): number {
    const gx = Math.floor(cx / ROOM_LATTICE);
    const gy = Math.floor(cy / ROOM_LATTICE);
    const fx = smoothstep(cx / ROOM_LATTICE - gx);
    const fy = smoothstep(cy / ROOM_LATTICE - gy);
    const corner = (ix: number, iy: number): number =>
      unitFromHash(hashCoords(this.config.seed, ix, iy, SALT.roomNoise));
    const top = lerp(corner(gx, gy), corner(gx + 1, gy), fx);
    const bottom = lerp(corner(gx, gy + 1), corner(gx + 1, gy + 1), fx);
    return lerp(top, bottom, fy);
  }

  /**
   * Width and height (in cells) of the hall anchored at `(ax, ay)`, or `null`
   * when the anchor does not spawn one. Pure function of the anchor coordinates.
   */
  private hallSpawn(ax: number, ay: number): { w: number; h: number } | null {
    if (this.config.hallFrequency <= 0) {
      return null;
    }
    if (unitFromHash(hashCoords(this.config.seed, ax, ay, SALT.hallAnchor)) >= this.config.hallFrequency) {
      return null;
    }
    const { min, max } = this.config.hallSize;
    const span = max - min + 1;
    const pick = (salt: number): number =>
      min + Math.min(span - 1, Math.floor(unitFromHash(hashCoords(this.config.seed, ax, ay, salt)) * span));
    return { w: pick(SALT.hallWidth), h: pick(SALT.hallHeight) };
  }

  /**
   * Canonical identifier of the hall covering a cell, or `null` when the cell is
   * not in a hall. Only anchors within {@link MazeConfig.hallSize}`.max` of the
   * cell can possibly cover it, so the scan is bounded and stateless. When
   * rectangles overlap, the lowest-hash anchor wins, so both sides of any edge
   * agree on hall membership.
   */
  private hallIdOf(cx: number, cy: number): string | null {
    const maxSide = this.config.hallSize.max;
    let best: { ax: number; ay: number; hash: number } | null = null;
    for (let ay = cy - (maxSide - 1); ay <= cy; ay++) {
      for (let ax = cx - (maxSide - 1); ax <= cx; ax++) {
        const spawn = this.hallSpawn(ax, ay);
        if (!spawn) {
          continue;
        }
        if (cx >= ax && cx < ax + spawn.w && cy >= ay && cy < ay + spawn.h) {
          const hash = hashCoords(this.config.seed, ax, ay, SALT.hallAnchor);
          if (best === null || hash < best.hash) {
            best = { ax, ay, hash };
          }
        }
      }
    }
    return best ? `${best.ax},${best.ay}` : null;
  }

  /** Largest possible atrium side length in cells, bounding the anchor scan. */
  private atriumMaxSide(): number {
    return Math.max(2, Math.round(this.config.hallSize.max * ATRIUM_SIZE_FACTOR * (1 + ATRIUM_SIZE_VARIANCE)));
  }

  /**
   * Width and height (in cells) of the atrium anchored at `(ax, ay)`, or `null`
   * when the anchor does not spawn one. Each side is drawn like a hall side and
   * then scaled up by {@link ATRIUM_SIZE_FACTOR} with a per-side
   * {@link ATRIUM_SIZE_VARIANCE}, so atriums run a little larger than halls.
   */
  private atriumSpawn(ax: number, ay: number): { w: number; h: number } | null {
    if (this.config.atriumFrequency <= 0) {
      return null;
    }
    if (unitFromHash(hashCoords(this.config.seed, ax, ay, SALT.atriumAnchor)) >= this.config.atriumFrequency) {
      return null;
    }
    const { min, max } = this.config.hallSize;
    const span = max - min + 1;
    const side = (sizeSalt: number, varianceSalt: number): number => {
      const baseCells =
        min + Math.min(span - 1, Math.floor(unitFromHash(hashCoords(this.config.seed, ax, ay, sizeSalt)) * span));
      const variance = (unitFromHash(hashCoords(this.config.seed, ax, ay, varianceSalt)) * 2 - 1) * ATRIUM_SIZE_VARIANCE;
      return Math.max(2, Math.round(baseCells * ATRIUM_SIZE_FACTOR * (1 + variance)));
    };
    return {
      w: side(SALT.atriumWidth, SALT.atriumVarWidth),
      h: side(SALT.atriumHeight, SALT.atriumVarHeight),
    };
  }

  /**
   * Canonical identifier of the atrium covering a cell, or `null`. Mirrors
   * {@link hallIdOf}: bounded, stateless, and lowest-hash-anchor canonical so
   * both sides of any edge agree on membership.
   */
  private atriumIdOf(cx: number, cy: number): string | null {
    const maxSide = this.atriumMaxSide();
    let best: { ax: number; ay: number; hash: number } | null = null;
    for (let ay = cy - (maxSide - 1); ay <= cy; ay++) {
      for (let ax = cx - (maxSide - 1); ax <= cx; ax++) {
        const spawn = this.atriumSpawn(ax, ay);
        if (!spawn) {
          continue;
        }
        if (cx >= ax && cx < ax + spawn.w && cy >= ay && cy < ay + spawn.h) {
          const hash = hashCoords(this.config.seed, ax, ay, SALT.atriumAnchor);
          if (best === null || hash < best.hash) {
            best = { ax, ay, hash };
          }
        }
      }
    }
    return best ? `${best.ax},${best.ay}` : null;
  }

  /** Resolves the open-character classification of a cell. */
  private classify(cx: number, cy: number): CellKind {
    if (this.atriumIdOf(cx, cy) !== null) {
      return 'atrium';
    }
    if (this.hallIdOf(cx, cy) !== null) {
      return 'hall';
    }
    if (this.roomNoise(cx, cy) < this.config.roomFrequency) {
      return 'room';
    }
    return 'corridor';
  }

  /** Footprint and extrusion dimensions for a cell. */
  private dimensions(cx: number, cy: number, kind: CellKind): CellDimensions {
    const { width, height, depth } = this.config;
    const draw = (salt: number): number => unitFromHash(hashCoords(this.config.seed, cx, cy, salt));
    if (kind === 'atrium') {
      // Atriums are the largest open spaces and read tallest of all.
      return { width: width.max, height: height.max, depth: depth.max };
    }
    if (kind === 'hall') {
      // Halls are open and read taller than the surrounding corridors.
      return {
        width: width.max,
        height: height.max,
        depth: lerp((depth.min + depth.max) / 2, depth.max, draw(SALT.depth)),
      };
    }
    if (kind === 'room') {
      return {
        width: lerp(width.min, width.max, draw(SALT.width)),
        height: lerp(height.min, height.max, draw(SALT.height)),
        depth: lerp(depth.min, depth.max, draw(SALT.depth)),
      };
    }
    // Corridors keep a uniform footprint; only the extrusion depth drifts so
    // hallways still vary in ceiling height along their length.
    return {
      width: width.max,
      height: height.max,
      depth: lerp(depth.min, depth.max, draw(SALT.depth)),
    };
  }

  /**
   * A deterministic interior prop for an open cell, or `null`. Props occur only
   * in rooms and halls and are gated by {@link MazeConfig.propFrequency}.
   */
  private feature(cx: number, cy: number, kind: CellKind): CellFeature | null {
    // Atriums stay fully open; props only ever appear in rooms and halls.
    if (kind === 'corridor' || kind === 'atrium' || this.config.propFrequency <= 0) {
      return null;
    }
    if (unitFromHash(hashCoords(this.config.seed, cx, cy, SALT.prop)) >= this.config.propFrequency) {
      return null;
    }
    const size = this.config.cellSize;
    const draw = (salt: number): number => unitFromHash(hashCoords(this.config.seed, cx, cy, salt));
    const featureKind: FeatureKind =
      FEATURE_KINDS[Math.min(FEATURE_KINDS.length - 1, Math.floor(draw(SALT.propKind) * FEATURE_KINDS.length))] ??
      FEATURE_KINDS[0]!;
    // Keep the prop within the central area of the cell.
    const fx = 0.3 + 0.4 * draw(SALT.propPositionX);
    const fy = 0.3 + 0.4 * draw(SALT.propPositionY);
    return {
      kind: featureKind,
      position: { x: cx * size + fx * size, y: cy * size + fy * size },
      size: lerp(0.08, 0.22, draw(SALT.propSize)) * size,
      variantSeed: hashCoords(this.config.seed, cx, cy, SALT.propVariant),
    };
  }

  /** Builds the full cell from its structural inputs. */
  private computeCell(cx: number, cy: number): MazeCell {
    const kind = this.classify(cx, cy);
    const size = this.config.cellSize;
    const x0 = cx * size;
    const y0 = cy * size;
    const x1 = x0 + size;
    const y1 = y0 + size;

    const corners: Record<Direction, { start: Vec2; end: Vec2 }> = {
      north: { start: { x: x0, y: y0 }, end: { x: x1, y: y0 } },
      south: { start: { x: x0, y: y1 }, end: { x: x1, y: y1 } },
      west: { start: { x: x0, y: y0 }, end: { x: x0, y: y1 } },
      east: { start: { x: x1, y: y0 }, end: { x: x1, y: y1 } },
    };

    const edges = {} as Record<Direction, MazeEdge>;
    for (const direction of DIRECTIONS) {
      const solid = !this.isPassable(cx, cy, direction);
      edges[direction] = {
        direction,
        solid,
        start: corners[direction].start,
        end: corners[direction].end,
        metadata: this.edgeMetadata(cx, cy, direction, kind),
      };
    }

    return {
      cx,
      cy,
      kind,
      bounds: { min: { x: x0, y: y0 }, max: { x: x1, y: y1 } },
      dimensions: this.dimensions(cx, cy, kind),
      edges,
      feature: this.feature(cx, cy, kind),
    };
  }

  // --- Cosmetic metadata (pluggable RNG) -----------------------------------

  /**
   * Builds per-edge extrusion metadata. The material seed is a structural hash
   * (stable across RNG swaps), but every cosmetic value is drawn from the
   * configured RNG factory, so changing the factory changes only this output.
   */
  private edgeMetadata(
    cx: number,
    cy: number,
    direction: Direction,
    classification: MazeCell['kind'],
  ): EdgeMetadata {
    const { ex, ey, salt } = edgeKey(cx, cy, direction);
    const materialSeed = hashCoords(this.config.seed, ex, ey, salt + SALT.material);
    const rng = this.config.rng(materialSeed);
    const { depth } = this.config;

    const heightBase = lerp(depth.min, depth.max, rng.next());
    const heightVariance = lerp(0, (depth.max - depth.min) * 0.5, rng.next());
    const thickness = lerp(0.05, 0.2, rng.next());
    const surfaceType: SurfaceType =
      SURFACE_TYPES[Math.min(SURFACE_TYPES.length - 1, Math.floor(rng.next() * SURFACE_TYPES.length))] ??
      SURFACE_TYPES[0]!;

    return {
      heightBase,
      heightVariance,
      thickness,
      surfaceType,
      materialSeed,
      classification,
    };
  }

  /** Evicts least-recently-used cells when the cache exceeds its limit. */
  private evictIfNeeded(): void {
    const limit = this.config.cacheLimit;
    if (limit <= 0) {
      return;
    }
    while (this.cache.size > limit) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.cache.delete(oldest);
      this.evictions++;
    }
  }
}
