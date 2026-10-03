# Typography audit

Step 1 of the typography unification. **This document is an audit only — no
production code has been changed.** It records what the type system currently
does on every route, at every audited breakpoint, and where it contradicts
itself. Step 2 (defining the new global type tokens) is not started.

## Method

Measured, not read from source. `scripts/audit-typography.mjs` drives headless
Chrome over CDP at 17 viewport widths and reads the computed style and per-line
client rects of each role element.

- Routes: 8 (`/`, `/our-story`, `/menu`, `/gallery`, `/visit-contact`,
  `/privacy-policy`, `/terms-and-conditions`, 404)
- Widths: 320, 375, 390, 414, 599, 600, 744, 768, 900, 1023, 1024, 1099, 1100,
  1280, 1366, 1440, 1920
- Samples: 136 page/width combinations, 29 sections, no page exceptions
- Motion disabled via `prefers-reduced-motion` so reveal transforms never leave
  elements translated and unmeasurable

Per role element the harness records font family, size, weight, style, line
height, letter spacing, colour, text transform, alignment, wrap, max-width,
first-line ink edge, line count, the rendered text of every line, and the
eyebrow→heading and heading→description gaps.

Three measurement notes, because they change how the numbers should be read:

- **Contrast is only reported over solid backgrounds.** Walking the ancestor
  chain for a `background-color` finds the section's white, not the pixels
  behind glyphs sitting on a photograph. Hero text is instead flagged
  `over image` and left unmeasured. A naive version of this check reported
  white-on-white as `1.00:1` for the menu and visit heroes, which is wrong.
- **Ramps, not exact pixels, are the unit of comparison.** A fluid `clamp()`
  sampled at 17 widths yields 17 values. Sites that produce the *identical
  sequence* of values across all 17 widths are on one ramp; a separate
  sequence means a separate declaration. Comparing raw pixel values across
  widths would report dozens of false inconsistencies.
- **A vertical gap is only meaningful when the two boxes are stacked.** Where a
  heading sits in one grid column and its description in another, the raw
  box-to-box distance measures column height, not spacing. `/our-story` origin,
  `/visit-contact` and 404 are two-column at some widths, so their raw gaps
  (up to 975px) are excluded rather than reported as defects.

Data: `docs/_audit-raw.json` (raw), `docs/_audit-findings.json` (grouped),
`docs/_audit-detail.json` (per site/width), Appendix A–C below.

## Coverage

| | count |
|---|---|
| sections detected | 29 |
| with an eyebrow | 21 |
| with a heading | 24 |
| with a description | 24 |
| heading tags | 8 × `h1`, 15 × `h2`, 1 × `h3`, 5 with no heading |

Five blocks carry no type roles and are correctly out of scope
(`ostory-story-img`, `menu-cats`, both `legal-progress`, `nf-word` — image
rows, category chips, a scroll progress bar and a decorative wordmark).

## The root cause

There are **two parallel mobile type systems**, and this single fact explains
most of what follows.

`src/app/global.css:65-82` defines the global ramp: `--fs-eyebrow`,
`--fs-section`, `--fs-h1`, `--fs-h3`, `--fs-text`, `--fs-lead`. Then
`src/app/global.css:358-381` defines a **second, Home-only** set in the same
block — `--m-eyebrow-size: 0.75rem` (12px), `--m-heading-size: 1.5rem` (24px),
`--m-body-size: 1rem` (16px), `--m-gap-eyebrow: 8px`, `--m-gap-heading: 16px`
— described in its own comment as "Scoped to the Home sections only;
`/our-story`, `/menu`, `/gallery` and the rest keep their own tiers."

So at the same 375px viewport the home page renders a 12px eyebrow and every
other page renders 10px. Nothing is broken; there are simply two answers to
"what is a section eyebrow on a phone."

The story page then adds a third, tablet-only system:
`--ostory-tablet-heading: clamp(42px, 7vw, 52px)`, `--ostory-tablet-desc: 20px`,
`--ostory-tablet-eyebrow: 13px`, consumed at
`OurStoryHero.css:250,265,269`, `OurStoryOrigin.css:605,612,616`,
`OurStoryCta.css:104,109,113`.

### Ramps actually in use

| role | distinct ramps | largest group |
|---|---|---|
| eyebrow | 4 | 11 sites |
| heading | 9 | 10 sites |
| description | 8 | 9 sites |

Three roles across eight routes should need roughly one ramp each plus at most
a hero and a section variant. The site has 4, 9 and 8. Full signatures in
Appendix C.

## Findings

Severity is about *consequence for the reader*, not effort to fix.

### High

**H1 — Two parallel mobile type systems.** `global.css:358-381` defines the
Home-only set; `global.css:423-444` (eyebrow), `454-459` (heading) and
`499-505` (description) then apply it through 24 selectors that spell out Home's
class names one by one — `.hero.hero .hero-eyebrow`,
`.experience.experience .eyebrow`, `.cafe.cafe .cafe-copy .cafe-paragraph` and so
on. Everywhere else those same roles read `--fs-eyebrow` / `--fs-section` /
`--fs-text` at `global.css:515,541,760`. Root cause of H5 and most of M4.

**H2 — `/our-story` steps out of the fluid ramp above 600px.** All three story
descriptions are a flat 20px from 600 to 1920px, while every other description
on the site follows the `--fs-text` clamp and keeps growing to 20px only at the
very top of the range (17.04px at 768, 17.9px at 1100, 18.78px at 1440). The
story band is 0.22–2.7px larger than its neighbours across the whole desktop
range, and the two are produced by unrelated declarations, so they will keep
drifting.

*This finding is narrower than it was on first measurement. An earlier read of
this page showed the story descriptions collapsing to 14.72px and 15.2px at
1100px, falling back to `--fs-body-sm` and `--fs-small`; the 1100px continuation
block now fixes that, and the shrink is gone. Recorded here because the audit
ran against two different states of these files — see Method.*

**H3 — Three sites step hard across the 599/600 boundary.** `ostory-origin` and
`ostory-cta` headings hold 24px flat below 600 and step to **42px** at 600 — a
75% jump across one pixel of viewport width — then 52px at 744, where they sit
flat to 1920. That is three sizes inside 144px of viewport. The gallery hero
makes the same move from 32px to 42.2px. The story descriptions jump 14px → 20px
and 15.2px → 20px at the same boundary, and their eyebrows 10px → 13px. All of it
comes from the `--ostory-*` band switching on at exactly 600px while the phone
tier is still holding a flat value. The story hero heading has the same shape in
miniature (42.179 → 42 → 52).

