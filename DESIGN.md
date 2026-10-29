---
name: RatelSlop Games
description: Cinematic browser game collection
colors:
  primary: "#d92c40"
  accent: "#f04a56"
  neutral-bg: "#111214"
  surface: "#1c1d21"
  foreground: "#f5f5f6"
  muted: "#a6a8b1"
  light-bg: "#f5f5f7"
  light-foreground: "#202126"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontWeight: 800
    lineHeight: 0.87
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
rounded:
  control: "6px"
  poster: "10px"
spacing:
  page: "4.3%"
  card-gap: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "11px 22px"
---
## Overview
The browser hub uses a large photographic feature followed by four landscape game posters. The player takes over the page when a game launches. Interface text stays quiet around the game artwork.
## Colors
Dark is the requested default. Light mode switches the page and controls to pale gray and white while retaining the dark cinematic hero. Coral identifies primary play actions, selected navigation and saved favorites.
## Typography
Barlow Condensed provides compressed game titles at 54–83px in the hero and 29–44px on posters. Manrope supplies navigation, controls and descriptions. Section headings are 23px at weight 800.
## Layout
Header is 90px on desktop. Page gutters are 4.3%. Four game columns become two below 800px. Mobile navigation wraps below the brand and search. Game iframe fills a dedicated stage with separate back, restart and fullscreen controls.
## Components
Landscape poster, icon favorite button, genre filters, detail dialog, game stage, toast, recent-game shortcut. A private game opens details and has a disabled play action.
## Motion
Poster image hover scales to 1.04 in 250ms. Toast and play overlays transition in 200ms. Reduced-motion disables transitions.
## Accessibility
Named controls, visible 3px coral keyboard focus, native dialog focus handling, readable theme-aware text, title on every iframe, no horizontal overflow at 390px. The original embedded games retain their upstream interface designs.
