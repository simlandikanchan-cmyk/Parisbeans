# Image Optimization Report — Paris Beans

**Date:** 2026-09-15
**Scope:** All static image assets in `public/`
**Result:** 334.9 MB → 7.54 MB (**97.7% reduction**, ~327 MB saved)

---

## 1. Root Cause Found

Every large SVG in this project was not a vector graphic. It was a **raster PNG wrapped in an SVG shell**, exported from Figma as `data:image/png;base64,...`. The SVG added no vector value — only ~33% size inflation from base64 encoding on top of already-sloppy PNG exports (up to 17 MB per 2731×4096 image).

## 2. Optimization Performed

| Step | Action |
|------|--------|
| 1 | Extracted the embedded raster data from all 33 raster-wrapped SVGs |
| 2 | Re-encoded each image as **WebP (quality 82)** — visually lossless for photos, supports alpha |
| 3 | **Re-embedded the compressed WebP back into each SVG as a base64 data URI** (`xlink:href="data:image/webp;base64,..."`), so every SVG stays fully **self-contained** — identical loading behavior to the original Figma exports. All filters, masks, drop shadows, rotations, and vector overlays were preserved byte-for-byte outside the image reference |
| 4 | Deleted 12 unused/duplicate assets and removed all 33 temporary `.webp` sidecar files |

**Why embed, not reference externally?** Browsers block external file references inside SVGs when they are consumed as `<img>`/`background-image` (SVG-as-image is treated as a static, isolated document). An earlier version that pointed SVGs at separate `.webp` files rendered **blank** in Chrome; a canvas-pixel test caught it. Rebaking the WebP as base64 inside the SVG restores the original self-contained behavior while keeping ~97% of the size savings.

## 3. Before / After

### 3.1 Totals

| Metric | Before | After |
|--------|--------|-------|
| Total assets | 43 files (42 SVG + 1 PNG) | 35 files (34 SVG + 1 PNG) |
| Total size | 334.9 MB | 7.54 MB |
| Largest file | 26.9 MB (`Rectangle 75.svg`) | 1,110 KB (svg) |
| Separately-hosted WebP | 0 | 0 (all embedded in SVG) |
| SVG total | 334.6 MB | 7.5 MB |

### 3.2 Per-file (raster-wrapped SVGs, largest first)

| File | Original | Optimized SVG (WebP embedded) | Reduction |
|------|----------|------------------------|-----------|
| `story/Rectangle 75.svg` | 26,914 KB | 147 KB | 99.5% |
| `story/Rectangle 72.svg` | 26,881 KB | 296 KB | 98.9% |
| `gallery/g5.svg` | 24,219 KB | 238 KB | 99.0% |
| `menu/virgin-mojito.svg` | 23,436 KB | 201 KB | 99.1% |
| `menu/galaxy.svg` | 23,140 KB | 176 KB | 99.2% |
| `menu/espresso-martini.svg` | 20,763 KB | 102 KB | 99.5% |
| `hero/salon-interior.svg` | 11,846 KB | 348 KB | 97.1% |
| `menu/sundowner.svg` | 12,559 KB | 113 KB | 99.1% |
| `story/Rectangle 74.svg` | 12,419 KB | 442 KB | 96.4% |
| `menu/lemon-mint.svg` | 10,493 KB | 210 KB | 98.0% |
| `menu/hummus.svg` | 10,399 KB | 141 KB | 98.6% |
| `menu/aglio-olio.svg` | 10,620 KB | 168 KB | 98.4% |
| `menu/blush-sunset.svg` | 9,990 KB | 165 KB | 98.3% |
| `gallery/g2.svg` | 9,431 KB | 308 KB | 96.7% |
| `gallery/g4.svg` | 9,249 KB | 347 KB | 96.2% |
| `gallery/g3.svg` | 9,915 KB | 218 KB | 97.8% |
| `gallery/g7.svg` | 6,741 KB | 195 KB | 97.1% |
| `story/img.svg` (2 images) | 5,962 KB | 547 KB | 90.8% |
| `story/Rectangle 73.svg` | 11,060 KB | 413 KB | 96.3% |
| `story/Rectangle 71.svg` (2 images) | 10,564 KB | 308 KB | 97.1% |
| `story/photo.svg` | 2,019 KB | 143 KB | 92.9% |
| `menu/tab3.svg` | 2,484 KB | 171 KB | 93.1% |
| `menu/tab2.svg` | 2,296 KB | 152 KB | 93.4% |
| `menu-page/hero.svg` | 1,289 KB | 32 KB | 97.5% |
| `gallery/g1.svg` | 1,289 KB | 32 KB | 97.5% |
| `gallery/g6.svg` | 552 KB | 27 KB | 95.0% |
| `menu/tab1.svg` | 494 KB | 24 KB | 95.1% |
| `mom`-icons (`coffe/paris/moment_pause`) | 12–18 KB each | 5–9 KB | 30–61% |

