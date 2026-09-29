// Intrinsic pixel dimensions of the site images, so components can give <img>
// explicit width/height and the browser can reserve that space (no CLS) while
// CSS still controls the rendered size.
//
// Keys are the file names as authored on disk, which is what
// `shared/assets/images/index.js` binds each export to. Keep the two in sync:
// three entries are served from `public/` and so are referenced by their public
// path rather than an import.
const srcSizeMap = {
  // hero
  'salon-interior.svg': [1920, 1280],
  // menu
  'hero.svg': [248, 360],
  'menu_background.jpg': [4096, 2731],
  'aglio-olio.svg': [267, 320],
  'blush-sunset.svg': [267, 320],
  'espresso-martini.svg': [267, 320],
  'galaxy.svg': [267, 320],
  'hummus.svg': [267, 320],
  'lemon-mint.svg': [267, 320],
  'sundowner.svg': [267, 320],
  'virgin-mojito.svg': [268, 320],
  'tab1.png': [736, 736],
  'tab2.png': [2000, 2000],
  'tab3.png': [2000, 2000],
  // story
  'img1.png': [1935, 939],
  'img_phone.png': [390, 411],
  'Frame 48096464 (1).png': [744, 605],
  'photo.svg': [627, 624],
  'frame-48096320.svg': [1312, 735],
  'Rectangle 69.svg': [675, 605],
  'Rectangle 71.svg': [675, 605],
  'Rectangle 72.svg': [675, 605],
  'Rectangle 73.svg': [1312, 735],
  'Rectangle 74.svg': [1312, 735],
  'Rectangle 75.svg': [1312, 735],
  // gallery
  // 'menu/hero.svg' is byte-identical to 'gallery/g1.svg'; Vite dedupes them
  // into one bundled asset, so the menu hero resolves to 'g1.svg' in prod.
  'g1.svg': [248, 360],
  'g2.svg': [320, 460],
  'g3.svg': [388, 560],
  'g4.svg': [460, 660],
  'g5.svg': [388, 560],
  'g6.svg': [320, 460],
  'g7.svg': [248, 360],
}

/**
 * Every spelling of `name` Vite might hand us for one authored file.
 *
 * An imported asset is emitted as `name-HASH.ext`, where HASH is a Vite
 * internal whose length is not part of any contract — an earlier version
 * assumed exactly 8 characters, so a change there silently dropped the
 * dimensions for every image at once.
 *
 * The boundary is found by trying each hyphen from right to left rather than by
 * pattern-matching a fixed width, because authored names contain hyphens of
 * their own ("virgin-mojito", "salon-interior"): a single regex split on the
 * first hyphen yields "virgin.svg" and never reaches the real name. Rightmost
 * first puts the true `name-HASH` boundary ahead of the wrong ones, and walking
 * the rest still lands correctly if the hash itself contains a hyphen.
 */
function candidates(name) {
  const out = [name]

  const dot = name.lastIndexOf('.')
  if (dot <= 0) return out
  const stem = name.slice(0, dot)
  const ext = name.slice(dot)

  for (let i = stem.lastIndexOf('-'); i > 0; i = stem.lastIndexOf('-', i - 1)) {
    out.push(`${stem.slice(0, i)}${ext}`)
  }
  return out
}

export const srcSize = (src = '') => {
  let base = String(src).split('/').pop() || ''
  try {
    base = decodeURIComponent(base)
  } catch {
    // A malformed escape sequence is not a reason to drop the dimensions —
    // fall through and match on the raw name.
  }

  for (const name of candidates(base)) {
    const size = srcSizeMap[name]
    if (size) return { width: size[0], height: size[1] }
  }
  return {}
}
