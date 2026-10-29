# RatelSlop Games

GitHub Pages is the selected host. See `GITHUB-PAGES.md` for setup and automatic game-push updates. `.github/workflows/pages.yml` builds the latest three public games and deploys `dist/`. For a local preview run `python -m http.server 4174 --directory dist` and visit http://localhost:4174. Earlier optional Cloudflare configuration remains available separately.

## Games
- BouncyKoen: public `RatelSlop/BouncyKoen`, docs build, static browser build.
- ConciergeDienst: public `RatelSlop/Concierge-dienst`, static HTML and assets.
- UAVPilot: public `RatelSlop/UAVPilot`, TypeScript checked and production build compiled with Vite.
- Schoolcontrol: repository currently private or unavailable; intentionally disabled. Add its static build under `dist/games/schoolcontrol/`, then set its `url` in `dist/app.js` to `games/schoolcontrol/index.html` and update its controls and description.

All game sources: https://github.com/RatelSlop. Local game progress belongs to this launcher's origin and is separate from progress on the games' existing domains. BouncyKoen bundles Three.js locally with an optional CDN fallback; fonts load from Google Fonts. On the selected host, game assets are served by GitHub Pages. Playing does not require GitHub REST API requests.

Artwork provenance: concierge.jpg is Concierge-dienst/assets/cameras/cam1_lockers.jpg; school.jpg is a collection placeholder from Concierge-dienst/assets/cameras/cam3_hallway.jpg, not a Schoolcontrol screenshot; bouncy.jpg and uav.jpg are browser captures of the corresponding bundled games. No private source is included.

