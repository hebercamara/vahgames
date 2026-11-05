---
version: alpha
name: Crazygames
description: |
  CrazyGames operates in a bold, youth-forward gaming aesthetic rooted in deep
  space and neon energy. The interface layers a dark, near-black canvas
  (#0C0D14) with vibrant accent animations and gradient overlays to create a
  sense of immersive play. Typography is heavy and geometric, using all-caps
  weights to convey confidence and arcade energy. Game cards and category tiles
  employ vibrant colour gradients (pulling blues, teals, purples, and greens) to
  telegraph variety and excitement, while the navigation sidebar anchors the
  experience with a consistent, accessible vertical spine. The overall mood is
  playful yet sophisticated — casual gaming framed with deliberate hierarchy and
  accessible whitespace, never cluttered.
source:
  url: "https://www.crazygames.com/"
  pagesAnalyzed: 1
  extractedAt: 2026-11-05
  tokensMeasured: true
colors:
  primary: "#FFFFFF"
  canvas: "#0C0D14"
  on-primary: "#222222"
  ink: "#FFFFFF"
  body: "#E5E6EE"
  muted: "#BDBFCE"
  accent-1: "#7361FF"
  accent-2: "#6842FF"
  accent-3: "#878A9E"
  accent-4: "#2F3148"
  accent-5: "#A48EFF"
  accent-6: "#C7FF5B"
  accent-7: "#0F1A00"
  neutral-1: "#DCDFE8"
  neutral-2: "#EFF0F7"
typography:
  heading-sm:
    fontFamily: "APK Protocol"
    fontSize: 24px
    fontWeight: 900
    lineHeight: 1.29
    letterSpacing: 0px
  heading-xs:
    fontFamily: "APK Protocol"
    fontSize: 20px
    fontWeight: 900
    letterSpacing: 0px
  body-xl:
    fontFamily: "Artex SemiExtended"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0px
  body-lg:
    fontFamily: "APK Protocol"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0px
  body-lg-strong:
    fontFamily: "APK Protocol"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0px
  body-lg-2:
    fontFamily: "APK Protocol"
    fontSize: 16px
    fontWeight: 900
    letterSpacing: 0px
  body-md:
    fontFamily: "APK Protocol"
    fontSize: 14px
    fontWeight: 400
    letterSpacing: 0px
  button-md:
    fontFamily: "APK Protocol"
    fontSize: 16px
    fontWeight: 800
    letterSpacing: 0px
  button-sm:
    fontFamily: "APK Protocol"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: 0px
  button-sm-strong:
    fontFamily: "APK Protocol"
    fontSize: 14px
    fontWeight: 800
    letterSpacing: 0px
  caption:
    fontFamily: "APK Protocol"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 16px
  sm: 22px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 32px
  xxl: 48px
  xxxl: 60px
  section: 68px
borderWidths:
  thin: 1px
  medium: 2px
shadows:
  sm: "rgba(0, 0, 0, 0.7) 0px 10px 30px 0px"
elevationStrategy: single-tier
themes:
  derived: light   # the other theme is the site's measured palette
  light:
    bg: "#FBFBFB"
    surface: "#F1F1F1"
    surfaceRaised: "#E9E9E9"
    text: "#1D1D1D"
    textMuted: "#707070"
    border: "#D8D8D8"
    accent: "#707070"
    accentFg: "#FFFFFF"
    focusRing: "#8F8F8F"
    elevation: shadow
  dark:
    bg: "#0C0D14"
    surface: "#0C0D13"
    surfaceRaised: "#1F2026"
    text: "#FFFFFF"
    textMuted: "#E5E6EE"
    border: "#292A30"
    accent: "#FFFFFF"
    accentFg: "#0B0B0C"
    focusRing: "#FFFFFF"
    elevation: "border+surface"
gradients:
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(21, 74, 111) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(104, 41, 77) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(31, 100, 92) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(88, 82, 44) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(46, 97, 54) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(61, 47, 115) 100%)"
components:
  button-filled:
    typography: "{typography.button-sm}"
    textColor: "{colors.accent-7}"
    height: 40px
    padding: "10px 14px 10px 14px"
    rounded: "{rounded.full}"
    backgroundColor: "{colors.accent-6}"
  button-primary:
    typography: "{typography.button-sm}"
    textColor: "{colors.ink}"
    height: 40px
    padding: "10px 10px 10px 10px"
    rounded: "{rounded.full}"
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  button-filled-sm:
    typography: "{typography.button-sm-strong}"
    textColor: "{colors.accent-4}"
    height: 34px
    padding: "8px 16px 8px 16px"
    rounded: 30px
    backgroundColor: "rgb(249, 250, 255)"
  button-icon:
    textColor: "{colors.ink}"
    height: 28px
    fontSize: 13.3333px
    fontFamily: "APK Protocol"
    fontWeight: 400
  button-icon-lg:
    typography: "{typography.button-md}"
    textColor: "{colors.accent-5}"
    height: 48px
    rounded: 30px
  badge-filled:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    height: 18px
    padding: "0px 5.5px 0px 5.5px"
    rounded: "{rounded.full}"
    backgroundColor: "rgb(240, 0, 27)"
  badge-text:
    textColor: "{colors.body}"
    height: 28px
    fontSize: 16px
    fontFamily: "APK Protocol"
    fontWeight: 400
  navigation:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    backgroundColor: "{colors.canvas}"
  link:
    textColor: "{colors.ink}"
    fontSize: 14px
    fontFamily: "APK Protocol"
    fontWeight: 700
    rounded: "{rounded.xs}"
    backgroundColor: "rgba(255, 255, 255, 0.07)"
  link-sm:
    textColor: "{colors.ink}"
    fontSize: 14px
    fontFamily: "APK Protocol"
    fontWeight: 700
