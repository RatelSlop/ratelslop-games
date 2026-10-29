---
name: De Achterkamers
description: Familiar photographic faces inside a worn fluorescent Backrooms maze.
colors:
  room-dark: "#171812"
  text-main: "#f1ecd8"
  amber: "#e0b66b"
  amber-hover: "#f2ce8c"
  amber-ink: "#242818"
  focus: "#e4bb6b"
  link: "#f0cb82"
  text-muted: "#c6c7b8"
  control-bg: "#202719"
  control-text: "#eae7d8"
  control-border: "#74785d77"
  secondary-bg: "#ffffff0c"
  secondary-hover: "#ffffff16"
  secondary-text: "#d8dac9"
  secondary-border: "#858a6944"
  disabled-bg: "#62664e"
  disabled-text: "#e8e5d3"
  hud-icon-bg: "#10170fc9"
  hud-icon-text: "#eee5c6"
  hud-icon-border: "#9b9d7644"
  wall: "#c7bc7e"
  carpet: "#756e4d"
  ceiling: "#c1bd9f"
  scene-bg: "#76704a"
  fog: "#817748"
  fluorescent: "#fff4c3"
typography:
  display:
    fontFamily: "'Barlow Condensed', sans-serif"
    fontSize: "clamp(58px,7.5vw,96px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-1.6px"
  headline:
    fontFamily: "'Barlow Condensed'"
    fontSize: "clamp(52px,7vw,76px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-1px"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    lineHeight: 1.9
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "10px"
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    fontWeight: 800
rounded:
  button: "5px"
  field: "4px"
  key: "3px"
spacing:
  compact: "10px"
  inline: "12px"
  action-gap: "18px"
  button: "13px 22px"
  field: "9px 10px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "{spacing.button}"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.amber-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-text}"
  button-secondary:
    backgroundColor: "{colors.secondary-bg}"
    textColor: "{colors.secondary-text}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "{spacing.button}"
    width: "100%"
  field:
    backgroundColor: "{colors.control-bg}"
    textColor: "{colors.control-text}"
    rounded: "{rounded.field}"
    padding: "{spacing.field}"
  button-icon:
    backgroundColor: "{colors.hud-icon-bg}"
    textColor: "{colors.hud-icon-text}"
    rounded: "{rounded.button}"
    width: "38px"
    height: "38px"
---

# Design System: De Achterkamers

## Overview

**Creative North Star: "The Fluorescent Waiting Room"**

A real rendered maze supplies the atmosphere: yellowed wallpaper, worn olive carpet, suspended ceiling tiles and warm fluorescent fixtures. The interface sits quietly over that space, with condensed titles, restrained supporting text and a clear amber invitation to enter.

The photographic heads are the signature imagery. Mijke, Marola, Jaap and Thomas remain isolated heads, including in the 3D world; the official Ratel Slop Studios mark anchors the interface. Dutch copy is concise and playful within the tense environment.

**Key Characteristics:**
- Worn yellow and olive architecture with warm fluorescent light.
- Amber actions, cream text and dark translucent overlays.
- Condensed display type paired with quiet Manrope text.
- Photographic heads and the official studio identity.
- Sparse gameplay information around an unobstructed center.

## Colors

The palette borrows its muted warmth from aged wallpaper and carpet; amber signals action without turning the interface into a bright dashboard. Frontmatter values are normative and preserve the implementation's CSS color notation.

### Primary
- **Doorway Amber** (`amber`): start, resume and retry actions, the title's final dot, checkboxes and volume accents. `amber-hover` supplies the brighter pointer state; `amber-ink` keeps action labels dark.
- **Focus Amber** (`focus`): visible keyboard outlines. `link` is the slightly lighter inline-link treatment.

### Neutral
- **Room Dark** (`room-dark`): the document and loading background.
- **Warm Cream** (`text-main`): main interface text. `text-muted` supports descriptions.
- **Olive Control** (`control-bg`, `control-text`, `control-border`): compact settings fields.
- **Ghost Surface** (`secondary-bg`, `secondary-hover`, `secondary-text`, `secondary-border`): secondary actions remain translucent over the room.
- **Waiting Olive** (`disabled-bg`, `disabled-text`): the start button while assets load.
- **HUD Glass** (`hud-icon-bg`, `hud-icon-text`, `hud-icon-border`): pause control.
- **Wallpaper, Carpet and Ceiling** (`wall`, `carpet`, `ceiling`): procedural material base colors. `scene-bg` and `fog` blend distant architecture; `fluorescent` is the luminous panel material.

**The Amber Action Rule.** Use amber for actionable controls and small emphasis; keep the architecture and supporting interface muted.

## Typography

**Display Font:** Barlow Condensed, with the source's sans-serif fallback on the menu title.
**Body Font:** Manrope, sans-serif.

The compressed display face makes the title forceful without a large panel. Manrope keeps settings, instructions and status legible and subdued. Use the frontmatter hierarchy; body copy is compact, with generous line spacing rather than oversized text.

- **Display:** two-line uppercase game title, with an amber final dot.
- **Headline:** sentence-case pause and result headings.
- **Title:** the menu tagline; aside heading uses a smaller treatment (17px, weight 600).
- **Body:** premise text; centered overlay copy uses line-height 1.8.
- **Label:** settings, controls and captions. Objective counts and result numbers use a larger treatment (19px); timers and result statistics use tabular numerals.

