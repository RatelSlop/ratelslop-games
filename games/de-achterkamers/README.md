# De Achterkamers

A first-person Backrooms escape game for RatelSlop Games, set in a large maze assembled from the supplied Sketchfab model kit. Only photographic head cutouts pursue the player: Thomas, Mijke, Marola and Jaap. The player collects access passes and returns to the marked exit. Three difficulty settings, sprint stamina, flashlight, explored map, camera-motion reduction, local best times, touch controls, pause and retry are included. Every new match and retry rolls a fresh map seed, changing corridors, room positions and sizes, walls, pillars, objectives and enemy positions. Best times use a new storage key separate from the former fixed maze.

## Build

Node 24 or later:

```sh
npm ci
npm test
npm run build
```

Serve `dist/` as static assets. Asset URLs are relative, so the game can run from a hub subdirectory and inside an iframe. WebGL 2 is required. All assets and fonts are local after deployment. No backend or runtime GitHub calls are used.

## Controls

WASD / up-down arrows: move; mouse or drag: look; left-right arrows: turn; Shift: sprint; E: collect / exit; F: flashlight; hold Space: look behind; M: explored map; Esc: pause. Touch devices have a movement stick, drag-to-look, sprint, map, flashlight and interaction controls. Pointer lock is optional; drag controls remain available when a host blocks it.

## Map source

The level is **Backrooms Map Packed_Blender 3.2.0**, by **ultramirage10 / Speed12**, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Original Sketchfab model](https://sketchfab.com/3d-models/backrooms-map-packed-blender-320-cccf027acc214c4e9370f1fefebda4bf). The supplied GLB identifies its author as ultramirage10; the retrieved source page identifies Speed12, so both names are credited. Attribution and adaptation details are bundled in `public/licenses/backrooms-map-CC-BY-4.0.txt` and the in-game credits.

`public/models/backrooms.glb` is the unchanged user-supplied 1.53 MB model with all three textures embedded. Its separate wall, baseboard, pillar, floor, ceiling and fluorescent meshes are used as a modular kit. `src/model-geometry.js` extracts those real meshes, normalizes each module and instances them into the playable maze, preserving their materials and UVs.

The level measures **105.6 by 105.6 metres (11,151 square metres)**, with a 24 by 24 grid of passages and nine randomized rooms. Branches, loops and dead ends connect all 576 cells. Sixteen sections reuse the source carpet, both ceiling meshes (`Celing_Tiles` and `Celing_Gaps`) and fluorescent fixtures, giving 768 fixture positions. Shared normalization keeps the ceiling tiles, raised grid and light openings aligned. The original demonstration hallway and vent are omitted.

`src/layout.js` generates architecture from a seed. Every press of Play or Retry rolls a different seed; the read-only room code identifies the current map. Old URL seeds do not fix the next match. `src/map.js` builds collision buckets and navigation per map, and `src/model-geometry.js` instances the same layout into the rendered world. Objectives and enemies use reachable, widely separated cells. Individual wall and pillar modules stop movement; navigation, pickups and catches respect walls. Best times are separate from the fixed-map version.

`npm run prepare-map` derives the default layout's fixture positions and reference collision bounds from the shipped GLB, and records its SHA-256 in `src/model-data.js`. The light grid is shared across randomized layouts; live collision uses each match's wall/pillar placements. Both `npm test` and `npm run build` reject stale reference data. Tests verify connected random layouts, physical clearance, render/collision agreement, original ceiling geometry, escape routes, pursuit and power timing.

## Lighting, blackouts, chasers and audio

Normal play has bright warm ceiling lighting, visible rooms and the original ceiling tiles/grid. The first power failure occurs after 60–120 seconds of active play. Each blackout lasts 60–120 seconds, then the lights return automatically for 90–180 seconds before another possible outage. Ceiling light emission and room lighting switch off together; the flashlight remains usable. Pause freezes the schedule, and new matches start with power restored. Blackouts have near-black fog and minimal ambient light; faces are revealed by the flashlight or at close range. Proximity warnings appear within six metres with a clear line of sight.

Thomas moves at 5.8 m/s, Jaap at 4.75, Marola at 4.0 and Mijke at 3.2 before difficulty multipliers. Walking is 4.1 m/s and sprinting is 7.15 m/s.

Each match shuffles the chasers' arrival order. Any of the four can pursue first after the difficulty's grace period; the others join in that shuffled order as passes are collected. Portrait and proximity-audio identities stay attached to their characters.

The user-supplied **Charlie's Inferno** MP3 is bundled at `public/audio/charlies-inferno.mp3`; its checksum and provenance are in the adjacent JSON file. It loops during matches, pauses without losing position, resumes with play, and stops/resets on win, capture, quit or retry. It never autoplays in the initial menu. The existing volume control adjusts the music and effects together; the music stays at the quieter mix requested by the user.

Mijke's **Mijn Meubilair** proximity clip at `public/audio/mijke-meubilair.mp3` loops within 10 metres, gets louder as she approaches, pans with her position and stops beyond 12 metres. Pause, capture, win and quit stop it immediately. The shared volume control applies to it.

## Lockers, shifting corridors and the final escape

Twelve full-height lockers are spread through the maze, with one near the start.
Press E at a locker (or the touch interaction button) to hide; press E to leave.
Movement and the flashlight are suppressed while hiding, and the camera looks
through a vent overlay. Chasers that see entry within twelve metres investigate
that locker and can catch its occupant. Others search the last known position
and patrol nearby passages. Hiding does not pause match time.

The model is [Changing Locker by 3D Assets](https://3dassets.dev/assets/squash-club-and-racket-workshop-changing-locker-ae30f1aa),
released under CC0 1.0. The original 6,000-triangle GLB is bundled unchanged, with
vents, hinges, handles and five materials. Instances are resized for hiding.
Provenance, source-reported AI use and SHA-256 are recorded in
`public/licenses/locker-CC0.txt`. The hiding view is a game overlay; the source
model has no door-opening animation.

At each new blackout, up to four distant corridor connections swap. Each swap
opens a connection and closes an edge on its old route, keeping every cell,
objective and exit reachable. Rooms stay intact. Changes keep clear of players,
chasers, passes and lockers. Rendering, collision, navigation and explored-map
changes update together; enemies replan their routes. Corridors do not shift
during the final escape.

The final pass triggers **LAATSTE BEL**: red emergency lighting, a persistent
escape announcement, a repeating bell and all four chasers. Pursuit speeds rise
slightly, capped below sprint speed. The exit stays open until reached; blackouts
cannot extinguish emergency lighting.

Occasional synthesized, spatially panned footsteps come from behind the player
without spawning a face or proximity warning. A burst stops when the player turns
around. Its schedule uses match time; pause/quit stop the sound. The existing
quiet music and louder Mijke proximity mix remain in place.

## Character artwork

Thomas uses the user's supplied photograph. Mijke, Marola and Jaap originate from the existing SchoolControl portrait assets. Head extraction was performed with the built-in image-generation tool; exact edit prompts are recorded in `public/faces/provenance.json` and WebP metadata. These are fictional game chasers; no real voices are used. The map license does not grant rights over these portraits. See the SchoolControl reference notes for the original portrait provenance: https://github.com/RatelSlop/SchoolControl/blob/main/references/sources.md.

The original supplied Thomas photograph and local source paths are not bundled. The studio logo is the official RatelSlop artwork. Three.js is MIT-licensed; Manrope and Barlow Condensed are distributed under the SIL Open Font License.
