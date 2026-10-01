import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import sharp from 'sharp'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const GOLD = [0xc7, 0xa4, 0x5a]
const CX = 0.529151
const CY = 0.47225
const RR = 0.472451 * 0.472451

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

const raw = async (b64) => {
  const { data, info } = await sharp(Buffer.from(b64, 'base64'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { d: data, w: info.width, h: info.height }
}

for (const W of [375, 600, 744]) {
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: 1200, deviceScaleFactor: 1 })
  await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  })
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
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
    // the live ring is out of the photo's box, so it cannot pollute these counts
    document.querySelector('.pb-story-ring').style.setProperty('display', 'none')
  })
  await new Promise((r) => setTimeout(r, 1400))

  const g = await page.evaluate(() => {
    const el = document.querySelector('.ostory-emblem-photo')
    const p = el.getBoundingClientRect()
    return {
      l: p.left,
      t: p.top,
      w: p.width,
      h: p.height,
      computedClip: getComputedStyle(el.querySelector('img')).clipPath,
    }
  })
  const clip = {
    x: Math.floor(g.l),
    y: Math.floor(g.t),
    width: Math.ceil(g.w),
    height: Math.ceil(g.h),
  }

  const grab = async (mutate) => {
    if (mutate) await page.evaluate(mutate)
    await new Promise((r) => setTimeout(r, 320))
    let prev = await page.screenshot({ clip, encoding: 'base64' })
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 220))
      const n = await page.screenshot({ clip, encoding: 'base64' })
      if (n === prev) return n
      prev = n
    }
    return prev
  }

  const shipped = await grab(null) // clipped, ring hidden
  const noClip = await grab(() => {
    document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
  })
  const magentaOn = await grab(() => {
    document.querySelector('.ostory-emblem-photo img').style.background = '#ff00ff'
  })
  const magentaOff = await grab(() => {
    document.querySelector('.ostory-emblem-photo img').style.clipPath = 'url("#pb-photo-arch")'
  })

  const S = await raw(shipped)
  const N = await raw(noClip)
  const M1 = await raw(magentaOn)
  const M2 = await raw(magentaOff)
  console.log(`\n=== ${W}px ===  photo ${g.w}x${g.h} at (${g.l}, ${g.t})  clip=${g.computedClip}`)
  console.log(`  frame sizes: shipped ${S.w}x${S.h}  noClip ${N.w}x${N.h}  magenta+clip ${M1.w}x${M1.h}  magenta+clipOff ${M2.w}x${M2.h}`)

  const at = (r, x, y) => {
    const i = (y * r.w + x) * 4
    return [r.d[i], r.d[i + 1], r.d[i + 2]]
  }
  const probes = [
    ['top-left  (3,3)', 3, 3],
    ['top-mid   (,4)', Math.floor(S.w / 2), 3],
    ['left-mid  (3,)', 3, Math.floor(S.h / 2)],
    ['bottom-l  (3,h-4)', 3, S.h - 4],
    ['bot-mid   (,h-4)', Math.floor(S.w / 2), S.h - 4],
    ['right-mid (w-4,)', S.w - 4, Math.floor(S.h / 2)],
  ]
  for (const [name, x, y] of probes) {
    console.log(
      `  ${name}: clipON=${JSON.stringify(at(M2, x, y))}  clipOFF=${JSON.stringify(at(M1, x, y))}`
    )
  }

  const scan = (r) => {
    let gold = 0
    let gl = Infinity
    let gr = -Infinity
    let gt = Infinity
    let gb = -Infinity
    let magenta = 0
    for (let y = 0; y < r.h; y++) {
      for (let x = 0; x < r.w; x++) {
        const i = (y * r.w + x) * 4
        const R = r.d[i]
        const G = r.d[i + 1]
        const B = r.d[i + 2]
        if (R > 190 && G < 90 && B > 190) magenta++
        const fx = (x + clip.x - g.l) / g.w
        const fy = (y + clip.y - g.t) / g.h
        const dx = fx - CX
        const dy = fy - CY
        const ins =
          fx >= 0 && fy >= 0 && fx <= 1 && fy <= 1
            ? dx * dx + dy * dy <= RR || (fx >= CX && fy >= CY && fx <= 1.001607 && fy <= 0.944704)
            : false
        if (
          !ins &&
          Math.abs(R - GOLD[0]) <= 24 &&
          Math.abs(G - GOLD[1]) <= 24 &&
          Math.abs(B - GOLD[2]) <= 24
        ) {
          gold++
          const vx = x + clip.x
          const vy = y + clip.y
          if (vx < gl) gl = vx
          if (vx > gr) gr = vx
          if (vy < gt) gt = vy
          if (vy > gb) gb = vy
        }
      }
    }
    return {
      gold,
      magenta,
      box: gold ? { l: gl, r: gr, t: gt, b: gb } : null,
    }
  }

  const sShipped = scan(S)
  const sNoClip = scan(N)
  console.log(
    `  gold outside silhouette, inside photo box: as shipped=${sShipped.gold} ${JSON.stringify(sShipped.box)}  |  clip disabled=${sNoClip.gold} ${JSON.stringify(sNoClip.box)}`
  )
  console.log(
    `  magenta visible (clip OFF)=${sNoClip.magenta}  (clip ON)=${scan(M2).magenta}  -> a difference means the clip is live`
  )

  // photo pixels changed inside the silhouette
  let changedInside = 0
  for (let y = 0; y < S.h; y++) {
    for (let x = 0; x < S.w; x++) {
      const i = (y * S.w + x) * 4
      const fx = (x + clip.x - g.l) / g.w
      const fy = (y + clip.y - g.t) / g.h
      const dx = fx - CX
      const dy = fy - CY
      const ins =
        dx * dx + dy * dy <= RR || (fx >= CX && fy >= CY && fx <= 1.001607 && fy <= 0.944704)
      if (!ins) continue
      const d =
        Math.abs(S.d[i] - N.d[i]) +
        Math.abs(S.d[i + 1] - N.d[i + 1]) +
        Math.abs(S.d[i + 2] - N.d[i + 2])
      if (d > 12) changedInside++
    }
  }
  console.log(`  photo pixels changed inside the silhouette (clip on vs off) = ${changedInside}`)
  await page.close()
}
await browser.close()