**H4 — `/visit-contact` heading collapses at 768px.** The contact card title
climbs 28 → 36 → 38.4px through the phone and tablet tiers, then **drops to
28.15px** at 768 where `VisitContact.css:177`'s `clamp(1.75rem, 6vw, 2.4rem)`
stops applying and the global `--fs-h3` ramp takes over. A 10.25px drop, then
it climbs again to 40px at 1920. Two ramps fighting across one breakpoint.

**H5 — Eyebrows are 10px on phones across 13 sites.** `--fs-eyebrow` is
overridden to 0.625rem at `global.css:363`. Measured 10px at 320–744px on
`menu-hero`, `menu-cafe`, `menu-cta`, `gal-hero`, all four `gal-section`s,
`visit-hero`, `visit-cta`, both `legal-wrap`s and `nf-inner`. Home renders 12px
and `/our-story` renders 13px on the same phone. Three baselines for one role.

**H6 — Gold eyebrow `#c7a45a` fails contrast at every width it appears.**
Measured on solid backgrounds only:

| background | ratio | sites |
|---|---|---|
| white / off-white | **2.36:1** | home story, home cafe, story hero, story CTA, menu-cta, 3 × gal-section, visit-cta, both legal wraps (9) |
| cream `#f7f3eb` | **2.25:1** | home experience, menu-cafe, 404 (3) |
| `#fbf7f0` | **2.14:1** | home gallery, story origin, gal-hero, gallery bookend (4) |

Eyebrows are 10–14px, so WCAG AA requires 4.5:1; large-text AA (3:1) does not
apply at that size. Every dark heading measures 12.3–13.6:1 and passes
comfortably. The colour is reported as-is and was not changed; note that
fixing this needs a decision about the brand gold, since every other
alternative is a palette change.

**H7 — Home hero h1 is capped flat across a 288px band.** `Hero.css:273`
sets `clamp(1.45rem, 7.6vw, 2.35rem)`, whose 2.35rem ceiling is reached at
495px and then holds to 767px: 37.6px flat at 480, 599, 600 and 744. At 768 it
joins the global ramp and jumps to 45.73px (+8.13px). The home hero is also the
smallest hero on the site at 320px — 24.32px against 36.32px for menu, visit
and both legal pages.

**H8 — 404 h1 tops out at 36.8px.** `NotFoundPage.css:61`
`clamp(1.6rem, 3.5vw, 2.3rem)` caps at 2.3rem = 36.8px, then holds flat to
1920px. The four working hero h1s reach 69.92px. The 404 h1 is 53% of the
largest and 61% of the 1440px value (36.8 vs 59.84).

### Medium

**M1 — 8 description ramps.** Full signatures in Appendix C. The 9-site group
follows `--fs-text` (16 → 20px). The outliers:

| site | ramp | note |
|---|---|---|
| `privacy` / `terms` lede | 17 → 27.84px | its own clamp, `--fs-lead`; largest description on the site |
| `ostory-origin` | 14 → 20px, then flat to 1920 | H2; flat, no shrink at 1100 |
| `ostory-cta` | 15.2 → 20px, then flat to 1920 | H2; flat, no shrink at 1100 |
| `visit-contact` intro | 16.32px flat to 1100 → 19.2px | flat, then a late start |
| `gal-hero` | 15px flat to 414, then joins `--fs-text` | 1px below the 15.68px floor |

**M2 — 9 heading ramps.** `24px flat to 744 then 38.14 → 56px` covers the 10
standard `h2`s. The other 14 headings each differ: 4 share the hero ramp
(36.32 → 69.92), and 8 are singletons including the three non-monotonic cases
in H3, H4 and `benefits`.

**M3 — `benefits` h3 shrinks at 1100px.** 31.59px at 1099 → **28px** at 1100,
then 28px flat to 1920 (`BenefitsSection.css:92` hard-codes `28px`).

**M4 — Four eyebrow baselines.** 10px (11 sites), 12px (5 Home sites), 13px
(`/our-story` origin on phones, and story hero/CTA in the tablet band). Above
1100px every site converges on one ramp, 12.95 → 14px.

**M5 — The `- ` eyebrow prefix is baked into content strings, not decoration.**
Fourteen components hard-code the dash into the text node
(`GalleryHero.jsx:85`, `CafeMenu.jsx:52`, `GalleryMood.jsx:68`, `Hero.jsx:32`,
`StorySection.jsx:41`, `MenuCafe.jsx:38`, `MenuHero.jsx:30`,
`OurStoryOrigin.jsx:55`, `VisitHero.jsx:31`, `GalleryPage.jsx:8,26,45,66`,
`HomePage.jsx:6`, `MenuPage.jsx:20`, both legal pages, `NotFoundPage.jsx:17`),
while `OurStoryHero.jsx:89` and `OurStoryCta.jsx:8` render a proper
`<span className="ostory-dash" aria-hidden="true" />`. Two mechanisms for one
ornament. `GalleryGrid.jsx:53,114` has to strip it with
`.replace(/-\s*/, '')` to build a clean `aria-label`, which only works because
those four callers strip it — everywhere else the hyphen reaches the
accessibility tree as part of the label.

**M6 — Gaps are not a token system.** The `Home` set already has
`--m-gap-eyebrow: 8px` and `--m-gap-heading: 16px`; most other sections use
per-component rem margins. Measured eyebrow→heading, stacked pairs only:

| gap | sites |
|---|---|
| 8px | Home hero, experience, story, cafe, gallery (phone tier) |
| 11.1–11.2px | `ostory-cta` |
| 14.4px | `menu-hero` |
| 16px | `menu-cafe`, `menu-cta`, both `gal-section`s, both legal wraps |
| 16–17.5px | `ostory-hero`, `ostory-origin` |
| 19.5–20.8px | `gal-hero`, `visit-cta` |
| **83–110px** | `nf-inner` |

Heading→description: 14.4px (`menu-hero`, `visit-hero`), 16px (Home at phone),
19.1–19.2px (8 sites — the closest thing to a de-facto standard),
22.4px (`ostory-cta`), 25.5–25.6px (`cafe`, `menu-cafe`).

