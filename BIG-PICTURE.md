# Big Picture mode

Use the **Big Picture** button in the launcher's header to enter the TV-style
library. It shares the catalog, favorites, recent games and embedded player with
the normal launcher. Poster cards have a 4:5 portrait aspect ratio and crop existing artwork
without stretching it. Selecting a poster updates the large game preview.

- Arrows move between posters and controls; Enter launches the focused game.
- Gamepad D-pad / left stick navigates; A selects and B leaves Big Picture.
- My list and Recently played use the same local profile as the normal launcher.
- Fullscreen is optional. Exit Big Picture returns to normal browsing.
- Returning from a game restores Big Picture and its selected game.
- The mode preference is remembered locally. Private games remain unavailable.

`dist/big-picture.js` extends the launcher's shared catalog and routing after
`app.js` loads. `dist/big-picture.css` scopes the visual layout to this mode.
Keyboard, favorites, player routing, return navigation and poster proportions
were reviewed in the browser. Physical gamepad input has not been tested.
