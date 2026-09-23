// Intrinsic pixel dimensions of the remaining site images, keyed by file
// name. Returns { width, height } so components can give <img> explicit
// dimensions (no layout shift) while CSS controls the rendered size.
const srcSizeMap = {
  'salon-interior.svg': [1920, 1280],
  'img.webp': [1935, 939],
  'photo.svg': [627, 624],
  'Rectangle 71.svg': [675, 605],
  'Rectangle 69.svg': [675, 605],
  'Rectangle 72.svg': [675, 605],
  'Rectangle 73.svg': [1312, 735],
  'Rectangle 74.svg': [1312, 735],
  'Rectangle 75.svg': [1312, 735],
  'tab1.png': [736, 736],
  'tab2.png': [2000, 2000],
  'tab3.png': [2000, 2000],
  'hero.svg': [248, 360],
  // 'menu/hero.svg' is byte-identical to 'gallery/g1.svg'; Vite dedupes them
  // into one bundled asset, so the menu hero resolves to 'g1.svg' in prod.
  'g1.svg': [248, 360],
  'aglio-olio.svg': [267, 320],
  'blush-sunset.svg': [267, 320],
  'espresso-martini.svg': [267, 320],
  'galaxy.svg': [267, 320],
  'hummus.svg': [267, 320],
  'lemon-mint.svg': [267, 320],
  'sundowner.svg': [267, 320],
  'virgin-mojito.svg': [268, 320],
}

export const srcSize = (src = '') => {
  const base = decodeURIComponent(String(src).split('/').pop() || '')
  const normalized = base
    .replace(/-[A-Za-z0-9_-]{8}(\.[^.]+)$/, '$1')
    .replace(/_/g, ' ')
  const size = srcSizeMap[normalized]
  return size ? { width: size[0], height: size[1] } : {}
}