Several gaps are also *not constant across widths*: Home hero measures 16px at
320 and 36.3px at 768, Home cafe 16 → 25.6px, Home story 16 → 30px. Because
these are `rem` margins against fluid type, the spacing drifts with the type
instead of being a fixed step.

**M7 — 404 eyebrow→heading gap is 83–110px.** Everything else is 8–20.8px. The
decorative 404 wordmark sits between them.

### Low / notes

**L1 — Two heading colours are off-palette.** `ostory-origin` heading is
`#3b2518` against `#432719` everywhere else. `menu-special` heading is
`#a96e3f`, the only heading in terracotta, at 4.21:1 — passing AA for large
text but the only heading distinguished by colour rather than size.

**L2 — `benefits` h3 is upright.** Every other heading on the site is
`italic`; `benefit-title` is `normal`. It is also the only `h3` used as a
section heading.

**L3 — No line-leading `&`, no missing spaces, no orphans, no overflow.**
Checked across all 17 widths: no rendered line begins with `&`, no
`word,Word` joins, no single-word last line on a multi-line heading, and no
horizontal overflow on any route at any width (`scrollWidth <= innerWidth`
everywhere). The three hits from the automated dash check are the literal `- `
prefix in M5, not a wrapping defect.

### Alignment

Checked by comparing the axis each role actually aligns on — centre line for
centred text, first-line ink edge for left-aligned — because comparing raw box
edges flags every centred eyebrow over a max-width heading.

**No alignment defects.** All 24 headings, 21 eyebrows and 24 descriptions sit
on a common axis with their neighbours at all 17 widths.

## Per-route summary

| route | eyebrow | heading | description | notes |
|---|---|---|---|---|
| `/` | 12px phone, 5 sites | h1 24.32→69.92 (capped 37.6 to 767); 4 × h2 24→56; h3 24→31.59→28 | 16→20, all 6 sections on one ramp | only route with its own `--m-*` tokens |
| `/our-story` | 10/13px | h1 36.32→69.92 (42 and 52 flat bands); 2 × h2 24→42→52 flat to 1920 | 14/16/15.2 → 20, flat to 1920 | H2, H3; tablet-only token band |
| `/menu` | 10px | h1 on hero ramp; 3 × h2 on section ramp | 16→20 (4 sites) | M1 heading colour |
| `/gallery` | 10px | h1 32→42.2→69.92; 4 × h2 on section ramp | 15 then 16→20 | H3 |
| `/visit-contact` | 10px | h1 on hero ramp; CTA h2 on section ramp; card h2 28→38.4→28.15→40 | hero 16→20, card 16.32 flat→19.2 | H4 |
| `/privacy-policy` | 10px | h1 on hero ramp | 17→27.84 lede | `--fs-lead`, largest body copy on site |
| `/terms-and-conditions` | 10px | h1 on hero ramp | 17→27.84 lede | identical to privacy |
| 404 | 10px | h1 25.6→36.8, flat to 1920 | 16px flat to 1100 → 19.2 | H8, M7 |

## Exceptions to preserve

These are Figma-fitted compositions, not drift. Flagged so Step 2 does not
flatten them:

- **`/our-story` origin** — two-column, and its own `--ostory-tablet-*` band.
  The band itself is intentional; the defects (H2, H3) are the hard step at
  600px and the flat 20px above it, not the band's existence.
- **Home "Our Story"** — the `--m-*` token set exists to hold this section's
  fitted proportions.
- **Home "From the Café"** — 25.5–25.6px heading→description gap, wider than
  the 19.1px de-facto standard, and shared with `menu-cafe`.

## Recommendation for Step 2 (not implemented)

Recorded here for review. No code has been touched.

1. **Collapse the two mobile systems into one.** Retire `--m-eyebrow-size`,
   `--m-heading-size`, `--m-body-size` and let Home consume the same
   `--fs-*` tokens as every other route, keeping the Home values as the
   chosen tier so nothing shifts visually.
2. **Fold `--ostory-tablet-*` into shared tokens** with a continuous phone→tablet
   ramp, so the 75% step at 600px (H3) and the flat 20px ceiling (H2) both go
   away. The 1100px continuation block added after the first measurement already
   removed the desktop drop.
3. **One ramp per role plus explicit hero/section variants.** 4/9/8 becomes
   roughly 1/2/2.
4. **Two fixed gap tokens** replacing the `rem`-margin drift, one for
   eyebrow→heading and one for heading→description, with the exceptions above
   as scoped opt-ins.
5. **Eyebrow floor.** 10px needs a decision — raise it, or accept it as
   intentional tracking-led small caps.
6. **Move the `- ` prefix out of content strings** into the shared eyebrow
   primitive, which also removes the `GalleryGrid` aria-label strip.
7. **Contrast (H6) is a palette decision**, not a type decision. Flagged, not
   scheduled.

## Reproducing

With the dev server on `http://localhost:5173`:

```
node scripts/audit-typography.mjs        # measure -> docs/_audit-raw.json
node scripts/audit-typography-report.mjs # group   -> docs/_audit-findings.json, _audit-detail.json
node scripts/_audit-appendix.mjs         # tables  -> splices Appendix A-C below
```

The third script replaces the three generated appendices below, so the tables
always match the last measurement. Re-run all three before relying on any
number here after a change.

## Appendix

- **A** — computed font size at all 17 widths, every section.
- **B** — full computed style per role at 320 / 768 / 1440.
- **C** — ramp signatures, grouped.

## Appendix A. Computed font size at all 17 audited widths

Tiers: phone `<600`, tablet `600-1099`, desktop `>=1100`. Values are the
rendered `font-size` in px at each viewport width, measured on the live
page. `20.0` flat across a whole column marks a hard-coded value rather
than a fluid one.

