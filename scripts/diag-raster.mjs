import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import sharp from 'sharp'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const GOLD = [199, 164, 90]
const CX = 0.529151
const CY = 0.47225
const R = 0.472451

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 180000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--font-render-hinting=none',
    '--disable-partial-raster',
    '--disable-checker-imaging',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
  ],
})
const page = await browser.newPage()
const VW = Number(process.argv[2] || 744)
await page.setViewport({ width: VW, height: 1200, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}` })
await page.evaluate(async () => {
  await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
  await document.fonts.ready
  scrollTo(0, document.querySelector('.ostory-origin').getBoundingClientRect().top + scrollY - 16)
  document.getAnimations().forEach((a) => {
    try {
      a.finish()
    } catch {
      try {
        a.pause()
      } catch {
        /* static */
      }
    }
  })
})
await new Promise((r) => setTimeout(r, 2000))

const g = await page.evaluate(() => {
  const p = document.querySelector('.ostory-emblem-photo').getBoundingClientRect()
  return { l: p.left, t: p.top, w: p.width, h: p.height }
})
const clip = { x: Math.floor(g.l), y: Math.floor(g.t), width: Math.ceil(g.w), height: Math.ceil(g.h) }
console.log('=== viewport', VW, 'photo', JSON.stringify(g), 'clip', JSON.stringify(clip))

const grab = async (label, mutate) => {
  if (mutate) await page.evaluate(mutate)
  await new Promise((r) => setTimeout(r, 400))
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  )
  let prev = await page.screenshot({ encoding: 'base64' })
  let same = 0
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 250))
    const n = await page.screenshot({ encoding: 'base64' })
    if (n === prev) same++
    else {
      prev = n
      same = 0
    }
  }
  console.log(`  ${label}: ${same}/5 captures byte-identical (len ${prev.length})`)
  return prev
}

const countWhite = async (b64) => {
  const { data, info } = await sharp(Buffer.from(b64, 'base64'))
    .extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let white = 0
  for (let i = 0; i < data.length; i += 4)
    if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) white++
  return { white, info }
}

const asShipped = await grab('as shipped (clip on, live ring on)', null)
const ringOff = await grab('live ring display:none            ', () =>
  document.querySelector('.pb-story-ring').style.setProperty('display', 'none')
)
const clipOff = await grab('live ring off + clip-path:none     ', () => {
  document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
})
const magentaOn = await grab('+ img background #ff00ff, clip on', () => {
  document.querySelector('.ostory-emblem-photo img').style.clipPath = 'url("#pb-photo-arch")'
  document.querySelector('.ostory-emblem-photo img').style.background = '#ff00ff'
})
const magentaOff = await grab('+ img background #ff00ff, clip off', () => {
  document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
})

for (const [k, v] of Object.entries({ asShipped, ringOff, clipOff, magentaOn, magentaOff })) {
  const c = await countWhite(v)
  console.log(`  ${k.padEnd(38)} pure-white pixels in the photo box = ${c.white}`)
}

const scan = async (b64, tol) => {
  const { data, info } = await sharp(Buffer.from(b64, 'base64'))
    .extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let gold = 0
  let magenta = 0
  let changedInside = null
  const px = []
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4
      const Rr = data[i]
      const G = data[i + 1]
      const B = data[i + 2]
      if (Rr > 190 && G < 90 && B > 190) magenta++
      const fx = (x + 0.5) / info.width
      const fy = (y + 0.5) / info.height
      const dc = Math.hypot(fx - CX, fy - CY) - R
      const dsq =
        Math.max(Math.abs(fx - (CX + R / 2)), Math.abs(fy - (CY + R / 2))) - R / 2
      const sd = Math.min(dc, dsq) * info.width
      if (sd <= -1.5) px.push([x, y, Rr, G, B, 1])
      else if (sd >= 1.5) {
        px.push([x, y, Rr, G, B, 0])
        if (
          Math.abs(Rr - GOLD[0]) <= tol &&
          Math.abs(G - GOLD[1]) <= tol &&
          Math.abs(B - GOLD[2]) <= tol
        )
          gold++
      }
    }
  }
  return { gold, magenta, px, w: info.width, h: info.height }
}

const S = await scan(asShipped, 24)
const RG = await scan(ringOff, 24)
const O = await scan(clipOff, 24)
console.log(`\n  gold #C7A45A(+24) OUTSIDE the arch, inside the photo box:`)
console.log(`    as shipped (clip ON, live ring ON) = ${S.gold}`)
console.log(`    live ring hidden (clip ON)          = ${RG.gold}   <- what the clip failed to remove`)
console.log(`    clip OFF (live ring hidden)         = ${O.gold}   <- what the old baked ring adds`)
console.log(`  magenta visible: clip ON=${S.magenta}  clip OFF=${O.magenta}`)
console.log(`  magenta should be >0 with clip OFF if the img background paints`)

let changedInside = 0
let changedOutside = 0
for (const p of S.px) {
  const [x, y, r, g, b, inside] = p
  const i = (y * S.w + x) * 4
  const oi = (y * O.w + x) * 4
  const od = O.px[0] ? 0 : 0
  void od
  const or_ = O.px.find((q) => q[0] === x && q[1] === y)
  if (!or_) continue
  const d = Math.abs(r - or_[2]) + Math.abs(g - or_[3]) + Math.abs(b - or_[4])
  if (d > 12) {
    if (inside) changedInside++
    else changedOutside++
  }
}
const underlineBand = async (b64) => {
  const { data, info } = await sharp(Buffer.from(b64, 'base64'))
    .extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let gold = 0
  for (let y = 0; y < info.height; y++) {
    const fy = (y + 0.5) / info.height
    if (Math.abs(fy - 620.364 / 624) * info.height > 2.5) continue
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4
      if (
        Math.abs(data[i] - GOLD[0]) <= 24 &&
        Math.abs(data[i + 1] - GOLD[1]) <= 24 &&
        Math.abs(data[i + 2] - GOLD[2]) <= 24
      )
        gold++
    }
  }
  return gold
}
const underOn = await underlineBand(ringOff)
const underOff = await underlineBand(clipOff)
console.log(
  `\n  gold underline band (svg y=620.364): clip ON=${underOn}px  clip OFF=${underOff}px  -> the clip removes it too`
)

