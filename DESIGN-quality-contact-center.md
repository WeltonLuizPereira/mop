---
version: alpha
name: quality-contact-center-design-system
description: A Quality Contact Center design system built on a clean white-and-near-black structure, humanist sans typography, compact controls, and dense product UI mockups. The orange from the Quality logo leads actions, states, highlights, and tinted surfaces through a coordinated warm scale; the logo red remains a controlled secondary brand accent.

colors:
  primary: "#ff8705"
  primary-deep: "#d96b00"
  primary-strong: "#a94f00"
  primary-soft: "#ffb45f"
  primary-pale: "#ffe4c2"
  primary-wash: "#fff8f0"
  brand-red: "#f7080d"
  brand-red-deep: "#c8070b"
  brand-red-soft: "#ffe5e6"
  ink: "#171717"
  ink-secondary: "#26211d"
  ink-mute: "#746a63"
  ink-mute-2: "#a39890"
  ink-faint: "#c0b7b0"
  on-primary: "#171717"
  on-brand-red: "#ffffff"
  on-dark: "#ffffff"
  canvas: "#ffffff"
  canvas-soft: "#fffaf5"
  canvas-warm: "#fff3e7"
  canvas-night: "#1f1915"
  canvas-night-soft: "#2a211b"
  hairline: "#e5ddd6"
  hairline-strong: "#cfc2b8"
  hairline-cool: "#f2ece7"
  hairline-cool-2: "#f7f0ea"
  hairline-cool-3: "#ddd2c9"

typography:
  display-xxl:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 64px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -1.92px
  display-xl:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -1.44px
  display-lg:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.72px
  display-md:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.42px
  heading-lg:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  heading-md:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button-md:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: 0
  caption:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  micro:
    fontFamily: "Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  code:
    fontFamily: "ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px

components:
  button-primary-orange:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
  button-primary-orange-pressed:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
  button-secondary-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
  button-on-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
  button-link:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    padding: 0px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  card-feature-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-pricing:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-pricing-featured:
    backgroundColor: "{colors.canvas-night}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-feature-dark:
    backgroundColor: "{colors.canvas-night}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  code-block:
    backgroundColor: "{colors.canvas-night}"
    textColor: "{colors.on-dark}"
    typography: "{typography.code}"
    rounded: "{rounded.sm}"
    padding: 16px
  pill-tag-orange:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  pill-tag-soft:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  nav-bar-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: 16px 24px
  link-on-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: 0px
  footer-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 64px 24px
---

## Overview

Quality Contact Center's adapted design system is engineered for clarity above all else. Marketing surfaces sit on `{colors.canvas}` (pure white), with text rendered in `{colors.ink}` (`#171717` — near-black, never pure black). The consistent chromatic event is the **official logo orange** (`{colors.primary}` — `#ff8705`) used for filled CTAs, active states, chart highlights, focus cues, and selected brand details. The logo red (`{colors.brand-red}` — `#f7080d`) remains a controlled secondary accent rather than competing with the primary action color.

Typography runs **Circular** at weight 500 for display and 400 for body. The display tier uses tight negative letter-spacing (-1.92px at 64px) to pull the rounded humanist letterforms into editorial density. There is no atmospheric gradient, no full-bleed photography, and no dark-canvas marketing track — white and warm off-white surfaces let the orange identity remain distinctive.

The product appears through composited UI screenshots: operational dashboards, queue tables, agent performance panels, service histories, and reporting views. These screenshots are the brand's argument. They sit inside `{rounded.lg}` 12px containers with subtle 1px warm-neutral hairlines, often arranged 2-up or in a floating "stacked panes" composition above the hero band.

**Key Characteristics:**
- Official Quality orange (`{colors.primary}` `#ff8705`) is the dominant chromatic event; lighter and darker orange tokens provide hierarchy without introducing unrelated hues.
- Quality red (`{colors.brand-red}` `#f7080d`) is secondary and reserved for the logo, selected brand moments, and deliberately high-emphasis details.
- White and warm-white canvases use a neutral hierarchy from `{colors.hairline-cool}` to `{colors.ink}`.
- Custom humanist sans display tier at weight 500 with negative letter-spacing of -1.92px to -0.42px.
- Composited product UI screenshots (dashboards, agent panels, queues, and reports) are the dominant decorative element — never generic stock photography.
- Tight 6px / 8px button radii — square-ish, technical, never pill-shaped.
- Technical blocks render in deep `{colors.canvas-night}` (`#1f1915`) with monospace inline text.
- Featured tiers use a dark inverted `{colors.canvas-night}` surface, not a full orange fill — orange remains reserved for CTAs, indicators, and selected accents.