### home — `/`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hero | 12 | 12 | 12 | 12 | 12 | 12 | 12 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| experience | 12 | 12 | 12 | 12 | 12 | 12 | 12 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| section story | 12 | 12 | 12 | 12 | 12 | 12 | 12 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| cafe | 12 | 12 | 12 | 12 | 12 | 12 | 12 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| gallery | 12 | 12 | 12 | 12 | 12 | 12 | 12 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` hero | 24.32 | 28.5 | 29.64 | 31.46 | 37.6 | 37.6 | 37.6 (flat) | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |
| `h2` experience | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h2` section story | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h3` benefits | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 28.15 | 29.52 | 30.8 | 30.81 | 31.59 | 28 | 28 | 28 | 28 | 28 (flat) |
| `h2` cafe | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h2` gallery | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hero | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| experience | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| section story | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| benefits | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| cafe | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| gallery | 16 | 16 | 16 | 16 | 16 | 16 | 16 (flat) | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |

### story — `/our-story`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ostory-hero | 10 | 10 | 10 | 10 | 10 (flat) | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 (flat) |
| ostory-origin | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 (flat) |
| ostory-cta | 10 | 10 | 10 | 10 | 10 (flat) | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 (flat) |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` ostory-hero | 36.32 | 37.48 | 37.79 | 38.29 | 42.18 | 42 | 52 | 52 | 52 | 52 | 52 | 52 (flat) | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |
| `h2` ostory-origin | 24 | 24 | 24 | 24 | 24 (flat) | 42 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 (flat) |
| `h2` ostory-cta | 24 | 24 | 24 | 24 | 24 (flat) | 42 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 | 52 (flat) |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ostory-hero | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 (flat) |
| ostory-origin | 14 | 14 | 14 | 14 | 14 (flat) | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 (flat) |
| ostory-cta | 15.2 | 15.2 | 15.2 | 15.2 | 15.2 (flat) | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 | 20 (flat) |

### menu — `/menu`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| menu-hero | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| menu-cafe | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| menu-cta | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` menu-hero | 36.32 | 37.48 | 37.79 | 38.29 | 42.18 | 42.2 | 45.22 | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |
| `h2` menu-special | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h2` menu-cafe | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h2` menu-cta | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| menu-hero | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| menu-special | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| menu-cafe | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| menu-cta | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |

### gallery — `/gallery`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gal-hero | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| gal-section | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| gal-section gal-section--bookend | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` gal-hero | 32 | 32 | 32 | 32 (flat) | 42.18 | 42.2 | 45.22 | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |
| `h2` gal-section | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |
| `h2` gal-section gal-section--bookend | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gal-hero | 15 | 15 | 15 | 15 (flat) | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| gal-section | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| gal-section gal-section--bookend | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |

### visit — `/visit-contact`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| visit-hero | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |
| visit-cta section | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` visit-hero | 36.32 | 37.48 | 37.79 | 38.29 | 42.18 | 42.2 | 45.22 | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |
| `h2` visit-contact section | 28 | 28 | 28 | 28 (flat) | 35.94 | 36 | 38.4 | 28.15 | 29.52 | 30.8 | 30.81 | 31.59 | 31.6 | 33.47 | 34.37 | 35.14 | 40 |
| `h2` visit-cta section | 24 | 24 | 24 | 24 | 24 | 24 | 24 (flat) | 38.14 | 40.19 | 42.1 | 42.11 | 43.27 | 43.29 | 46.08 | 47.41 | 48.56 | 56 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| visit-hero | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |
| visit-contact section | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 | 16.32 (flat) | 16.64 | 17.76 | 18.72 | 19.2 |
| visit-cta section | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |

### privacy — `/privacy-policy`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legal-wrap | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` legal-wrap | 36.32 | 37.48 | 37.79 | 38.29 | 42.18 | 42.2 | 45.22 | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legal-wrap | 17 | 17.02 | 17.13 | 17.3 | 18.59 | 18.6 | 19.61 | 19.78 | 20.7 | 21.56 | 21.57 | 22.09 | 22.1 | 23.36 | 23.96 | 24.48 | 27.84 |

### terms — `/terms-and-conditions`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legal-wrap | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` legal-wrap | 36.32 | 37.48 | 37.79 | 38.29 | 42.18 | 42.2 | 45.22 | 45.73 | 48.5 | 51.08 | 51.1 | 52.68 | 52.7 | 56.48 | 58.29 | 59.84 | 69.92 |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| legal-wrap | 17 | 17.02 | 17.13 | 17.3 | 18.59 | 18.6 | 19.61 | 19.78 | 20.7 | 21.56 | 21.57 | 22.09 | 22.1 | 23.36 | 23.96 | 24.48 | 27.84 |

### notfound — `/this-route-does-not-exist`

**Eyebrow**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| nf-inner | 10 | 10 | 10 | 10 | 10 | 10 | 10 (flat) | 12.52 | 12.69 | 12.85 | 12.85 | 12.95 | 12.95 | 13.18 | 13.3 | 13.39 | 14 |

**Heading**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `h1` nf-inner | 25.6 | 25.6 | 25.6 | 25.6 | 25.6 | 25.6 (flat) | 26.04 | 26.88 | 31.5 | 35.81 | 35.84 | 36.8 | 36.8 | 36.8 | 36.8 | 36.8 | 36.8 (flat) |

**Description**

| section | 320 | 375 | 390 | 414 | 599 | 600 | 744 | 768 | 900 | 1023 | 1024 | 1099 | 1100 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| nf-inner | 16 | 16.02 | 16.05 | 16.12 | 16.6 | 16.6 | 16.97 | 17.04 | 17.38 | 17.7 | 17.7 | 17.9 | 17.9 | 18.37 | 18.59 | 18.78 | 20 |

## Appendix B. Full computed style per role

Sampled at 320, 768 and 1440. `lh` is the used line-height in px, `trk`
the computed letter-spacing, `max-w` the resolved max-width.