console.log(`\n  clip ON vs clip OFF: photo pixels changed INSIDE the arch = ${changedInside}`)
console.log(`                       pixels changed OUTSIDE the arch   = ${changedOutside}`)

// does the live ring ever paint over the photograph?
let ringOverPhoto = 0
let ringOverPhotoBox = 0
const idx = (arr, x, y) => arr[y * S.w + x]
const fast = (b64) =>
  sharp(Buffer.from(b64, 'base64'))
    .extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
const fA = await fast(asShipped)
const fR = await fast(ringOff)
for (let y = 0; y < fA.info.height; y++) {
  for (let x = 0; x < fA.info.width; x++) {
    const i = (y * fA.info.width + x) * 4
    const d =
      Math.abs(fA.data[i] - fR.data[i]) +
      Math.abs(fA.data[i + 1] - fR.data[i + 1]) +
      Math.abs(fA.data[i + 2] - fR.data[i + 2])
    if (d <= 12) continue
    const fx = (x + 0.5) / fA.info.width
    const fy = (y + 0.5) / fA.info.height
    const dc = Math.hypot(fx - CX, fy - CY) - R
    const dsq =
      Math.max(Math.abs(fx - (CX + R / 2)), Math.abs(fy - (CY + R / 2))) - R / 2
    const sd = Math.min(dc, dsq) * fA.info.width
    ringOverPhotoBox++
    if (sd <= -1.5) ringOverPhoto++
  }
}
console.log(
  `\n  live ring pixels inside the photo BOX = ${ringOverPhotoBox}, of which painted OVER the photograph = ${ringOverPhoto}`
)
void idx

await browser.close()