**The Two Voices Rule.** Reserve Barlow Condensed for major headings; use Manrope for controls, descriptions and game state.

## Layout

The WebGL canvas fills the viewport. The menu overlays it with a scrolling full-screen layer. Its desktop grid is capped at 1320px, uses columns of 1.4fr and 1fr, an 8% gap, and padding of 3vh 4.5% 45px. The title and start controls lead on the left; faces and instructions sit at the lower right. Start and settings are capped at 355px. The studio header and footer use the same percentage gutters.

At a maximum width of 800px, the grid becomes 1.2fr and 1fr with a 5% gap; the title is 64px and face images are 70px high. At a maximum width of 580px, the menu stacks, uses 6% side gutters, and removes the controls table. The title becomes clamp(52px,13vw,72px), controls become full width, faces are 64px wide with 66px-tall images, and the headphone note disappears. The menu remains scrollable.

The HUD uses 23px 27px desktop padding and 16px mobile padding. Objective, compass/time and pause occupy the top; stamina and nearby threat occupy the bottom. The center keeps only a 4px crosshair and contextual hints. The optional map is 180px square, shrinking to 140px below 580px. Pause and result content is centered at width min(450px,100%) inside 25px overlay padding.

Coarse-pointer devices receive a 110px joystick, 42px circular utility controls and a 62px sprint control. The joystick respects the left safe-area inset. An explicit pickup button replaces the keyboard hint. Preserve these input-dependent layouts rather than relying on viewport width alone.

## Elevation & Depth

Depth comes from the rendered world, atmospheric fog, a radial vignette and translucent overlays. The menu gradient is `linear-gradient(90deg,#10140df2,#10140dba 48%,#10140d40)`. Centered overlays use `#10160de8` and a 5px backdrop blur. Interface panels are not raised cards.

### Shadow Vocabulary
- **Title atmosphere:** `0 4px 30px #0003` text shadow.
- **HUD legibility:** `0 2px 6px #000` text shadow; the stamina uses `0 1px 5px black`.
- **Isolated heads:** lineup `drop-shadow(0 5px 12px #0008)`; result `drop-shadow(0 5px 15px #0007)`.
- **Danger:** `inset 0 0 120px #9c391c`, revealed through opacity.

The scene uses ACES filmic tone mapping, exposure 1.1, exponential fog density .036 and roughness 1 on the main room materials. Keep photographic enemy sprites unlit (`toneMapped:false`) and transparent, with alpha test .08. Camera calm mode removes walking bob and enemy/card bob; reduced-motion CSS removes transitions. Notice and danger opacity transition over .25s; stamina width uses .05s linear.

## Shapes

Controls have small, practical corners: buttons and hints use the button radius, fields and map use the field radius, and keyboard keys use the key radius. Dividers and translucent one-pixel borders organize information without enclosing everything in cards. Circular shapes are reserved for touch controls and the crosshair. Photographic heads retain their cutout silhouette with `object-fit:contain`.

## Components

### Buttons

Primary buttons are amber, full width and at least 50px high, with the frontmatter padding and 18px content gap. Start distributes label and arrow to opposite sides; centered overlays center the label. Hover uses `amber-hover`. Disabled start uses the waiting palette and `cursor:wait`. Secondary buttons share the dimensions, center their label, add a one-pixel translucent border and sit 10px below the preceding control; hover uses `secondary-hover`.

All buttons, fields, selects, summaries and links use a 3px focus outline with 5px offset. The implementation does not add a separate active transform or motion to buttons.

### Settings fields

Settings are compact labeled native controls. Labels are 10px with a 7px vertical gap; fields are 11px with a one-pixel border and the frontmatter padding. Tempo grows to fill available width; the numeric room-code field is 105px. Checkboxes and the 82px volume range use amber accents.

### HUD controls and status

Pause is a square icon button with a 22px stroked icon, 1.8 stroke width and rounded line ends. The HUD itself ignores pointer events while actual controls opt back in. The objective has a 27px amber icon. Stamina uses a 4px track, 205px desktop width and 155px mobile width. Threat uses the matching photographic head beside a small uppercase proximity label. Avoid broad opaque backgrounds over the maze.

### Face lineup and studio mark

The four heads appear in a single flexible row, with 10px gaps, 24% figure widths and 96px image height on desktop. Captions are 10px. Preserve names, transparent silhouette and natural proportions. The studio mark is 46 by 54px in the menu, 35 by 42px on mobile, and 44 by 52px in pause.

### Pause and results

Pause and result share the centered overlay and condensed headline. Result statistics form a three-column flex row between one-pixel dividers, with 20px vertical padding and 23px vertical margins. The optional result face fits a 120 by 140px area. Reuse primary and secondary actions rather than inventing another button style.

## Do's and Don'ts

### Do:
- **Do** keep the actual rendered room visible beneath the menu and HUD.
- **Do** preserve the four photographic heads as isolated cutouts and use the official studio mark.
- **Do** use amber for primary actions and Barlow Condensed for major headings.
- **Do** preserve the stacked mobile menu, coarse-pointer controls and visible keyboard focus.
- **Do** respect calm-camera and reduced-motion behavior.

### Don't:
- **Don't** add bodies to the photographic enemies.
- **Don't** replace the muted olive/yellow world with bright dashboard panels.
- **Don't** add card shadows or large rounded containers to the sparse gameplay HUD.
- **Don't** obscure the center of the first-person view with persistent interface blocks.
