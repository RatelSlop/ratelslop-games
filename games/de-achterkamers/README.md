# De Achterkamers

A first-person Backrooms escape game for RatelSlop Games. Only photographic head cutouts pursue the player: Thomas, Mijke, Marola and Jaap. The player collects access passes and returns to the marked exit. Three difficulty settings, sprint stamina, flashlight, discovered-room map, camera-motion reduction, local best times, touch controls, pause and retry are included.

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

The level uses the MIT-licensed `cmd-backedges` generator by isocialPractice, vendored at commit `0c6cbb91dedf3c2ae41525ae00ee20024848702c` from https://github.com/isocialPractice/cmd-backedges. Original source files are in `src/vendor/backedges`. The game extracts a finite region, joins disconnected regions caused by extraction, guarantees reachable objectives, and supplies its own textured 3D rendering, lights, exit, pickups, collisions and pathfinding. The upstream MIT license is bundled in `public/licenses/cmd-backedges-MIT.txt`.

## Character artwork

Thomas uses the user's supplied photograph. Mijke, Marola and Jaap originate from the existing SchoolControl portrait assets. Head extraction was performed with the built-in image-generation tool; exact edit prompts are recorded in `public/faces/provenance.json` and WebP metadata. These are fictional game chasers; no real voices are used. The MIT map license does not grant rights over these portraits. See the SchoolControl reference notes for the original portrait provenance: https://github.com/RatelSlop/SchoolControl/blob/main/references/sources.md.

The original supplied Thomas photograph and local source paths are not bundled. The studio logo is the official RatelSlop artwork. Three.js is MIT-licensed; Manrope and Barlow Condensed are distributed under the SIL Open Font License.