states:
  other-disabled:
    target: other
    state: disabled
    opacity: 0.4
  other-focus:
    target: other
    state: focus
    outline: none
  other-hover:
    target: other
    state: hover
    opacity: 1
  other-active:
    target: other
    state: active
    opacity: 0
  button-active:
    target: button
    state: active
    opacity: 0.7
breakpoints:
  - width: 375
    containerWidth: 360
    gridColumns: 8
    navLinksVisible: 22
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 14
    sectionPaddingX: 0
  - width: 768
    containerWidth: 753
    gridColumns: 8
    navLinksVisible: 22
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 14
    sectionPaddingX: 0
  - width: 1024
    containerWidth: 1009
    gridColumns: 8
    navLinksVisible: 22
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 14
    sectionPaddingX: 0
  - width: 1280
    containerWidth: 1265
    gridColumns: 8
    navLinksVisible: 22
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 14
    sectionPaddingX: 0
  - width: 1440
    containerWidth: 1425
    gridColumns: 8
    navLinksVisible: 22
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 14
    sectionPaddingX: 0
coverage:
  statesFound: 61
  gradientsFound: 8
  rolesUnassigned: 9
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by CrazyGames

## 1. Visual Theme & Atmosphere

CrazyGames operates in a bold, youth-forward gaming aesthetic rooted in deep space and neon energy. The interface layers a dark, near-black canvas (`{colors.canvas}` — `#0C0D14`) with vibrant accent animations and gradient overlays to create a sense of immersive play. Typography is heavy and geometric, using all-caps weights to convey confidence and arcade energy. Game cards and category tiles employ vibrant colour gradients (pulling blues, teals, purples, and greens) to telegraph variety and excitement, while the navigation sidebar anchors the experience with a consistent, accessible vertical spine. The overall mood is playful yet sophisticated — casual gaming framed with deliberate hierarchy and accessible whitespace, never cluttered.

**Key Characteristics**
- Dark, high-contrast canvas with vibrant neon and gradient accents
- Heavy geometric typography; primary typeface is APK Protocol at bold weights (700–900)
- Pill-shaped and rounded interactive elements (buttons render as 9999px radius; cards at `{rounded.xs}` and `{rounded.sm}`)
- Bright lime accent (`{colors.accent-6}` — `#C7FF5B`) as primary CTA fill
- Layered depth via colour blocking; minimal drop shadow (only on elevated buttons)
- Left-aligned vertical navigation with full-height icon and label layout
- Horizontal scrolling game carousels; 8-column grid layout across all viewports
- Graduated opacity states on hover/active to indicate interactivity without heavy motion

## 2. Color Palette & Roles

### Primary
- **Primary / Brand Ink** (`{colors.primary}` — `#FFFFFF`): Headings, primary body text, active states, and primary CTA text on brand surfaces.