## Colors

> **Brand reference:** supplied Quality Contact Center vector logo. Official sampled fills: orange `#ff8705`, red `#f7080d`, and white `#ffffff`.

### Brand & Accent
- **Quality Orange** (`{colors.primary}` — `#ff8705`): Official logo orange and signature CTA color. Use for filled buttons, active navigation, focus cues, selected data points, and dot indicators.
- **Orange Deep** (`{colors.primary-deep}` — `#d96b00`): Hover and pressed state of the primary. Keep normal-size orange text on white at `{colors.primary-strong}` for stronger contrast.
- **Orange Strong** (`{colors.primary-strong}` — `#a94f00`): Dark orange for fine text, icons, and borders when additional contrast is required.
- **Orange Soft** (`{colors.primary-soft}` — `#ffb45f`): Lighter orange for charts, progress tracks, and supporting UI accents.
- **Orange Pale** (`{colors.primary-pale}` — `#ffe4c2`): Background for chips, notices, selected rows, and compact highlights.
- **Orange Wash** (`{colors.primary-wash}` — `#fff8f0`): Very light branded section or card background.
- **Quality Red** (`{colors.brand-red}` — `#f7080d`): Official logo red. Keep secondary to orange and use sparingly for logo-led brand moments or high-emphasis details.
- **Red Deep** (`{colors.brand-red-deep}` — `#c8070b`): Accessible darker red when white text must sit on a red surface.
- **Red Soft** (`{colors.brand-red-soft}` — `#ffe5e6`): Subtle red-tinted background. Pair with `{colors.brand-red-deep}` text.
- Do not introduce unrelated purple, green, blue, or yellow as decorative brand colors. Add them only when a functional data/status system truly requires distinct semantics.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Default page background.
- **Canvas Soft** (`{colors.canvas-soft}` — `#fffaf5`): Barely warm off-white for alternating section bands.
- **Canvas Warm** (`{colors.canvas-warm}` — `#fff3e7`): Branded warm surface for highlighted groups without using a saturated fill.
- **Canvas Night** (`{colors.canvas-night}` — `#1f1915`): Warm near-black used in technical blocks, dashboard mockups, and featured tiers.
- **Canvas Night Soft** (`{colors.canvas-night-soft}` — `#2a211b`): Slightly lifted dark for nested chrome.
- **Hairline** (`{colors.hairline}` — `#e5ddd6`): 1px warm-neutral borders on cards and tables.
- **Hairline Strong** (`{colors.hairline-strong}` — `#cfc2b8`): Darker border for emphasis.
- **Hairline Cool** (`{colors.hairline-cool}` — `#f2ece7`) / **Hairline Cool 2** (`{colors.hairline-cool-2}` — `#f7f0ea`) / **Hairline Cool 3** (`{colors.hairline-cool-3}` — `#ddd2c9`): Warm-neutral ladder for fine chrome work.

### Text
- **Ink** (`{colors.ink}` — `#171717`): Default body text. Near-black, never pure.
- **Ink Secondary** (`{colors.ink-secondary}` — `#26211d`): Slightly warm near-black for body emphasis.
- **Ink Mute** (`{colors.ink-mute}` — `#746a63`): Secondary text and helper copy.
- **Ink Mute 2** (`{colors.ink-mute-2}` — `#a39890`): Tertiary text.
- **Ink Faint** (`{colors.ink-faint}` — `#c0b7b0`): Disabled / placeholder text.
- **On Primary** (`{colors.on-primary}` — `#171717`): Text on the orange primary fill — near-black, not white. This pairing provides stronger contrast and keeps the button feeling bright rather than heavy.
- **On Brand Red** (`{colors.on-brand-red}` — `#ffffff`): Text on `{colors.brand-red-deep}` surfaces. Do not place small white text directly on the brighter `{colors.brand-red}` token.
- **On Dark** (`{colors.on-dark}` — `#ffffff`): Text on canvas-night surfaces.

## Typography

### Font Family

The display and UI tier is **Circular** — a proprietary geometric humanist sans by Lineto. Fallback chain: `'Helvetica Neue', Helvetica, Arial`.

For maximum brand fidelity when Circular isn't licensed, use **Inter** (open-source via Google Fonts) at weight 500 for display with `letter-spacing: -1.92px` at 64px. Inter is the closest open-source analogue to Circular's geometric humanist character.