### home — `/`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `hero` | eyebrow | 320 | sans | 12px | 400 | normal | 16.8px | 0.6px | `rgb(232, 217, 197)` | start | balance | none | 1 | over image |
| `hero` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(232, 217, 197)` | start | pretty | none | 1 | over image |
| `hero` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(232, 217, 197)` | start | pretty | none | 1 | over image |
| `hero` | heading | 320 | serif | 24.32px | 700 | italic | 27.968px | -0.2432px | `rgb(255, 255, 255)` | start | balance | none | 3 | over image |
| `hero` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(255, 255, 255)` | start | balance | none | 3 | over image |
| `hero` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(255, 255, 255)` | start | balance | none | 3 | over image |
| `hero` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 100% | 6 | over image |
| `hero` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 700px | 2 | over image |
| `hero` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 700px | 3 | over image |
| `experience` | eyebrow | 320 | sans | 12px | 400 | normal | 16.8px | 0.6px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `experience` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `experience` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `experience` | heading | 320 | serif | 24px | 700 | italic | 27.6px | -0.24px | `rgb(67, 39, 25)` | center | balance | 640px | 3 | 12.94 |
| `experience` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | center | balance | 640px | 2 | 12.94 |
| `experience` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 12.94 |
| `experience` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgb(119, 104, 93)` | center | pretty | 100% | 5 | 5.09 |
| `experience` | desc | 768 | sans | 17.0368px | 400 | normal | 30.6662px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 3 | 5.09 |
| `experience` | desc | 1440 | sans | 18.784px | 400 | normal | 33.8112px | normal | `rgb(119, 104, 93)` | center | pretty | 560px | 3 | 5.09 |
| `section story` | eyebrow | 320 | sans | 12px | 400 | normal | 16.8px | 0.6px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `section story` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `section story` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `section story` | heading | 320 | serif | 24px | 700 | italic | 27.6px | -0.24px | `rgb(67, 39, 25)` | start | balance | 640px | 3 | 13.61 |
| `section story` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | start | balance | 640px | 3 | 13.61 |
| `section story` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | start | nowrap balance | none | 3 | 13.61 |
| `section story` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgb(119, 104, 93)` | start | pretty | 520px | 4 | 5.35 |
| `section story` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | start | pretty | 520px | 3 | 5.35 |
| `section story` | desc | 1440 | sans | 18.784px | 400 | normal | 33.8112px | normal | `rgb(119, 104, 93)` | start | pretty | 560px | 3 | 5.35 |
| `benefits` | heading | 320 | serif | 24px | 700 | normal | 27.6px | -0.24px | `rgb(67, 39, 25)` | center | balance | none | 1 | 12.3 |
| `benefits` | heading | 768 | serif | 28.1472px | 700 | normal | 30.9619px | -0.281472px | `rgb(67, 39, 25)` | center | balance | none | 2 | 12.3 |
| `benefits` | heading | 1440 | serif | 28px | 700 | normal | 30.8px | -0.28px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 12.3 |
| `benefits` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgb(119, 104, 93)` | center | pretty | none | 2 | 4.84 |
| `benefits` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | center | pretty | none | 2 | 4.84 |
| `benefits` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | center | pretty | none | 2 | 4.84 |
| `cafe` | eyebrow | 320 | sans | 12px | 400 | normal | 16.8px | 0.6px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.36 |
| `cafe` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.36 |
| `cafe` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | pretty | none | 1 | over image |
| `cafe` | heading | 320 | serif | 24px | 700 | italic | 27.6px | -0.24px | `rgb(67, 39, 25)` | start | balance | none | 2 | 13.61 |
| `cafe` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | start | balance | none | 3 | 13.61 |
| `cafe` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | start | balance | none | 4 | 13.61 |
| `cafe` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgb(119, 104, 93)` | start | pretty | 440px | 3 | 5.35 |
| `cafe` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | start | pretty | 440px | 2 | 5.35 |
| `cafe` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | start | pretty | 440px | 3 | 5.35 |
| `gallery` | eyebrow | 320 | sans | 12px | 400 | normal | 16.8px | 0.6px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.14 |
| `gallery` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.14 |
| `gallery` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.14 |
| `gallery` | heading | 320 | serif | 24px | 700 | italic | 27.6px | -0.24px | `rgb(67, 39, 25)` | center | balance | none | 3 | 12.3 |
| `gallery` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | center | balance | none | 2 | 12.3 |
| `gallery` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 12.3 |
| `gallery` | desc | 320 | sans | 16px | 400 | normal | 24px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 4 | 4.84 |
| `gallery` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 2 | 4.84 |
| `gallery` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | center | nowrap pretty | 100% | 1 | 4.84 |