### Accent Colors
- **Decorative Purple (Deep)** (`{colors.accent-1}` — `#7361FF`): Unassigned; no measured role. Used decoratively in gradient layers and UI flourishes.
- **Decorative Purple (Medium)** (`{colors.accent-2}` — `#6842FF`): Unassigned; no measured role. Decorative gradient and accent frames.
- **Decorative Lavender (Muted)** (`{colors.accent-3}` — `#878A9E`): Unassigned; no measured role. Decorative secondary accents.
- **Decorative Navy** (`{colors.accent-4}` — `#2F3148`): Unassigned; no measured role. Decorative depth and overlay tint.
- **Decorative Purple (Bright)** (`{colors.accent-5}` — `#A48EFF`): Unassigned; no measured role. Icon and accent highlights.
- **Lime Neon** (`{colors.accent-6}` — `#C7FF5B`): Primary CTA fill; "Log In" button and call-to-action surfaces. High contrast on dark canvas.
- **Decorative Forest** (`{colors.accent-7}` — `#0F1A00`): Unassigned; no measured role. Decorative dark overlay and depth layer.

### Interactive
- **Lime Button Fill** (`#C7FF5B`): Primary filled buttons and CTAs; text colour `{colors.on-primary}` (`#222222`).
- **White Transparent Primary** (`rgba(255, 255, 255, 0.1)`): Subtle button fill for secondary/icon buttons; supports low-contrast layering over dark backgrounds.
- **Light Neutral Small** (`#F9FAFF` / `rgb(249, 250, 255)`): Light-filled secondary buttons on dark backgrounds; pairs with dark text (`rgb(47, 49, 72)`).

### Neutral Scale
- **Canvas / Background** (`{colors.canvas}` — `#0C0D14`): Default page background and dark surface base.
- **Body Copy** (`{colors.body}` — `#E5E6EE`): Primary body text and secondary content.
- **Muted / Secondary** (`{colors.muted}` — `#BDBFCE`): Captions, secondary text, and de-emphasized labels.
- **Neutral Light 1** (`{colors.neutral-1}` — `#DCDFE8`): Light neutral surface; rarely used.
- **Neutral Light 2** (`{colors.neutral-2}` — `#EFF0F7`): Lightest neutral; card and elevated surfaces.

### Surface & Borders
- **On Primary Text** (`{colors.on-primary}` — `#222222`): Text and icons placed on bright/lime backgrounds for maximum contrast.

## 3. Typography Rules

### Font Family
**Primary:** APK Protocol (bold geometric sans-serif; 700, 800, 900 weights used)
Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Secondary:** Artex SemiExtended (bold display sans-serif; 700 weight)
Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display / Heading Large | APK Protocol | 24px | 900 | 1.29 | 0px | Section headings; all-caps presence |
| Heading Medium | APK Protocol | 20px | 900 | 1.4 (default) | 0px | Secondary headings; subsection titles |
| Body Large | Artex SemiExtended | 20px | 700 | 1.4 | 0px | Bold body copy; callouts |
| Body Large | APK Protocol | 16px | 700 | 1.1 | 0px | Strong emphasis in body; labels |
| Body Large (alt) | APK Protocol | 16px | 900 | 1.4 (default) | 0px | Heavy body; accent text |
| Body Medium | APK Protocol | 14px | 400 | 1.43 (default) | 0px | Standard body copy; descriptions |
| Button / Label Large | APK Protocol | 16px | 800 | 1.43 (default) | 0px | Large button text; strong CTA |
| Button / Label Medium | APK Protocol | 14px | 700 | 1.43 | 0px | Standard button text; interactive labels |
| Button / Label Small | APK Protocol | 14px | 800 | 1.43 (default) | 0px | Small button text; secondary CTA |
| Caption / Fine Print | APK Protocol | 12px | 700 | 1.35 | 0px | Captions, metadata, timestamps |

### Principles
- All typography is sans-serif and geometry-forward; favour heavy weights (700–900) on headings to anchor visual hierarchy.
- Line height defaults to 1.4 when not explicitly measured; body at 1.1–1.25 for tight stacking.
- Letter spacing is uniformly 0px; no negative tracking or expanded spacing observed.
- APK Protocol dominates; Artex SemiExtended reserves to select body and display callouts (20px, 700wt).
- Use caps and bold weight to signal importance; avoid italic or condensed variants.

## 4. Component Stylings

### Buttons

