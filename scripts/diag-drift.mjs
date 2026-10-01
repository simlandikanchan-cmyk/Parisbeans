import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 240000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})
const W = 375
const page = await browser.newPage()
await page.setViewport({ width: W, height: 1200, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
await page.evaluate(async () => {
  await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
  const sec = document.querySelector('.ostory-origin')
  scrollTo(0, sec.getBoundingClientRect().top + scrollY - 16)
})
await new Promise((r) => setTimeout(r, 1500))

const box = await page.evaluate(() => {
  const p = document.querySelector('.ostory-emblem-photo').getBoundingClientRect()
  const rows = []
  for (let y = 0; y < 1200; y += 40) {
    const els = document.elementsFromPoint(190, y).map((e) => e.className || e.tagName)
    rows.push(`${y}: ${els.slice(0, 4).join(' | ')}`)
  }
  return { photo: { l: p.left, t: p.top, w: p.width, h: p.height }, rows, sy: scrollY }
})
console.log(JSON.stringify(box, null, 2))

const clipY = Math.max(0, box.photo.t - 180)
const clip = { x: 0, y: clipY, width: W, height: Math.min(1200 - clipY, box.photo.h + 360) }
const s1 = await page.screenshot({ clip, encoding: 'base64' })
await new Promise((r) => setTimeout(r, 1500))
const s2 = await page.screenshot({ clip, encoding: 'base64' })

const res = await page.evaluate(
  async (a, b, cb) => {
    const load = async (s) => {
      const im = new Image()
      im.src = 'data:image/png;base64,' + s
      await im.decode()
      return im
    }
    const [ia, ib] = await Promise.all([load(a), load(b)])
    const cv = document.createElement('canvas')
    cv.width = ia.width
    cv.height = ia.height
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    const grab = (im) => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(im, 0, 0)
      return ctx.getImageData(0, 0, cv.width, cv.height).data
    }
    const A = grab(ia)
    const B = grab(ib)
    // row density profile
    const rows = []
    for (let y = 0; y < cv.height; y += 20) {
      let n = 0
      for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4
        if (
          Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 12
        )
          n++
      }
      if (n) rows.push(`y=${(y + cb.y).toFixed(0)} : ${n}px`)
    }
    // sample 12 changed points and identify the element there
    const samples = []
    outer: for (let y = 0; y < cv.height; y += 3) {
      for (let x = 0; x < cv.width; x += 3) {
        const i = (y * cv.width + x) * 4
        if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 12) {
          const vx = x + cb.x
          const vy = y + cb.y
          const els = document.elementsFromPoint(vx, vy).map((e) => {
            const cs = getComputedStyle(e)
            return `${e.tagName.toLowerCase()}.${(typeof e.className === 'string' ? e.className : '').split(' ').join('.')}`
          })
          samples.push({ x: vx, y: vy, els: els.slice(0, 5) })
          if (samples.length >= 12) break outer
        }
      }
    }
    return { rowProfile: rows, samples }
  },
  s1,
  s2,
  clip
)
console.log(JSON.stringify(res, null, 2))
await browser.close()
