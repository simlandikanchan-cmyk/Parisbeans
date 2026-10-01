import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 240000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

const W = Number(process.argv[2] || 375)
const page = await browser.newPage()
await page.setViewport({ width: W, height: 1200, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
await page.addStyleTag({
  content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
})
await page.evaluate(async () => {
  await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
  const sec = document.querySelector('.ostory-origin')
  scrollTo(0, sec.getBoundingClientRect().top + scrollY - 16)
  document.getAnimations().forEach((a) => {
    try {
      a.finish()
    } catch {
      try {
        a.pause()
      } catch {}
    }
  })
})
await new Promise((r) => setTimeout(r, 1200))

const box = await page.evaluate(() => {
  const p = document.querySelector('.ostory-emblem-photo').getBoundingClientRect()
  return { l: p.left, t: p.top, w: p.width, h: p.height }
})
const clipY = Math.max(0, box.t - 180)
const clip = { x: 0, y: clipY, width: W, height: Math.min(1200 - clipY, box.h + 360) }
console.log('photo', box, 'clip', clip)

const shot = async (m) => {
  if (m) await page.evaluate(m)
  await new Promise((r) => setTimeout(r, 300))
  return page.screenshot({ clip, encoding: 'base64' })
}

const A = await shot(null)
const variants = {
  textHidden: `document.querySelector('.pb-story-ring__text').style.visibility='hidden'`,
  svgHidden: `document.querySelector('.pb-story-ring__svg').style.visibility='hidden'`,
  ringHidden: `document.querySelector('.pb-story-ring').style.setProperty('display','none')`,
  control: null,
}
const shots = {}
for (const [k, m] of Object.entries(variants)) shots[k] = await shot(m)

const res = await page.evaluate(
  async (ref, others, clipBox) => {
    const load = async (s) => {
      const im = new Image()
      im.src = 'data:image/png;base64,' + s
      await im.decode()
      return im
    }
    const imgs = { ref: await load(ref) }
    for (const k of Object.keys(others)) imgs[k] = await load(others[k])
    const cv = document.createElement('canvas')
    cv.width = imgs.ref.width
    cv.height = imgs.ref.height
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    const buf = {}
    for (const k of Object.keys(imgs)) {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(imgs[k], 0, 0)
      buf[k] = ctx.getImageData(0, 0, cv.width, cv.height).data
    }
    const out = {}
    for (const k of Object.keys(others)) {
      let n = 0
      let l = Infinity
      let r = -Infinity
      let t = Infinity
      let b = -Infinity
      for (let y = 0; y < cv.height; y++) {
        for (let x = 0; x < cv.width; x++) {
          const i = (y * cv.width + x) * 4
          const d =
            Math.abs(buf.ref[i] - buf[k][i]) +
            Math.abs(buf.ref[i + 1] - buf[k][i + 1]) +
            Math.abs(buf.ref[i + 2] - buf[k][i + 2])
          if (d > 12) {
            n++
            if (x < l) l = x
            if (x > r) r = x
            if (y < t) t = y
            if (y > b) b = y
          }
        }
      }
      out[k] = {
        changed: n,
        bbox: n ? { l: l + clipBox.x, r: r + clipBox.x, t: t + clipBox.y, b: b + clipBox.y } : null,
      }
    }
    return out
  },
  A,
  shots,
  clip
)
console.log(JSON.stringify(res, null, 2))
for (const [k, v] of Object.entries(shots)) writeFileSync(`${OUT}\\diag-${W}-${k}.png`, Buffer.from(v, 'base64'))
await browser.close()