**Primary (Lime Filled)**
- Background: `{colors.accent-6}` (`#C7FF5B`)
- Text: `{colors.on-primary}` (`#222222`)
- Font: APK Protocol, 14px, weight 700
- Padding: `10px 14px`
- Border Radius: `{rounded.full}` (9999px)
- Border: `0px`
- Box Shadow (default): `rgba(0, 0, 0, 0) 0px 0px 0px 1.5px inset`
- Height: 40px
- Line Height: 20px
- Hover: Box shadow remains; opacity and brightness rules apply (see Interaction States).
- Active: Opacity 0.7
- Focus-visible: `outline: 2px solid var(--button-outline-color)`; inset shadow with focus color

**Secondary (White Transparent)**
- Background: `rgba(255, 255, 255, 0.1)`
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 14px, weight 700
- Padding: `10px 10px`
- Border Radius: `{rounded.full}` (9999px)
- Border: `0px`
- Box Shadow (default): `rgba(0, 0, 0, 0) 0px 0px 0px 1.5px inset`
- Height: 40px
- Width: 40px (icon-like proportions)
- Line Height: 20px
- Hover: Background lightens; opacity 0.9–1.0

**Secondary Small (Light Fill)**
- Background: `#F9FAFF` (rgb(249, 250, 255))
- Text: `rgb(47, 49, 72)`
- Font: APK Protocol, 14px, weight 800
- Padding: `8px 16px`
- Border Radius: `30px`
- Border: `0px`
- Box Shadow: `none`
- Height: 34px
- Line Height: normal
- Hover: Opacity 0.85–0.9; border colour may transition (CSS rule: `borderColor: currentcolor`, 2px medium width)
- Active: Opacity 0.7; background and colour may reset to initial
- Disabled: Opacity 0.4; text colour `var(--white-10)`; background `rgba(47, 49, 72, 0.4)`; border 2px medium

**Icon Button**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 13.33px, weight 400
- Padding: `0px`
- Border Radius: `{rounded.none}` (0px)
- Border: `0px`
- Box Shadow: `none`
- Height: 28px
- Width: 28px
- Hover: `filter: brightness(1.2)`

**Icon Button Large**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text: `{colors.accent-5}` (`#A48EFF`)
- Font: APK Protocol, 16px, weight 800
- Padding: `0px`
- Border Radius: `30px`
- Border: `0px`
- Box Shadow: `none`
- Height: 48px
- Width: 47.34px
- Hover: `transform: scale(1.1)`; opacity 0.85; colour may shift

### Badges

**Filled (Notification)**
- Background: `rgb(240, 0, 27)` (red)
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 14px, weight 400
- Padding: `0px 5.5px`
- Border Radius: `{rounded.full}` (9999px)
- Border: `0px`
- Box Shadow: `none`
- Height: 18px
- Width: 18px
- Hover: Scale transforms may apply; `transform: scale(1.2)` observed

**Text Badge**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text: `{colors.body}` (`#E5E6EE`)
- Font: APK Protocol, 16px, weight 400
- Padding: `0px`
- Border Radius: `{rounded.none}` (0px)
- Border: `0px`
- Box Shadow: `none`
- Height: 28px
- Hover: Opacity 0.8; colour may shift to `var(--white-100)`

### Cards & Containers

**Game Card (Link-style Container)**
- Background: `rgba(255, 255, 255, 0.07)`
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 14px, weight 700
- Padding: `0px`
- Border Radius: `{rounded.xs}` (16px)
- Border: `2px solid rgba(0, 0, 0, 0)` (transparent by default)
- Box Shadow: `none`
- Height: 248.94px
- Width: 440px
- Hover: Border colour transitions to white or brand accent; opacity 0.9; `borderRadius: 30px` on some variants; `transform: scale(1.05)` possible
- Active: Border colour `rgba(0, 0, 0, 0)` (resets); opacity varies

**Small Link / Text Card**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 14px, weight 700
- Padding: `0px`
- Border Radius: `{rounded.none}` (0px)
- Border: `0px`
- Box Shadow: `none`
- Height: 31px
- Width: 288px
- Hover: Colour shifts to `var(--brand-80)` or `var(--white-50)`; opacity 0.8–0.9
- Active: Opacity 0.7; colour `rgb(71, 73, 103)` or lighter variant

### Navigation

