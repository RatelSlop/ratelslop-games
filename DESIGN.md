---
name: RatelSlop Games
description: Cinematic browser game collection
colors:
  primary: "#d92c40"
  primary-hover: "#bd2032"
  accent: "#f04a56"
  neutral-bg: "#111214"
  surface: "#1c1d21"
  foreground: "#f5f5f6"
  muted: "#a6a8b1"
  line: "#303137"
  chip: "#24252b"
  light-bg: "#f5f5f7"
  light-surface: "#ffffff"
  light-foreground: "#202126"
  light-muted: "#62646d"
  light-line: "#dcdde2"
  light-chip: "#e8e8ed"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontWeight: 800
    lineHeight: 0.9
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  section:
    fontFamily: "Manrope, sans-serif"
    fontSize: "23px"
    fontWeight: 800
    letterSpacing: "-0.7px"
rounded:
  control: "6px"
  field: "7px"
  compact: "8px"
  poster: "12px"
spacing:
  page: "4.3%"
  card-gap: "22px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.light-surface}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
    height: "43px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
  poster:
    rounded: "{rounded.poster}"
---
## Overview
The browser hub keeps its cinematic feature, charcoal surfaces, coral actions and four landscape game posters. Interface text stays quiet around the game artwork. This is an extension of the established visual system.

Each game now has a distinct generated cover illustration and an image-led game page. The player takes over the page when a game launches. The official Ratel Slop Studios identity anchors the header, studio section, footer, game covers and thumbnails.

**Key Characteristics:**
- Large artwork with compressed, confident game titles.
- Quiet controls, strong play actions and legible image overlays.
- Default dark theme with a persisted light alternative.

## Colors
Dark is the requested default. Light mode switches page surfaces and controls to pale gray and white while retaining dark cinematic hero and cover overlays. Primary play buttons use the deeper primary red; the brighter coral accent identifies selected navigation, saved favorites and focus rings. Game-specific artwork supplies its own palette without replacing the shared interface colors.

## Typography
Barlow Condensed supplies game titles at weight 800. The desktop feature title is 86px with a 0.9 line height; game-page titles use clamp(72px, 7.8vw, 96px). Poster titles generally use 34px, with BouncyKoen at 38px; responsive rules reduce them to 27–34px on small screens. Manrope supplies navigation, controls and descriptions. Standard section headings are 23px at weight 800; game-page headings are 21px. Game descriptions use a 70ch maximum measure.

## Layout
The desktop header is 90px high and page gutters are 4.3%. Four game columns become two at 800px and below. Poster gaps are 22px on desktop and 23px vertically / 15px horizontally below 800px. Mobile navigation wraps below the brand and search.

Posters use a 16:10 frame, changing to 16:11 at 450px and below. The feature image fills its section, with a dark directional overlay behind the title and actions.

Direct game pages use `#game/<id>`. Their cover is 76vh, constrained to 560–850px on desktop; wide screens at 1600px use 78vh. Below 800px it is 68vh constrained to 550–750px; at 450px and below it is 650px high. About and controls sit in two columns below the cover, then stack below 800px. Related games use three columns on desktop and two on mobile.

The active player uses `#play/<id>` and hides the site header and footer. Its stage height is `calc(100dvh - 84px)` with a 350px minimum on desktop, and `calc(100dvh - 72px)` with a 300px minimum below 800px. The control bar is 64px on desktop and 58px on mobile. Fullscreen uses 100dvh. Help and reload text remain below the stage.

## Elevation & Depth
Surfaces use tonal separation and fine theme-aware borders. Gradients establish readability over artwork. Shadows are reserved for title legibility and the small white studio marks over images; the browsing cards remain flat at rest. Cover actions use dark translucent surfaces. No generic floating-card shadow is part of the system.

## Shapes
Controls use gently curved corners (6px); the search field and icon buttons use 7px. Posters and the desktop player use 12px corners; the mobile player uses 8px, and fullscreen removes rounding. Small genre and availability badges are compact rectangles. Preserve the original logo's aspect ratio and white hexagonal artwork.

## Components
**Official studio identity.** Use the unchanged `dist/brand/ratelslop-logo.png`, sourced from the official RatelSlop studio repository; the official `ratelslop-mark.svg` is the favicon. Logo sizes adapt to placement: 44×51px in the desktop header, 60×70px in the studio strip, 34×40px in the footer, and smaller marks on posters. The game-page seal renders at 72×84px on desktop. Keep white source pixels unchanged in both themes. Provenance and source links live in ARTWORK.md.

**Landscape poster.** Each title uses its own illustration from `dist/art/covers/`: BouncyKoen's Dutch canal crossing, ConciergeDienst's midnight corridor, UAVPilot's sunset flight, and SchoolControl's school adventure. Art is promotional illustration, with exact generation prompts in the cover provenance file. Overlay title, category / private-status badge, and official studio mark. Both the poster and game name link to the game page; the separate favorite control persists My list. Image hover scales to 1.04 over 250ms; the logo stays still.

**Buttons and filters.** Primary play buttons use the primary color and its darker hover state. Secondary controls follow theme surfaces; over artwork they use translucent dark fills with white text. Selected filters invert foreground and background. Private SchoolControl keeps a disabled play action and a clear not-connected status.

**Game page.** Large artwork leads into a title, category, premise, Play and My list actions, followed by About, availability, repository link, controls and related games. Keep the visible “Cover illustration” label. The back action returns to the collection. Direct routes and browser history work without a server.

**Player.** Separate Back to game, restart and fullscreen controls sit above the iframe. Every iframe has a game-specific title; the loading status clears when it loads. Back returns to the game's cover page. The original games retain their upstream interface designs.

**Search, navigation and feedback.** Search, genre filters, ready-to-play filter, favorites and recently played shortcuts are browser-local. Toasts use inverted theme colors and a 200ms transition. Interactive controls have a visible 3px coral keyboard focus ring with 4px offset. Game-page navigation focuses the title, player navigation focuses Back to game, and reduced-motion disables transitions.

## Do's and Don'ts
- **Do** retain the established charcoal, coral, condensed-title and light-theme system.
- **Do** use the official studio artwork unchanged and keep each game's cover visually distinct.
- **Do** preserve legible overlays, named controls, visible focus and accurate availability.
- **Don't** present generated covers as gameplay screenshots.
- **Don't** enable SchoolControl's play action until a playable build is connected.
