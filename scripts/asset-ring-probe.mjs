import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ASSET = 'http://localhost:5173/src/shared/assets/images/story/photo.svg'
const GOLD = [199, 164, 90]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 })

const out = await page.evaluate(
  async (ASSET, GOLD) => {
    const raw = await (await fetch(ASSET)).text()
    const holder = new DOMParser().parseFromString(raw, 'image/svg+xml')
    const shapes = [...holder.querySelectorAll('path,line,circle,ellipse,rect,polygon')].map((el) => {
      const b = el.getBBox()
      const cs = {
        fill: el.getAttribute('fill'),
        stroke: el.getAttribute('stroke'),
        sw: el.getAttribute('stroke-width'),
      }
      return {
        tag: el.tagName,
        dHead: (el.getAttribute('d') || '').slice(0, 60),
        x: +b.x.toFixed(3),
        y: +b.y.toFixed(3),
        w: +b.width.toFixed(3),
        h: +b.height.toFixed(3),
        x2: +(b.x + b.width).toFixed(3),
        y2: +(b.y + b.height).toFixed(3),
        fill: cs.fill,
        stroke: cs.stroke,
        strokeWidth: cs.sw,
      }
    })

    // rasterise with the exact object-fit:cover mapping the page uses
    const img = new Image()
    await new Promise((ok, no) => {
      img.onload = ok
      img.onerror = () => no(new Error('load failed'))
      img.src = ASSET
    })
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    const CX = 0.529151
    const CY = 0.47225
    const R = 0.472451
    const sizes = [287, 444, 588, 867]
    const res = []

    for (const S of sizes) {
      const c = document.createElement('canvas')
      c.width = S
      c.height = S
      const ctx = c.getContext('2d', { willReadFrequently: true })
      const scale = Math.max(S / iw, S / ih)
      ctx.drawImage(img, (S - iw * scale) / 2, (S - ih * scale) / 2, iw * scale, ih * scale)
      const d = ctx.getImageData(0, 0, S, S).data

      // signed distance to the arch (circle union the bottom-right square)
      const sqCx = CX + R / 2
      const sqCy = CY + R / 2
      const sdAt = (fx, fy) => {
        const dc = Math.hypot(fx - CX, fy - CY) - R
        const dsq =
          Math.max(Math.abs(fx - sqCx), Math.abs(fy - sqCy)) - R / 2
        return Math.min(dc, dsq)
      }

      const stats = {
        S,
        inside: 0,
        fringe: 0,
        outsideOpaque: 0,
        outsideGold: 0,
        outsideOther: 0,
        underGold: 0,
        outsideRatios: [],
        otherColours: {},
      }
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4
          const A = d[i + 3]
          const sd = sdAt((x + 0.5) / S, (y + 0.5) / S) * S
          if (Math.abs(sd) <= 1.5) {
            stats.fringe++
            continue
          }
          if (sd < 0) {
            stats.inside++
            continue
          }
          if (A === 0) continue
          stats.outsideOpaque++
          const isGold =
            Math.abs(d[i] - GOLD[0]) <= 24 &&
            Math.abs(d[i + 1] - GOLD[1]) <= 24 &&
            Math.abs(d[i + 2] - GOLD[2]) <= 24
          const fy = (y + 0.5) / S
          const onUnderline = Math.abs(fy - 620.364 / 624) * S <= 3
          if (isGold) {
            stats.outsideGold++
            if (onUnderline) stats.underGold++
            else stats.outsideRatios.push(Math.hypot((x + 0.5) / S - CX, fy - CY) / R)
          } else {
            stats.outsideOther++
            const k = `${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`
            stats.otherColours[k] = (stats.otherColours[k] || 0) + 1
          }
        }
      }
      stats.outsideRatios.sort((a, b) => a - b)
      const q = (p) =>
        stats.outsideRatios.length
          ? +stats.outsideRatios[Math.min(stats.outsideRatios.length - 1, Math.floor(stats.outsideRatios.length * p))].toFixed(4)
          : null
      stats.band = [q(0), q(0.5), q(1)]
      delete stats.outsideRatios
      res.push(stats)
    }
    return { shapes, res }
  },
  ASSET,
  GOLD
)

console.log('=== photo.svg painted elements (ground truth) ===')
for (const s of out.shapes) {
  console.log(
    `  ${s.tag.padEnd(6)} bbox x ${s.x}..${s.x2}  y ${s.y}..${s.y2}  fill=${s.fill} stroke=${s.stroke} sw=${s.strokeWidth}  d=${s.dHead}`
  )
}
console.log('\n=== pixel classification by signed distance to the arch (SDF from ARCH_CLIP) ===')
for (const r of out.res) {
  console.log(`\n  box ${r.S}px (photo radius ${(0.472451 * r.S).toFixed(1)}px)`)
  console.log(`    inside the arch          : ${r.inside}`)
  console.log(`    +-1.5px fringe (antialias): ${r.fringe}`)
  console.log(`    outside, opaque          : ${r.outsideOpaque}`)
  console.log(`      gold #C7A45A (+-24)    : ${r.outsideGold}  (of which the retained underline: ${r.underGold})`)
  console.log(`      not gold               : ${r.outsideOther}  colours=${JSON.stringify(r.otherColours)}`)
  console.log(`    ring band, x photo radius: min ${r.band[0]}  median ${r.band[1]}  max ${r.band[2]}`)
}

await browser.close()