**Sidebar Navigation**
- Background: `{colors.canvas}` (`#0C0D14`)
- Text: `{colors.primary}` (`#FFFFFF`)
- Font: APK Protocol, 14px, weight 400
- Padding: `0px`
- Border Radius: `{rounded.none}` (0px)
- Border: `0px`
- Box Shadow: `none`
- Height: 840px
- Width: 68px
- Hover: Icon and label may scale (`transform: scale(1.1)` or `1.2`); colour shifts; background may lighten
- Icons are stacked vertically with centered labels; full-height layout on all viewports tested

### Inputs & Forms

**Search Input**
- Background: `rgba(255, 255, 255, 0.1)` (typical for dark UI)
- Text: `{colors.primary}` (`#FFFFFF`)
- Placeholder: `{colors.muted}` (`#BDBFCE`)
- Border: Measured at 2px; colour context dependent
- Border Radius: `{rounded.full}` (9999px)
- Focus-visible: `outline: 2px solid {colors.neutral-2}` (`#EFF0F7`)
- Padding: Standard (not explicitly measured)
- Font: APK Protocol, 14px, weight 400
- Hover: Border and background may lighten; `borderColor: var(--white-60)` observed
- Disabled: Text `var(--white-10)`; border 2px medium; background `rgba(47, 49, 72, 0.4)`

## 5. Layout Principles

### Spacing System
Base unit: `{spacing.xs}` = 8px

**Scale:**
- `{spacing.xxs}` = 4px — micro padding, icon gaps
- `{spacing.xs}` = 8px — small component padding, tight spacing
- `{spacing.sm}` = 12px — button padding, form field gaps
- `{spacing.md}` = 16px — standard container padding, section gaps
- `{spacing.lg}` = 20px — card padding, section margins
- `{spacing.xl}` = 32px — major section spacing
- `{spacing.xxl}` = 48px — layout-level spacing
- `{spacing.xxxl}` = 60px — hero/banner spacing
- `{spacing.section}` = 68px — full-width section separation

**Usage Context:**
- Micro interactions and icon padding use `{spacing.xxs}` and `{spacing.xs}`.
- Button internal padding sits at `{spacing.sm}` (`12px` for standard) to `{spacing.md}` (`16px` for larger buttons).
- Card and container internal padding scales from `{spacing.md}` to `{spacing.lg}`.
- Section-to-section and page margins anchor at `{spacing.xl}`, `{spacing.xxl}`, and `{spacing.section}`.

### Grid & Container
- **Max Width:** No explicit single max-width observed; content adapts across all tested breakpoints (375–1440px).
- **Columns:** 8-column layout uniformly measured across all viewports (375px through 1440px).
- **Content Column Width:**
  - 375px: 360px usable
  - 768px: 753px usable
  - 1024px: 1009px usable
  - 1280px: 1265px usable
  - 1440px: 1425px usable
- **Section Padding:** Horizontal padding consistently `0px` (full-bleed on mobile; left sidebar offsets content on desktop).
- **Carousel Strategy:** Game cards and category tiles scroll horizontally in carousel blocks; no wrapping to new rows observed.
- **Sidebar Offset:** Left navigation is full-height, fixed/sticky; main content scrolls independently with 68px left margin.

### Whitespace Philosophy
Spacing is generous and intentional. Card rows are separated by `{spacing.md}` to `{spacing.lg}` vertically; horizontal gaps between carousel items are modest (`{spacing.sm}` — `{spacing.md}`). Section headings sit atop carousels with `{spacing.lg}` breathing room below. The dark canvas and semi-transparent container fills (`rgba(255, 255, 255, 0.07)`) create visual separation without hard borders, allowing whitespace to do compositional work. Never cramped; padding-forward approach maintains legibility and visual hierarchy across all screen sizes.

### Border Radius Scale
- `{rounded.none}` = 0px — images, badges, sidebar, and sharp interactive elements (icon buttons, text links)
- `{rounded.xs}` = 16px — card and container edges; standard elevated surfaces
- `{rounded.sm}` = 22px — buttons and some containers
- `{rounded.full}` = 9999px — pill-shaped buttons, inputs, and rounded badges