### story — `/our-story`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ostory-hero` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.36 |
| `ostory-hero` | eyebrow | 768 | sans | 13px | 500 | normal | 20.8px | 4.16px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.36 |
| `ostory-hero` | eyebrow | 1440 | sans | 13px | 500 | normal | 20.8px | 4.16px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.36 |
| `ostory-hero` | heading | 320 | serif | 36.32px | 700 | italic | 39.952px | -0.3632px | `rgb(67, 39, 25)` | start | balance | 350px | 3 | 13.61 |
| `ostory-hero` | heading | 768 | serif | 52px | 700 | italic | 57.2px | -0.52px | `rgb(67, 39, 25)` | start | nowrap balance | min(640px, 100%) | 2 | 13.61 |
| `ostory-hero` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(67, 39, 25)` | start | balance | 100% | 1 | 13.61 |
| `ostory-hero` | desc | 320 | sans | 16px | 400 | normal | 26.4px | normal | `rgb(119, 104, 93)` | start | pretty | none | 3 | 5.35 |
| `ostory-hero` | desc | 768 | sans | 20px | 400 | normal | 34px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 2 | 5.35 |
| `ostory-hero` | desc | 1440 | sans | 20px | 400 | normal | 34px | normal | `rgb(119, 104, 93)` | start | nowrap pretty | none | 1 | 5.35 |
| `ostory-origin` | eyebrow | 320 | sans | 13px | 400 | normal | 20.8px | 0.65px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.14 |
| `ostory-origin` | eyebrow | 768 | sans | 13px | 400 | normal | 20.8px | 0.624px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.14 |
| `ostory-origin` | eyebrow | 1440 | sans | 13px | 500 | normal | 20.8px | 4.16px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.14 |
| `ostory-origin` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | start | balance | 640px | 3 | 12.3 |
| `ostory-origin` | heading | 768 | serif | 52px | 700 | italic | 57.2px | -0.52px | `rgb(59, 37, 24)` | start | nowrap balance | none | 2 | 12.96 |
| `ostory-origin` | heading | 1440 | serif | 52px | 700 | italic | 57.2px | -0.52px | `rgb(67, 39, 25)` | start | balance | 640px | 3 | 12.3 |
| `ostory-origin` | desc | 320 | sans | 14px | 400 | normal | 18px | normal | `rgb(119, 104, 93)` | start | pretty | 540px | 4 | 4.84 |
| `ostory-origin` | desc | 768 | sans | 20px | 400 | normal | 26px | normal | `rgb(117, 103, 93)` | start | pretty | none | 3 | 4.92 |
| `ostory-origin` | desc | 1440 | sans | 20px | 400 | normal | 34px | normal | `rgb(119, 104, 93)` | start | pretty | 540px | 3 | 4.84 |
| `ostory-cta` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `ostory-cta` | eyebrow | 768 | sans | 13px | 500 | normal | 20.8px | 4.16px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `ostory-cta` | eyebrow | 1440 | sans | 13px | 500 | normal | 20.8px | 4.16px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `ostory-cta` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | center | balance | 640px | 2 | 13.61 |
| `ostory-cta` | heading | 768 | serif | 52px | 700 | italic | 57.2px | -0.52px | `rgb(67, 39, 25)` | center | balance | 640px | 2 | 13.61 |
| `ostory-cta` | heading | 1440 | serif | 52px | 700 | italic | 57.2px | -0.52px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 13.61 |
| `ostory-cta` | desc | 320 | sans | 15.2px | 400 | normal | 25.84px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 2 | 5.35 |
| `ostory-cta` | desc | 768 | sans | 20px | 400 | normal | 34px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 2 | 5.35 |
| `ostory-cta` | desc | 1440 | sans | 20px | 400 | normal | 34px | normal | `rgb(119, 104, 93)` | center | pretty | 620px | 2 | 5.35 |

### menu — `/menu`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `menu-hero` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | pretty | none | 1 | over image |
| `menu-hero` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | pretty | none | 1 | over image |
| `menu-hero` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | pretty | none | 1 | over image |
| `menu-hero` | heading | 320 | serif | 36.32px | 700 | italic | 39.952px | -0.3632px | `rgb(255, 255, 255)` | start | balance | none | 6 | over image |
| `menu-hero` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(255, 255, 255)` | start | balance | none | 4 | over image |
| `menu-hero` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(255, 255, 255)` | start | balance | none | 3 | over image |
| `menu-hero` | desc | 320 | sans | 16px | 400 | normal | 26.4px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 6 | over image |
| `menu-hero` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 3 | over image |
| `menu-hero` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 3 | over image |
| `menu-special` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(169, 110, 63)` | start | balance | none | 3 | 4.21 |
| `menu-special` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(169, 110, 63)` | start | balance | none | 2 | 4.21 |
| `menu-special` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(169, 110, 63)` | start | balance | none | 2 | 4.21 |
| `menu-special` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | start | pretty | 482.944px | 2 | 5.35 |
| `menu-special` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | start | pretty | 514.783px | 1 | 5.35 |
| `menu-special` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | start | pretty | 568.508px | 1 | 5.35 |
| `menu-cafe` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.25 |
| `menu-cafe` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.25 |
| `menu-cafe` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | pretty | none | 1 | 2.25 |
| `menu-cafe` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | start | balance | 640px | 2 | 12.94 |
| `menu-cafe` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | start | balance | 640px | 2 | 12.94 |
| `menu-cafe` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | start | balance | 640px | 2 | 12.94 |
| `menu-cafe` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | start | pretty | 620px | 3 | 5.09 |
| `menu-cafe` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | start | pretty | 620px | 2 | 5.09 |
| `menu-cafe` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | start | nowrap pretty | none | 1 | 5.09 |
| `menu-cta` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `menu-cta` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `menu-cta` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.36 |
| `menu-cta` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | center | balance | 640px | 3 | 13.61 |
| `menu-cta` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | center | balance | 640px | 2 | 13.61 |
| `menu-cta` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 13.61 |
| `menu-cta` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | center | pretty | 800px | 6 | 5.35 |
| `menu-cta` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | center | pretty | 800px | 3 | 5.35 |
| `menu-cta` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | center | pretty | 800px | 2 | 5.35 |

### gallery — `/gallery`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `gal-hero` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-hero` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-hero` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-hero` | heading | 320 | serif | 32px | 700 | italic | 38.4px | -0.32px | `rgb(59, 33, 24)` | left | balance | none | 2 | 13.39 |
| `gal-hero` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(67, 39, 25)` | left | balance | 100% | 2 | 12.3 |
| `gal-hero` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(67, 39, 25)` | left | nowrap balance | 100% | 1 | 12.3 |
| `gal-hero` | desc | 320 | sans | 15px | 400 | normal | 22.5px | normal | `rgb(119, 104, 93)` | left | pretty | 350px | 3 | 4.84 |
| `gal-hero` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 2 | 4.84 |
| `gal-hero` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 2 | 4.84 |
| `gal-section` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.36 |
| `gal-section` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.36 |
| `gal-section` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.36 |
| `gal-section` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | left | balance | 640px | 2 | 13.61 |
| `gal-section` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | left | balance | 640px | 1 | 13.61 |
| `gal-section` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | left | balance | none | 2 | 13.61 |
| `gal-section` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 3 | 5.35 |
| `gal-section` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | left | pretty | 640px | 2 | 5.35 |
| `gal-section` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 2 | 5.35 |
| `gal-section gal-section--bookend` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-section gal-section--bookend` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-section gal-section--bookend` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | left | wrap | none | 1 | 2.14 |
| `gal-section gal-section--bookend` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | left | balance | 640px | 2 | 12.3 |
| `gal-section gal-section--bookend` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | left | balance | 640px | 1 | 12.3 |
| `gal-section gal-section--bookend` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | left | balance | none | 2 | 12.3 |
| `gal-section gal-section--bookend` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 3 | 4.84 |
| `gal-section gal-section--bookend` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | left | pretty | 640px | 2 | 4.84 |
| `gal-section gal-section--bookend` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | left | pretty | 560px | 2 | 4.84 |

