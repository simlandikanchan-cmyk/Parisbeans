import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

for (const w of [320, 375, 600, 744]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 1400, deviceScaleFactor: 1, isMobile: w < 1024 })
  await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 900))
  await page.evaluate(() => {
    scrollTo(0, document.querySelector('.ostory-origin').getBoundingClientRect().top + scrollY - 20)
  })
  // The page still has transitions and infinite footer animations running, and
  // two 1800ms ones sit on IMG elements — mid-transition pixels are not a diff
  // of the clip, they are a diff of the clock. Finish what is finite, pause what
  // is not, then check with the control pair below.
  await new Promise((r) => setTimeout(r, 1200))
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => {
      try {
        a.finish()
      } catch {
        try {
          a.pause()
        } catch {
          /* an animation that can do neither is already static */
        }
      }
    })
  })
  await new Promise((r) => setTimeout(r, 400))

  const geom = await page.evaluate(() => {
    const n = (x) => Math.round(x * 10) / 10
    const sec = document.querySelector('.ostory-origin')
    const photo = sec.querySelector('.ostory-emblem-photo').getBoundingClientRect()
    const tp = sec.querySelector('textPath')
    const r = document.createRange()
    r.selectNodeContents(tp)
    const rects = [...r.getClientRects()].filter((x) => x.width > 0.5)
    const arc = document.querySelector('#pb-story-ring-arc')
    const total = arc.getTotalLength()
    const p0 = arc.getPointAtLength(0)
    const p1 = arc.getPointAtLength(total)
    return {
      photo: { l: photo.left, t: photo.top, w: photo.width, h: photo.height },
      svgBox: sec.querySelector('.pb-story-ring__svg').getBoundingClientRect().left,
      ink: rects.length
        ? {
            l: n(Math.min(...rects.map((x) => x.left))),
            t: n(Math.min(...rects.map((x) => x.top))),
            b: n(Math.max(...rects.map((x) => x.bottom))),
            r: n(Math.max(...rects.map((x) => x.right))),
          }
        : null,
      arcStart: { x: n(p0.x), y: n(p0.y) },
      arcEnd: { x: n(p1.x), y: n(p1.y) },
      arcLen: n(total),
    }
  })

  // clip must start at x=0: a negative x is clamped by Chrome and shifts the
  // whole bitmap, taking every coordinate with it
  const clipY = Math.max(0, geom.photo.t - 160)
  const clip = { x: 0, y: clipY, width: w, height: Math.min(1400 - clipY, geom.photo.h + 320) }

  const shot = async (mutate) => {
    if (mutate) await page.evaluate(mutate)
    await new Promise((r) => setTimeout(r, 250))
    return page.screenshot({ clip, encoding: 'base64' })
  }

  const hideRing = () => document.querySelector('.pb-story-ring').style.setProperty('display', 'none')
  const B = await shot(hideRing) // clipped, new ring hidden
  const B2 = await shot(null) // control: same state
  const C = await shot(() => {
    document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
  })

  const res = await page.evaluate(
    async (b, b2, c, photo, clipBox) => {
      const load = async (b64) => {
        const img = new Image()
        img.src = 'data:image/png;base64,' + b64
        await img.decode()
        return img
      }
      const [ib, ib2, ic] = await Promise.all([load(b), load(b2), load(c)])
      const cv = document.createElement('canvas')
      cv.width = ib.width
      cv.height = ib.height
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      const data = (img) => {
        ctx.clearRect(0, 0, cv.width, cv.height)
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, cv.width, cv.height).data
      }
      const dB = data(ib)
      const dB2 = data(ib2)
      const dC = data(ic)

      // The silhouette, straight off ARCH_CLIP in objectBoundingBox units:
      // a circle of centre (0.529151, 0.47225) r 0.472451, unioned with the
      // bottom-right square quadrant.
      const CX = 0.529151
      const CY = 0.47225
      const R = 0.472451
      const SQ_X1 = 1.001607
      const SQ_Y1 = 0.944704
      const insideSilhouette = (vx, vy) => {
        const fx = (vx - photo.l) / photo.w
        const fy = (vy - photo.t) / photo.h
        if (fx < 0 || fy < 0 || fx > 1 || fy > 1) return false
        const dx = fx - CX
        const dy = fy - CY
        if (dx * dx + dy * dy <= R * R) return true
        return fx >= CX && fy >= CY && fx <= SQ_X1 && fy <= SQ_Y1
      }

      const diff = (a, b) =>
        Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

      let drift = 0
      let insideChanged = 0
      let insideChangedInBox = 0
      let outsideChanged = 0
      const worstInside = { d: 0, x: 0, y: 0 }
      for (let y = 0; y < cv.height; y++) {
        for (let x = 0; x < cv.width; x++) {
          const i = (y * cv.width + x) * 4
          const vx = x + clipBox.x
          const vy = y + clipBox.y
          const pa = [dB[i], dB[i + 1], dB[i + 2]]
          const pb = [dB2[i], dB2[i + 1], dB2[i + 2]]
          const pc = [dC[i], dC[i + 1], dC[i + 2]]
          if (diff(pa, pb) > 12) drift++
          const inside = insideSilhouette(vx, vy)
          if (inside && diff(pa, pc) > 12) {
            insideChanged++
            // only count it against the clip if the same pixel was stable in
            // the control pair
            if (diff(pa, pb) <= 12) {
              insideChangedInBox++
              const d = diff(pa, pc)
              if (d > worstInside.d) Object.assign(worstInside, { d, x: vx, y: vy })
            }
          } else if (!inside && diff(pa, pc) > 12) outsideChanged++
        }
      }
      return { drift, insideChanged, insideChangedInBox, outsideChanged, worstInside }
    },
    B,
    B2,
    C,
    geom.photo,
    clip
  )

  const inkLeft = geom.ink ? Math.round(geom.ink.l) : 'n/a'
  console.log(
    `${w}px photoW=${Math.round(geom.photo.w)} | ringInk leftmost=${inkLeft}px from screen edge, ` +
      `top=${geom.ink?.t} bottom=${geom.ink?.b} right=${geom.ink?.r} | arcLen=${geom.arcLen}`
  )
  console.log(
    `      drift=${res.drift}px | photo pixels changed inside silhouette=${res.insideChangedInBox} | ` +
      `pixels removed outside silhouette=${res.outsideChanged} | (insideChanged incl. drifting px: ${res.insideChanged})`
  )
  if (res.insideChangedInBox) console.log(`      worst inside diff: ${JSON.stringify(res.worstInside)}`)
  await page.close()
}
await browser.close()