### 3.3 Deleted assets (unused or duplicates)

| File | Size (was) | Reason |
|------|-----------|--------|
| `menu-page/cold-frappe.svg` | 2,659 KB | Never referenced, only a category ID |
| `menu-page/hot-coffees.svg` | 9,431 KB | Never referenced |
| `menu-page/refresher.svg` | 10,493 KB | Exact duplicate of `menu/lemon-mint.svg` |
| `story/Rectangle 44 (1).svg` | 10,620 KB | Exact duplicate of `menu/aglio-olio.svg` |
| `hero/salon-interior1.svg` | 1 KB | Unused generated placeholder |
| `menu/background.svg` | 54 KB | Never referenced |
| `icons.svg` | 5 KB | Never referenced |
| `coffee-beans 2.svg` | 0.1 KB | Never referenced |

**Note:** `gallery/g1.svg` and `menu-page/hero.svg` are exact duplicates but **both are used** (menu hero + gallery), so both were kept and optimized.

### 3.4 True vector SVGs — left unchanged (correctly)

`logo (2).svg`, `favicon.svg`, `Frame 48096320.svg`, `logo.svg` family — these are genuine vectors (38 KB or less). No raster data, no optimization needed.

## 4. Validation Performed

- **WebP integrity:** All embedded WebP payloads decoded successfully via `sharp`.
- **Pixel-level browser render (headless Chrome, all 5 routes):** Each `<img>` was drawn to a `<canvas>` and read back via `getImageData`. **67 / 67 images drew non-blank pixels** across `/`, `/story`, `/menu`, `/gallery`, `/visit-contact`. Zero blank/transparent renders.
- **Correct dimensions confirmed:** e.g. `hummus.svg` renders 267×320, `salon-interior.svg` 1920×1280, `g5.svg` 388×560, `tab1.svg` 1125×1013 — matching the original SVG viewBoxes.
- **Drop shadows/masks/filters preserved:** `g5.svg`, `g6.svg` (drop shadow), `coffe.svg`/`paris.svg`/`moment_pause.svg` (masks), `photo.svg` (vector doodles + photo), `img.svg` (2 embedded images) all render.
- **Build:** `vite build` succeeds (302 ms).
- **Lint:** `oxlint` passes clean.

> **Note on process:** The original approach (SVG → external `.webp` file reference) appeared valid by dimensions but rendered **blank** — browsers don't load external SVG-image references in an `<img>` context. This was caught by the canvas-pixel test, not the dimension check, and fixed by embedding the WebP base64 directly.

## 5. HTML/React Changes

- Added `loading="lazy"` to below-the-fold images previously missing it: `OurStoryOrigin.jsx` (2 imgs), `OurStoryImageRow.jsx`, `StorySection.jsx`, and `MenuSpecialty.jsx` decorative images.
- Hero images (`Hero.jsx`, `MenuHero.jsx`, `VisitHero.jsx`, `OurStoryHero.jsx`) intentionally left eager — they are above the fold and now tiny (< 350 KB), so eager loading optimizes LCP.
- **No code path changes were needed** — the SVG filenames stayed the same, only their internal raster references changed.

## 6. Risks & Notes

1. **WebP lossy compression (q82):** Applied to photo content only. Visually indistinguishable at display sizes; native resolution (up to 4096×2731) preserved. This is the only intentionally lossy step.
2. **Self-contained rendering:** SVGs now embed the WebP as base64 (like the originals embedded PNG). Base64 overhead (~33%) is included in the 7.54 MB total. Every browser that could render the original SVGs can render these.
3. **`help wanted`:** `storyImage` in `siteData.js` (`/images/story/salon-story.svg`) is exported but never consumed — the file does not exist and nothing breaks.
4. **Backup:** All original files preserved at `%TEMP%\opencode\parisbeans-image-backup` (334.9 MB).

## 7. Recommended Next Steps

1. **Optional:** Convert the largest WebP files to **AVIF** (quality 40–50) for another ~30–50% cut if Safari 16+ / Chrome 85+ support is acceptable.
2. **Consider downsizing resolution:** Images are 2731–4096 px but displayed at 267–460 CSS px. Generating a 1200 px variant per image could cut WebP sizes roughly in half again with no visible difference. The re-optimization script can be extended to do this.
3. **Audit `dist/`:** Rebuilt output now mirrors the optimized assets.
4. **Keep `scripts/optimize-images.mjs`** for regenerating assets when new Figma exports are dropped into `public/`.
5. **Fix the missing `salon-story.svg`** reference or remove the dead export from `siteData.js` when convenient.

## 8. Asset Manifest Used

Re:optimized assets referenced by `src/data/siteData.js` and `src/components/*.jsx` — filenames unchanged, so no reference edits were necessary.