### visit — `/visit-contact`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `visit-hero` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | wrap | none | 1 | over image |
| `visit-hero` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | wrap | none | 1 | over image |
| `visit-hero` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | wrap | none | 1 | over image |
| `visit-hero` | heading | 320 | serif | 36.32px | 700 | italic | 39.952px | -0.3632px | `rgb(255, 255, 255)` | start | balance | none | 4 | over image |
| `visit-hero` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(255, 255, 255)` | start | balance | none | 2 | over image |
| `visit-hero` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(255, 255, 255)` | start | nowrap balance | none | 1 | over image |
| `visit-hero` | desc | 320 | sans | 16px | 400 | normal | 26.4px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 6 | over image |
| `visit-hero` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 2 | over image |
| `visit-hero` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgba(255, 255, 255, 0.88)` | start | pretty | 520px | 2 | over image |
| `visit-contact section` | heading | 320 | serif | 28px | 700 | italic | 30.8px | -0.28px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `visit-contact section` | heading | 768 | serif | 28.1472px | 700 | italic | 30.9619px | -0.281472px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `visit-contact section` | heading | 1440 | serif | 35.136px | 700 | italic | 38.6496px | -0.35136px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `visit-contact section` | desc | 320 | sans | 16.32px | 400 | normal | 27.744px | normal | `rgb(119, 104, 93)` | start | pretty | none | 5 | 5.35 |
| `visit-contact section` | desc | 768 | sans | 16.32px | 400 | normal | 27.744px | normal | `rgb(119, 104, 93)` | start | pretty | none | 2 | 5.35 |
| `visit-contact section` | desc | 1440 | sans | 18.72px | 400 | normal | 31.824px | normal | `rgb(119, 104, 93)` | start | pretty | none | 3 | 5.35 |
| `visit-cta section` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | center | wrap | none | 1 | 2.36 |
| `visit-cta section` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | center | wrap | none | 1 | 2.36 |
| `visit-cta section` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | center | wrap | none | 1 | 2.36 |
| `visit-cta section` | heading | 320 | serif | 24px | 700 | italic | 26.4px | -0.24px | `rgb(67, 39, 25)` | center | balance | none | 3 | 13.61 |
| `visit-cta section` | heading | 768 | serif | 38.144px | 700 | italic | 41.9584px | -0.38144px | `rgb(67, 39, 25)` | center | balance | none | 2 | 13.61 |
| `visit-cta section` | heading | 1440 | serif | 48.56px | 700 | italic | 53.416px | -0.4856px | `rgb(67, 39, 25)` | center | nowrap balance | none | 1 | 13.61 |
| `visit-cta section` | desc | 320 | sans | 16px | 400 | normal | 27.2px | normal | `rgb(119, 104, 93)` | center | pretty | 560px | 5 | 5.35 |
| `visit-cta section` | desc | 768 | sans | 17.0368px | 400 | normal | 28.9626px | normal | `rgb(119, 104, 93)` | center | pretty | 560px | 3 | 5.35 |
| `visit-cta section` | desc | 1440 | sans | 18.784px | 400 | normal | 31.9328px | normal | `rgb(119, 104, 93)` | center | pretty | 560px | 3 | 5.35 |

### privacy — `/privacy-policy`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `legal-wrap` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | heading | 320 | serif | 36.32px | 700 | italic | 39.952px | -0.3632px | `rgb(67, 39, 25)` | start | balance | none | 2 | 13.61 |
| `legal-wrap` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `legal-wrap` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `legal-wrap` | desc | 320 | sans | 17px | 400 | normal | 30.6px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 6 | 5.35 |
| `legal-wrap` | desc | 768 | sans | 19.776px | 400 | normal | 35.5968px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 4 | 5.35 |
| `legal-wrap` | desc | 1440 | sans | 24.48px | 400 | normal | 44.064px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 4 | 5.35 |

### terms — `/terms-and-conditions`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `legal-wrap` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | start | wrap | none | 1 | 2.36 |
| `legal-wrap` | heading | 320 | serif | 36.32px | 700 | italic | 39.952px | -0.3632px | `rgb(67, 39, 25)` | start | balance | none | 2 | 13.61 |
| `legal-wrap` | heading | 768 | serif | 45.728px | 700 | italic | 50.3008px | -0.45728px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `legal-wrap` | heading | 1440 | serif | 59.84px | 700 | italic | 65.824px | -0.5984px | `rgb(67, 39, 25)` | start | balance | none | 1 | 13.61 |
| `legal-wrap` | desc | 320 | sans | 17px | 400 | normal | 30.6px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 5 | 5.35 |
| `legal-wrap` | desc | 768 | sans | 19.776px | 400 | normal | 35.5968px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 3 | 5.35 |
| `legal-wrap` | desc | 1440 | sans | 24.48px | 400 | normal | 44.064px | normal | `rgb(119, 104, 93)` | start | pretty | 640px | 3 | 5.35 |

### notfound — `/this-route-does-not-exist`

| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `nf-inner` | eyebrow | 320 | sans | 10px | 500 | normal | 16px | 3.2px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `nf-inner` | eyebrow | 768 | sans | 12.5184px | 500 | normal | 20.0294px | 4.00589px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `nf-inner` | eyebrow | 1440 | sans | 13.392px | 500 | normal | 21.4272px | 4.28544px | `rgb(199, 164, 90)` | center | pretty | none | 1 | 2.25 |
| `nf-inner` | heading | 320 | serif | 25.6px | 700 | normal | 28.16px | -0.256px | `rgb(67, 39, 25)` | center | balance | none | 2 | 12.94 |
| `nf-inner` | heading | 768 | serif | 26.88px | 700 | normal | 29.568px | -0.2688px | `rgb(67, 39, 25)` | center | balance | none | 1 | 12.94 |
| `nf-inner` | heading | 1440 | serif | 36.8px | 700 | normal | 40.48px | -0.368px | `rgb(67, 39, 25)` | center | balance | none | 2 | 12.94 |
| `nf-inner` | desc | 320 | sans | 16px | 400 | normal | 28.8px | normal | `rgb(119, 104, 93)` | center | pretty | 520px | 4 | 5.09 |
| `nf-inner` | desc | 768 | sans | 17.0368px | 400 | normal | 30.6662px | normal | `rgb(119, 104, 93)` | center | pretty | 520px | 2 | 5.09 |
| `nf-inner` | desc | 1440 | sans | 18.784px | 400 | normal | 33.8112px | normal | `rgb(119, 104, 93)` | center | pretty | 520px | 3 | 5.09 |

## Appendix C. Type ramp signatures

Sites grouped by the exact sequence of sizes they produce across all 17
widths. Sites sharing a signature follow the identical ramp, so a
separate signature means a separate declaration, not merely a different
sample point.

### Eyebrow — 4 distinct ramps

- **11 sites** — menu/menu-hero, menu/menu-cafe, menu/menu-cta, gallery/gal-hero, gallery/gal-section, gallery/gal-section gal-section--bookend, visit/visit-hero, visit/visit-cta section, privacy/legal-wrap, terms/legal-wrap, notfound/nf-inner
  - ramp: 320:10  375:10  390:10  414:10  599:10  600:10  744:10  768:12.52  900:12.69  1023:12.85  1024:12.85  1099:12.95  1100:12.95  1280:13.18  1366:13.3  1440:13.39  1920:14
- **5 sites** — home/hero, home/experience, home/section story, home/cafe, home/gallery
  - ramp: 320:12  375:12  390:12  414:12  599:12  600:12  744:12  768:12.52  900:12.69  1023:12.85  1024:12.85  1099:12.95  1100:12.95  1280:13.18  1366:13.3  1440:13.39  1920:14
- **2 sites** — story/ostory-hero, story/ostory-cta
  - ramp: 320:10  375:10  390:10  414:10  599:10  600:13  744:13  768:13  900:13  1023:13  1024:13  1099:13  1100:13  1280:13  1366:13  1440:13  1920:13
- **1 site** — story/ostory-origin
  - ramp: 320:13  375:13  390:13  414:13  599:13  600:13  744:13  768:13  900:13  1023:13  1024:13  1099:13  1100:13  1280:13  1366:13  1440:13  1920:13

### Heading — 9 distinct ramps

- **10 sites** — home/experience, home/section story, home/cafe, home/gallery, menu/menu-special, menu/menu-cafe, menu/menu-cta, gallery/gal-section, gallery/gal-section gal-section--bookend, visit/visit-cta section
  - ramp: 320:24  375:24  390:24  414:24  599:24  600:24  744:24  768:38.14  900:40.19  1023:42.1  1024:42.11  1099:43.27  1100:43.29  1280:46.08  1366:47.41  1440:48.56  1920:56
- **4 sites** — menu/menu-hero, visit/visit-hero, privacy/legal-wrap, terms/legal-wrap
  - ramp: 320:36.32  375:37.48  390:37.79  414:38.29  599:42.18  600:42.2  744:45.22  768:45.73  900:48.5  1023:51.08  1024:51.1  1099:52.68  1100:52.7  1280:56.48  1366:58.29  1440:59.84  1920:69.92
- **2 sites** — story/ostory-origin, story/ostory-cta
  - ramp: 320:24  375:24  390:24  414:24  599:24  600:42  744:52  768:52  900:52  1023:52  1024:52  1099:52  1100:52  1280:52  1366:52  1440:52  1920:52
- **1 site** — home/hero
  - ramp: 320:24.32  375:28.5  390:29.64  414:31.46  599:37.6  600:37.6  744:37.6  768:45.73  900:48.5  1023:51.08  1024:51.1  1099:52.68  1100:52.7  1280:56.48  1366:58.29  1440:59.84  1920:69.92
- **1 site** — home/benefits
  - ramp: 320:24  375:24  390:24  414:24  599:24  600:24  744:24  768:28.15  900:29.52  1023:30.8  1024:30.81  1099:31.59  1100:28  1280:28  1366:28  1440:28  1920:28
- **1 site** — story/ostory-hero
  - ramp: 320:36.32  375:37.48  390:37.79  414:38.29  599:42.18  600:42  744:52  768:52  900:52  1023:52  1024:52  1099:52  1100:52.7  1280:56.48  1366:58.29  1440:59.84  1920:69.92
- **1 site** — gallery/gal-hero
  - ramp: 320:32  375:32  390:32  414:32  599:42.18  600:42.2  744:45.22  768:45.73  900:48.5  1023:51.08  1024:51.1  1099:52.68  1100:52.7  1280:56.48  1366:58.29  1440:59.84  1920:69.92
- **1 site** — visit/visit-contact section
  - ramp: 320:28  375:28  390:28  414:28  599:35.94  600:36  744:38.4  768:28.15  900:29.52  1023:30.8  1024:30.81  1099:31.59  1100:31.6  1280:33.47  1366:34.37  1440:35.14  1920:40
- **1 site** — notfound/nf-inner
  - ramp: 320:25.6  375:25.6  390:25.6  414:25.6  599:25.6  600:25.6  744:26.04  768:26.88  900:31.5  1023:35.81  1024:35.84  1099:36.8  1100:36.8  1280:36.8  1366:36.8  1440:36.8  1920:36.8

### Description — 8 distinct ramps

- **9 sites** — menu/menu-hero, menu/menu-special, menu/menu-cafe, menu/menu-cta, gallery/gal-section, gallery/gal-section gal-section--bookend, visit/visit-hero, visit/visit-cta section, notfound/nf-inner
  - ramp: 320:16  375:16.02  390:16.05  414:16.12  599:16.6  600:16.6  744:16.97  768:17.04  900:17.38  1023:17.7  1024:17.7  1099:17.9  1100:17.9  1280:18.37  1366:18.59  1440:18.78  1920:20
- **6 sites** — home/hero, home/experience, home/section story, home/benefits, home/cafe, home/gallery
  - ramp: 320:16  375:16  390:16  414:16  599:16  600:16  744:16  768:17.04  900:17.38  1023:17.7  1024:17.7  1099:17.9  1100:17.9  1280:18.37  1366:18.59  1440:18.78  1920:20
- **2 sites** — privacy/legal-wrap, terms/legal-wrap
  - ramp: 320:17  375:17.02  390:17.13  414:17.3  599:18.59  600:18.6  744:19.61  768:19.78  900:20.7  1023:21.56  1024:21.57  1099:22.09  1100:22.1  1280:23.36  1366:23.96  1440:24.48  1920:27.84
- **1 site** — story/ostory-hero
  - ramp: 320:16  375:16.02  390:16.05  414:16.12  599:16.6  600:20  744:20  768:20  900:20  1023:20  1024:20  1099:20  1100:20  1280:20  1366:20  1440:20  1920:20
- **1 site** — story/ostory-origin
  - ramp: 320:14  375:14  390:14  414:14  599:14  600:20  744:20  768:20  900:20  1023:20  1024:20  1099:20  1100:20  1280:20  1366:20  1440:20  1920:20
- **1 site** — story/ostory-cta
  - ramp: 320:15.2  375:15.2  390:15.2  414:15.2  599:15.2  600:20  744:20  768:20  900:20  1023:20  1024:20  1099:20  1100:20  1280:20  1366:20  1440:20  1920:20
- **1 site** — gallery/gal-hero
  - ramp: 320:15  375:15  390:15  414:15  599:16.6  600:16.6  744:16.97  768:17.04  900:17.38  1023:17.7  1024:17.7  1099:17.9  1100:17.9  1280:18.37  1366:18.59  1440:18.78  1920:20
- **1 site** — visit/visit-contact section
  - ramp: 320:16.32  375:16.32  390:16.32  414:16.32  599:16.32  600:16.32  744:16.32  768:16.32  900:16.32  1023:16.32  1024:16.32  1099:16.32  1100:16.32  1280:16.64  1366:17.76  1440:18.72  1920:19.2
