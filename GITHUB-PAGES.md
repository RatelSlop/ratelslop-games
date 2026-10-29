# GitHub Pages

Target repository: `delanohooijmaijers/ratelslop-games`.

1. Push this project to `main` in that repository.
2. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. The **Build and deploy game hub** workflow refreshes the three public game repositories, builds UAVPilot, validates relative paths, and publishes only `dist/`.
4. Use the URL returned by the successful deployment. The usual project URL is `https://delanohooijmaijers.github.io/ratelslop-games/`, unless repository or organization domain settings override it. This expected URL is not evidence of an active deployment.

## Update on every game push

The launcher deploys on its own `main` pushes, manual workflow runs, and `game-updated` repository dispatch events. To trigger a deployment from pushes in game repositories:

1. Create a fine-grained token scoped to the **hub repository only**, with **Contents: write**, to authorize GitHub's repository dispatch endpoint. Keep it in Actions secrets, never frontend code.
2. Add it as `HUB_DISPATCH_TOKEN` in each public game repository (or as an organization Actions secret restricted to those repositories).
3. Copy `examples/notify-hub.yml` into `.github/workflows/notify-hub.yml` in BouncyKoen, Concierge-dienst and UAVPilot.

Each game push then triggers a new combined build. Failed builds do not replace the last working deployment. GitHub's normal workflow token cannot dispatch to a different repository; the scoped secret above is needed.

## Private games

Schoolcontrol remains disabled. No private repositories are fetched or published. Connecting it later requires a playable build and appropriate build-time repository access. Public Pages visitors can download every file included in the published build.

## Runtime behavior

Games play in local iframes beneath this site's URL. Players do not call the GitHub REST API. Asset paths are relative, so the launcher works beneath `/ratelslop-games/`. Game progress and theme choice are stored in the player's browser; saves on the old domain stay separate.

GitHub Pages still has hosting limits, including a soft bandwidth limit of 100 GB/month; the 60 requests/hour unauthenticated GitHub REST API limit is separate and does not apply to ordinary game-file requests.

References:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
