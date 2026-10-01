import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })

const out = await page.evaluate(async () => {
  const mod = await import('/src/shared/assets/images/index.js')
  const src = mod.storyImages.photo
  const res = await fetch(src)
  const text = await res.text()

  // Rasterise the asset at a square 900x900 "box" so radii are in box units.
  const S = 900
  const blob = new Blob([text], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const im = new Image()
  im.src = url
  await im.decode()
  const cv = document.createElement('canvas')
  cv.width = S
  cv.height = S
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(im, 0, 0, S, S)
  const d = ctx.getImageData(0, 0, S, S).data

  // ARCH_CLIP in objectBoundingBox units
  const CX = 0.529151
  const CY = 0.47225
  const R = 0.472451
  const inside = (fx, fy) => {
    if (fx < 0 || fy < 0 || fx > 1 || fy > 1) return false
    const dx = fx - CX
    const dy = fy - CY
    if (dx * dx + dy * dy <= R * R) return true
    return fx >= CX && fy >= CY && fx <= 1.001607 && fy <= 0.944704
  }
  const isGold = (p, tol = 40) =>
    Math.abs(p[0] - 0xc7) <= tol && Math.abs(p[1] - 0xa4) <= tol && Math.abs(p[2] - 0x5a) <= tol

  let goldTotal = 0
  let goldOutside = 0
  let goldOutsideInBox = 0 // outside silhouette AND still inside the 900x900 box
  let rMin = Infinity
  let rMax = 0
  const degOf = (fx, fy) => (Math.atan2(CX - fx, CY - fy) * 180) / Math.PI
  let aMin = Infinity
  let aMax = -Infinity
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      if (!isGold([d[i], d[i + 1], d[i + 2]])) continue
      goldTotal++
      const fx = (x + 0.5) / S
      const fy = (y + 0.5) / S
      const rr = Math.hypot(fx - CX, fy - CY) / (1 / 2) / 2 // in units of photo radius
      if (rr < rMin) rMin = rr
      if (rr > rMax) rMax = rr
      if (!inside(fx, fy)) {
        goldOutside++
        if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
          goldOutsideInBox++
          const a = (degOf(fx, fy) + 360) % 360
          if (a < aMin) aMin = a
          if (a > aMax) aMax = a
        }
      }
    }
  }
  URL.revokeObjectURL(url)
  return {
    src,
    rasterBox: S,
    viewBox: '0 0 627 624',
    goldTotal,
    goldOutsideSilhouette: goldOutside,
    goldOutsideSilhouetteInsideBox: goldOutsideInBox,
    photoRadiusUnits: R * S,
    ringRadiusInPhotoRadii: [Math.round((rMin * 1000) / 10) / 1000, Math.round((rMax * 1000) / 10) / 1000],
    boxHalfInPhotoRadii: Math.round((0.5 / R) * 1000) / 1000,
    angularExtentOfBoxVisibleRing: [Math.round(aMin * 10) / 10, Math.round(aMax * 10) / 10],
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