### Border Widths
- **Thin** = 1px — dividers and subtle borders (not measured on interactive elements)
- **Medium** = 2px — button inset shadows, card borders on hover, input focus states, and interactive elements; the primary border stroke weight

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Base (Flat) | No shadow; solid `{colors.canvas}` background or transparent overlay | Page canvas, sidebar, most body text |
| Subtle Inset | `rgba(0, 0, 0, 0) 0px 0px 0px 1.5px inset` | Button insets (default state); borders without lift |
| Elevated Button | `rgba(0, 0, 0, 0.7) 0px 10px 30px 0px` | Prominent CTA buttons on hover; lifted interactive elements |
| Micro Lift | `rgba(0, 0, 0, 0.57) 0px 0px 7px 1px` | Icon and badge hover states; subtle pop |
| Focus Lift | `rgb(29, 0, 104) 0px 10px 40px 0px` | Focus-visible states; purple/cosmic accent shadow |

**Shadow Philosophy:**
CrazyGames uses a minimalist, colour-blocking approach to depth. Most UI relies on surface colour changes (bright lime for CTAs, semi-transparent white for cards) rather than cast shadows. Shadows are reserved for interactive states — hover and focus — and arrive suddenly to signal engagement without layered progression. The two primary shadows are inset (border-like, `1.5px`) and drop (lifted, `10px 30px`), creating a two-tier elevation aesthetic. No multi-layer shadow stacks; no ambient occlusion. Depth comes from contrast and motion.

### Opacity Levels
- **Full** = 1.0 (100%) — default text, solid backgrounds, active states
- **Hover Translucent** = 0.9–0.85 — button and card hover; subtle dimming
- **Active Dim** = 0.7–0.6 — button active; reduced emphasis
- **Disabled/Muted** = 0.4–0.3 — disabled buttons; de-emphasized elements; `{spacing.opacity-30}` = 0.30 measured
- **Subtle Background** = 0.07–0.10 — semi-transparent overlays and card fills (`rgba(255, 255, 255, 0.07)`, `rgba(255, 255, 255, 0.1)`)

### Z-index / Layering
- **Base/Content** = z-index 1–5 — standard page elements, cards, buttons
- **Base/Sticky** = z-index 9 — sidebar navigation (persists above scrolling content)
- **Dropdown/Popover** = z-index 11–12 — modals, dropdowns, tooltips above sticky layers
- **Topmost** = z-index 12+ — notifications, alerts, overlay surfaces

No explicit modal or toast observed in extraction; z-index values inferred from CSS hierarchy. Sidebar (`z-index: 9`) sits above main content to frame the full-height experience.

## 7. Do's and Don'ts

### Do
- **Use APK Protocol for all headings and high-weight text.** It is the primary voice of the brand; reserve Artex SemiExtended for select 20px bold body callouts.
- **Favour heavy weights (700–900) on text.** Light or regular weights are rare; when used, they appear in body copy and secondary navigation only.
- **Employ `{rounded.full}` (9999px) for buttons and inputs.** Pill-shaped, circular, and rounded-full elements are the interactive signature.
- **Build contrast with colour blocking.** Use bright accent fills (`{colors.accent-6}` — lime) and semi-transparent overlays (`rgba(255, 255, 255, 0.07)`) instead of subtle shadows.
- **Respect the 8-column grid.** Game cards and category tiles align to 8-column rhythm across all breakpoints; carousels scroll horizontally without wrapping.
- **Apply hover opacity and scale transforms conservatively.** Opacity (0.9, 0.8, 0.7) and mild scale (1.05, 1.1, 1.2) signal interactivity without overwhelming motion.
- **Keep sidebar fixed and full-height.** Navigation should anchor the left edge and persist across all scrolling; maintain the 68px width.
- **Use `{colors.muted}` (`#BDBFCE`) for secondary and caption text.** It provides reliable contrast on dark backgrounds without shouting.
- **Centre interactive padding on buttons.** Buttons should feel balanced; avoid asymmetric padding unless explicitly layering icon + text.
- **Test focus states with `outline: 2px solid`.** Ensure keyboard accessibility; focus-visible outlines must be crisp and bright.