Code blocks use **system mono** (`ui-monospace`, with Menlo / Monaco / Consolas fallbacks).

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 64px | 500 | 1.1 | -1.92px | Hero headline |
| `{typography.display-xl}` | 48px | 500 | 1.1 | -1.44px | Section opener |
| `{typography.display-lg}` | 36px | 500 | 1.15 | -0.72px | Sub-section / pricing tier |
| `{typography.display-md}` | 28px | 500 | 1.2 | -0.42px | Card title |
| `{typography.heading-lg}` | 22px | 500 | 1.2 | 0 | Compact heading |
| `{typography.heading-md}` | 18px | 500 | 1.4 | 0 | Section sub-heading |
| `{typography.body-lg}` | 18px | 400 | 1.55 | 0 | Marketing body lead |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default UI body |
| `{typography.button-md}` | 14px | 500 | 1.0 | 0 | Button label |
| `{typography.caption}` | 13px | 400 | 1.45 | 0 | Helper, footnote |
| `{typography.micro}` | 12px | 400 | 1.45 | 0 | Pill label, fine print |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Code block content |

### Principles
- **Weight 500 across display.** Mid-weight reads as engineered, not decorative.
- **Negative tracking on display.** -1.92px at 64px scaling proportionally down — tightens the rounded humanist letterforms into editorial density.
- **Mono for code.** System mono families (Menlo / Monaco) — no proprietary mono webfont.

### Note on Font Substitutes
Circular is proprietary. Use **Inter** at weight 500 with `letter-spacing: -1.92px` for display tiers. **Geist Sans** (open-source from Vercel) is another close alternative for both display and body. Avoid Helvetica defaults — they're heavier and lack the geometric warmth.

## Layout

### Spacing System
- **Base unit**: 8px (with 2 / 4 / 12 sub-tokens for fine work).
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 64px.
- **Section padding**: 64–96px on marketing surfaces.
- **Card internal padding**: 32px on feature/pricing cards.

### Grid & Container
- Marketing pages center in a ~1280px container with no edge-bleed; the brand keeps content inside the box.
- Pricing collapses 4-up → 2-up → 1-up at 1024 / 768 breakpoints.
- Product UI mockups stack 2-up or render as overlapping panes inside the same container.

### Whitespace Philosophy
The brand uses generous 64–96px section padding without atmospheric gradients filling the space — the white canvas is the design. The composited product UI mockups break up sections without requiring decoration.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat, 1px hairline | Default cards |
| 1 | `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` | Subtle card lift |
| 2 | `box-shadow: 0 8px 24px rgba(0,0,0,0.08)` | Floating composited UI mockups |
| 3 | `box-shadow: 0 16px 48px rgba(0,0,0,0.12)` | Modal overlays, deep elevation |

### Decorative Depth
The brand's depth is **product UI mockups** rather than gradients. Stacked dashboard, agent-performance, queue, and reporting panes composite together with subtle Level 2 shadows to suggest spatial hierarchy.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Form inputs, hairline tags |
| `{rounded.sm}` | 6px | Buttons (the brand's signature button radius), code blocks |
| `{rounded.md}` | 8px | Compact cards, alerts |
| `{rounded.lg}` | 12px | Pricing cards, feature cards, product mockups |
| `{rounded.xl}` | 16px | Modal dialogs, large container chrome |
| `{rounded.full}` | 9999px | Pill tags, avatars |

### Photography Geometry
The brand uses minimal photography. Customer logo strips display wordmarks at uniform height (~24–32px) in greyscale; case-study cards (rare) use 4:3 photos inset in `{rounded.lg}` containers.

## Components

### Buttons

**`button-primary-orange`** — the signature CTA.
- Background `{colors.primary}`, text `{colors.on-primary}` (near-black, NOT white), type `{typography.button-md}`, padding `{spacing.sm} {spacing.lg}` (8px 16px), rounded `{rounded.sm}` 6px.
- Pressed state `button-primary-orange-pressed` shifts to `{colors.primary-deep}`.

**`button-secondary-outline`** — outline alternative on white.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.hairline-strong}` border, same shape.

**`button-on-dark`** — used on dark surfaces / code-block CTAs.
- Background `{colors.primary}`, text `{colors.on-primary}`, same shape. The bright orange creates a clear action hierarchy against `{colors.canvas-night}`.

**`button-link`** — text-only inline button.
- Transparent background, text `{colors.ink}` rendered in `{typography.button-md}`, no padding, with a subtle underline on hover.

### Cards & Containers

**`card-feature-light`** — feature card on white.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}` 12px, 1px `{colors.hairline}` border.

