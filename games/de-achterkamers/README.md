# De Achterkamers

A first-person Backrooms escape game for RatelSlop Games, set in a large maze assembled from the supplied Sketchfab model kit. Only photographic head cutouts pursue the player: Thomas, Mijke, Marola and Jaap. The player collects access passes and returns to the marked exit. Three difficulty settings, sprint stamina, flashlight, explored map, camera-motion reduction, local best times, touch controls, pause and retry are included. The pass code changes objective and enemy positions within the fixed architecture. Best times for this map are stored separately from the former procedural maze.

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

The level measures **105.6 by 105.6 metres (11,151 m²)**, with a 24 by 24 grid of passages, nine larger rooms, 501 wall modules and 26 pillars. Branches, loops and dead ends connect all 576 cells. Sixteen sections reuse the source's carpet, ceiling tiles and fluorescent meshes, giving 768 fixture positions. Instanced rendering shares geometry and materials. This replaces the initial small room-and-hallway demonstration layout; the hallway's floor hole and floating vent are not part of the assembled level.

`src/layout.js` defines the connected layout. `scripts/prepare-map.mjs` derives collision rectangles from the individual transformed wall/pillar instances and light positions from the original fixtures. Each rectangle covers a single straight module, never a whole collection. `src/model-data.js` records that data and the source GLB SHA-256. Navigation uses the layout's open edges; tests verify physical clearance along every edge. Movement uses small steps to prevent tunneling. Pickups and catches require a clear line through the walls.

The pass code changes objective and enemy placements. Default start-to-objective routes are approximately 145–260 metres long. Local best times are separate from the previous small-map version. The architecture stays fixed so players can learn their way around.

After editing the GLB, layout or module assembly, run `npm run prepare-map` and commit the generated data. Both `npm test` and `npm run build` reject stale data. Tests cover map size, branching, reachability across 35 pass codes, physical navigation clearance, wall and pillar collision, boundaries, full escape routes in every mode, and chaser pursuit. Browser review confirms embedded textures and successful gameplay startup without console errors. The former `cmd-backedges` vendor files and MIT notice remain as unused historical source.

## Darkness, chasers and audio

The maze uses near-black fog and minimal ambient light. Ceiling fixtures glow faintly; the narrow flashlight is the main light source and casts wall/pillar shadows. Faces are revealed by the beam or at close range, and visual proximity warnings appear only within six metres with a clear line of sight. Thomas moves at 5.8 m/s, Jaap at 4.75, Marola at 4.0 and Mijke at 3.2 before difficulty multipliers. Walking is 4.1 m/s and sprinting is 7.15 m/s.

The user-supplied **Charlie's Inferno** MP3 is bundled at `public/audio/charlies-inferno.mp3`; its checksum and provenance are in the adjacent JSON file. It starts and loops during matches, pauses without losing position, resumes with play, and stops/resets on win, capture, quit or retry. It never autoplays in the initial menu. The existing volume control adjusts the music and game effects together; the music mix leaves room for footsteps and chase sounds.

## Character artwork

Thomas uses the user's supplied photograph. Mijke, Marola and Jaap originate from the existing SchoolControl portrait assets. Head extraction was performed with the built-in image-generation tool; exact edit prompts are recorded in `public/faces/provenance.json` and WebP metadata. These are fictional game chasers; no real voices are used. The map license does not grant rights over these portraits. See the SchoolControl reference notes for the original portrait provenance: https://github.com/RatelSlop/SchoolControl/blob/main/references/sources.md.

The original supplied Thomas photograph and local source paths are not bundled. The studio logo is the official RatelSlop artwork. Three.js is MIT-licensed; Manrope and Barlow Condensed are distributed under the SIL Open Font License.