### Don't
- **Don't use thin or regular weight typography.** Every heading should be 700+ weight; body text at 400 is the minimum and reserved for secondary content.
- **Don't apply hard drop shadows to most elements.** Shadows are rare; use colour and opacity instead. Shadows appear only on elevated hover/active states.
- **Don't round edges below 16px (except buttons).** Cards use `{rounded.xs}` (16px); only buttons and inputs go to `{rounded.full}` (9999px). Sharp edges (`{rounded.none}`) are acceptable for images and text links.
- **Don't place text directly on lime backgrounds without dark overlay.** Lime is high-contrast but may strain readability; always pair with `{colors.on-primary}` (`#222222`) text or ensure sufficient contrast ratio.
- **Don't introduce new semantic colours (error/success/warning).** CrazyGames exposes no semantic ramp; only primary (`#FFFFFF`), neutral, accent, and lime are used. Stick to these.
- **Don't create multi-column layouts on mobile (375px).** All viewports maintain 8 columns; no breakpoint-based column shrink is observed. Carousels may shift; stacking does not occur.
- **Don't use condensed or italic variants.** Typography is strictly upright and geometric; no slant or width compression.
- **Don't stretch or skew interactive elements unexpectedly.** Mild scale transforms (1.05, 1.1) on hover are expected; extreme scales (1.6, 2.0) should be reserved for playful micro-interactions like badges or celebration elements.
- **Don't disable buttons without opacity reduction and visual indicator.** Disabled state must include opacity 0.4, greyed text, and a muted background; never silently disable without visual feedback.
- **Don't forget left sidebar offset.** When laying out main content, account for the 68px fixed navigation; avoid full-bleed designs that compete with sidebar real estate.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Width | Content Column | Grid Columns | Nav Toggle | Max Heading Size | Body Size | Section Padding X | Key Changes |
|---|---|---|---|---|---|---|---|---|
| Mobile | 375px | 360px | 8 | No | 24px | 14px | 0px | No horizontal padding; left sidebar at full height; carousels scroll |
| Tablet | 768px | 753px | 8 | No | 24px | 14px | 0px | Increased breathing room; sidebar remains; no layout wrapping |
| Small Desktop | 1024px | 1009px | 8 | No | 24px | 14px | 0px | Expanded content; 8-column grid persists; carousels unchanged |
| Standard Desktop | 1280px | 1265px | 8 | No | 24px | 14px | 0px | Ample whitespace; sidebar and main content scale together |
| Large Desktop | 1440px | 1425px | 8 | No | 24px | 14px | 0px | Maximum width reached; further growth via margins, not column reflow |

**Breakpoint Strategy:**
No media-query-driven collapsing observed. Navigation remains visible and full-height across all tested widths (375–1440px). Typography does not scale per breakpoint; headings hold at 24px and body at 14px uniformly. The 8-column grid is fixed; individual card widths may adjust, but column count does not shrink. Section padding (`padding-x`) remains `0px` at all sizes, suggesting full-bleed or container-based padding applied at the component level rather than page level.

### Touch Targets
- **Minimum Height:** 40px (buttons, inputs, interactive surfaces)
- **Minimum Width:** 28px (icon buttons); 34–40px for text buttons
- **Padding Around Targets:** `{spacing.sm}` to `{spacing.md}` (`12–16px`) between adjacent interactive elements
- **Sidebar Icons:** 48px tall (large icon buttons); ample tap targets for mobile and touch devices
- **Card Hitbox:** Full 16px–22px rounded card (248px tall, 440px wide) is tappable; no hidden hit zones

### Collapsing Strategy
**Mobile (375px):** Carousels expand to full viewport width; left sidebar persists at 68px (fixed, off to the left or overlaid). Cards may compress horizontally to fit; heading hierarchy remains unchanged. No stacking or multi-row wrapping observed; horizontal scroll is the pattern.

**Tablet & Desktop (768–1440px):** Same layout applies. Sidebar anchors left; content grows to fill; carousels expand proportionally. No collapse point identified; navigation is never hidden or converted to a hamburger menu. All UI scales linearly; no dramatic reflow or mode shifts.

**Implication:** This is a desktop-first or fixed-layout design. Mobile experiences carousels at reduced width; tablet and desktop scale content uniformly. Expect horizontal scrolling on small screens for game carousels rather than wrapping or pagination.

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Lime Neon (`{colors.accent-6}` — `#C7FF5B`) on dark background
- **Primary Text/Ink:** White (`{colors.primary}` — `#FFFFFF`)
- **Page Canvas:** Deep Navy (`{colors.canvas}` — `#0C0D14`)
- **Secondary Text:** Light Gray (`{colors.body}` — `#E5E6EE`)
- **Muted/Caption:** Muted Gray (`{colors.muted}` — `#BDBFCE`)
- **Text on Lime:** Dark Charcoal (`{colors.on-primary}` — `#222222`)
- **Decorative Accents:** Purple (`#7361FF`), Purple (`#6842FF`), Lavender (`#878A9E`), Navy (`#2F3148`), Bright Purple (`#A48EFF`), Forest (`#0F1A00`) — all unassigned; use for gradients and UI flourishes only