**`card-pricing`** — standard pricing tier.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}`, 1px `{colors.hairline}` border. Title in `{typography.heading-lg}`, price in `{typography.display-md}`, body in `{typography.body-md}`, CTA `button-primary-orange` pinned bottom.

**`card-pricing-featured`** — inverted dark featured tier.
- Background `{colors.canvas-night}`, text `{colors.on-dark}`, otherwise identical structure.

**`card-feature-dark`** — feature card with deep dark fill.
- Background `{colors.canvas-night}`, text `{colors.on-dark}`, padding `{spacing.xxl}`, rounded `{rounded.lg}`. Used for code-heavy feature explanations.

**`code-block`** — code snippet container.
- Background `{colors.canvas-night}`, text `{colors.on-dark}` rendered in `{typography.code}`. Padding `{spacing.lg}` 16px, rounded `{rounded.sm}` 6px.

### Inputs & Forms

**`text-input`** — standard form input.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, padding `{spacing.sm} {spacing.md}` (8px 12px), rounded `{rounded.sm}` 6px, 1px `{colors.hairline}` border.

### Navigation

**`nav-bar-light`** — top nav across the site.
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.lg} {spacing.xl}`. Quality logo on the left, primary navigation centered, and a filled `button-primary-orange` on the right.

### Pills, Tags, and Chips

**`pill-tag-orange`** — small orange pill used for "new", active, or featured indicators.
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.micro}`, padding `{spacing.xxs} {spacing.sm}`, rounded `{rounded.full}`.

**`pill-tag-soft`** — neutral pill on light surfaces.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, otherwise same shape.

### Signature Components

**Composited Product UI Mockups** — multi-layer dashboard, queue, agent, and reporting pane composites with subtle Level 2 shadows. The product is the brand's argument; mockups sit on white or warm-white canvas with minimal surrounding decoration.

**`link-on-light`** — inline links in body copy.
- Text `{colors.ink}` rendered in `{typography.body-md}` with a persistent underline.

**`footer-light`** — site-wide footer.
- Background `{colors.canvas}`, text `{colors.ink-mute}`, type `{typography.caption}`, padding `{spacing.huge} {spacing.xl}` (64px 24px). Holds 4–5 columns of link groups, social icons, and a small legal row.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` orange for filled CTAs, active states, selected chart points, and signature brand details — it should remain intentional.
- Use `{colors.primary-pale}` and `{colors.primary-wash}` for larger branded surfaces instead of stretching the saturated orange across full sections.
- Keep `{colors.brand-red}` secondary to orange; use it only where a clear brand or emphasis purpose exists.
- Render display tiers at weight 500 with negative letter-spacing — the engineered tightness is part of the brand.
- Use `{rounded.sm}` 6px for buttons — square-ish radii, never pill-shaped.
- Composite product UI mockups inside `{rounded.lg}` containers with subtle Level 2 shadows.
- Use near-black `{colors.ink}` on the orange button (not white) — the official orange is bright enough to read as a "lit" surface with dark type.
- Apply system mono for every code block.

### Don't
- Don't introduce unrelated decorative hues as system colors. Functional status or chart colors may be added only when orange variations cannot communicate the distinction safely.
- Don't use `{colors.brand-red}` as a second primary CTA; it should never compete with the orange action hierarchy.
- Don't bump display weight above 500 — the brand's calibrated mid-weight breaks at 600+.
- Don't use pill-shaped buttons; the brand's button radius is square-ish 6px.
- Don't use white text on the orange button — `{colors.on-primary}` near-black provides the intended contrast.
- Don't add atmospheric gradients to hero bands — the white canvas is the design.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Wide | ≥ 1440px | Full container width; product mockups at full scale |
| Desktop | 1024–1440px | Default content max-width; pricing 4-up |
| Tablet | 768–1023px | Pricing 2-up; mockups simplify to single panel |
| Mobile | < 768px | Pricing 1-up; hamburger nav; display drops 64 → 36px |

### Touch Targets
- Buttons hit ≥ 36×36px on mobile; vertical padding scales up to maintain WCAG AA minimum.
- Form fields stay at 36px minimum height.

### Collapsing Strategy
- Display tiers stair-step 64 → 48 → 36 → 28 → 22px.
- Product UI mockups simplify to a single primary panel on mobile.
- Pricing tiers stair-step 4-up → 2-up → 1-up; dark featured tier always distinguished.

### Image Behavior
Product UI mockups use `srcset` with desktop / mobile crops; mobile crops focus on the most actionable inner panel.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly.
3. Run `npx @google/design.md lint DESIGN.md` after edits.
4. Default body to `{typography.body-md}`; use `{typography.code}` for any developer-facing snippet.
5. Keep saturated orange focused; default to one dominant filled orange action per viewport.
6. The white-canvas commitment is non-negotiable — adding atmospheric backdrops breaks the brand.