### Iteration Guide
1. **Font all headings and labels in APK Protocol at weight 700–900.** Body copy may be 400–700; all other UI is 700+.
2. **Round buttons to 9999px (pill shape); round cards to 16–22px; keep images and text links sharp (0px).**
3. **Fill primary CTAs with lime (`#C7FF5B`) and dark text (`#222222`); secondary buttons are transparent white (`rgba(255, 255, 255, 0.1)`) or light fill (`#F9FAFF`).**
4. **Apply inset shadows to buttons by default (`1.5px inset`); add drop shadows only on hover/active (`10px 30px offset`).**
5. **Spacing: buttons pad at 10–16px; cards at 16–20px; sections at 32px or more. Use the provided scale: xxs, xs, sm, md, lg, xl, xxl, xxxl, section.**
6. **Maintain the 68px fixed left sidebar at all breakpoints; do not hide navigation or convert to hamburger.**
7. **Game cards are 440px wide and scroll horizontally; never wrap to rows. Maintain 8-column grid across all viewports.**
8. **Opacity hierarchy: default 1.0, hover 0.9–0.85, active 0.7, disabled 0.4. Apply opacity before scale transforms for motion.**
9. **Focus-visible outlines are 2px solid, bright (white or accent-coloured); ensure keyboard accessibility.**
10. **Text colours on dark backgrounds: primary white, secondary light gray (`#E5E6EE`), captions muted gray (`#BDBFCE`). Never use low-contrast pairs.**

## 10. Known Gaps

- **Interaction States (Partial):** Hover, active, and focus-visible CSS rules were extracted, but not all states may be observable on a single page. Disabled buttons, loading states, and error/invalid input states were not directly measured; rules inferred from CSS but not visually confirmed in the screenshots.
- **Semantic Status Colours:** No error, success, warning, or info colours are declared or measured. The site uses only primary (`#FFFFFF`), decorative accents, and neutral greys. If semantic states are required, they must be added as new tokens outside this system.
- **Decorative Accent Roles (9 colours):** Nine colours (`{colors.accent-1}` through `{colors.accent-5}`, `{colors.accent-7}`, plus neutrals) have no measurable semantic role. They appear in gradient layers, background fills, and flourishes only. No single colour is reliably mapped to a specific UI function; they serve as a decorative palette.
- **Dark Mode / Theme Variants:** Only one theme (dark) was extracted. No light mode, high-contrast mode, or alternate colour scheme was observed or measured.
- **Component Complexity:** Complex components (modals, popovers, tabs, accordion panels) were not present or not captured in the screenshots. Only buttons, badges, cards, navigation, and inputs are fully documented.
- **Animation & Motion:** CSS `transform`, `transition`, and `animation` properties were partially captured (scale, opacity changes on hover), but timing (duration, easing) was not extracted. Implement motion conservatively or verify against live site.
- **Shadow on Elevated Surfaces (Incomplete):** Only two shadow values were extracted (`sm: inset 1.5px`, `md: drop 10px 30px`). More granular elevation levels may exist but were not observed.
- **Typography Variants (Limited):** Only 11 typography roles were measured on this page. Additional sizes (smaller captions, larger displays) may exist on other pages but are not documented here.
- **Breakpoint Naming:** Measured breakpoints are absolute widths (375, 768, 1024, 1280, 1440). Industry-standard names (xs, sm, md, lg, xl) were not extracted; use measured values directly.
- **Cross-Origin Stylesheets:** Some external stylesheets or CSS-in-JS declarations may be unreadable; calculated styles inferred from DOM elements may lack edge-case detail.
- **Authentication & Gated Content:** Surfaces behind login or premium paywalls were not visited; any design patterns in those areas are unknown.
- **Responsive Images & Media Queries:** Responsive image srcset, picture elements, and media-query-based image loading were not captured. Assume image cards maintain aspect ratios and scale proportionally.
- **Accessibility Features:** ARIA roles, labels, and screen-reader text were not systematically extracted. Verify accessible markup and labels match this design.