import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5173/gallery'

const devices = [
  { name: 'mobile-375 (overlay scrollbar)', w: 375, h: 667, mobile: true },
  { name: 'mobile-412 (overlay scrollbar)', w: 412, h: 915, mobile: true },
  { name: 'mobile-767 (overlay scrollbar)', w: 767, h: 1024, mobile: true },
  { name: 'tablet-768 (classic scrollbar)', w: 768, h: 1024, mobile: false },
  { name: 'tablet-1024 (classic scrollbar)', w: 1024, h: 1366, mobile: false },
  { name: 'desktop-1440 (classic scrollbar)', w: 1440, h: 900, mobile: false },
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

for (const d of devices) {
  const page = await browser.newPage()
  await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 1, isMobile: d.mobile, hasTouch: d.mobile })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2500))

  const info = await page.evaluate(() => {
    const coll = document.querySelector('.gal-hero-collage')
    const hero = document.querySelector('.gal-hero')
    const track = document.querySelector('.gallery-track')
    const set = coll.querySelector('.gallery-set')
    // Freeze the marquee at its resting offset so the geometry is deterministic
    track.style.animation = 'none'
    track.style.transform = 'none'
    const cr = coll.getBoundingClientRect()
    const hr = hero.getBoundingClientRect()
    const figs = [...set.querySelectorAll('.gallery-image')]
    const r = (el) => el.getBoundingClientRect()
    const rel = (x) => Math.round((x - cr.left) * 10) / 10
    const rows = figs.map((f) => {
      const b = r(f)
      const cs = getComputedStyle(f)
      return {
        n: f.className.split(' ')[1],
        w: Math.round(b.width * 10) / 10,
        h: Math.round(b.height * 10) / 10,
        leftFromCollLeft: rel(b.left),
        rightFromCollLeft: rel(b.right),
        topFromCollTop: Math.round((b.top - cr.top) * 10) / 10,
        o: cs.getPropertyValue('--o').trim(),
        wVar: cs.getPropertyValue('--w').trim(),
      }
    })
    const vw = document.documentElement.clientWidth
    return {
      vw100: vw,
      docClientW: document.documentElement.clientWidth,
      heroBox: [Math.round(hr.left * 10) / 10, Math.round(hr.right * 10) / 10],
      collBox: [Math.round(cr.left * 10) / 10, Math.round(cr.right * 10) / 10],
      collOverhangLeft: Math.round((hr.left - cr.left) * 10) / 10,
      collOverhangRight: Math.round((cr.right - hr.right) * 10) / 10,
      collWidth: Math.round(cr.width * 10) / 10,
      hScrollbar: document.documentElement.scrollWidth > vw + 1,
      frames: rows,
    }
  })

  // visible-slice analysis: how much of each frame the viewport actually shows at rest
  const vis = info.frames.map((f) => {
    const vw = info.vw100
    const l = f.leftFromCollLeft
    const rgt = f.rightFromCollLeft
    const shown = Math.max(0, Math.min(rgt, vw) - Math.max(l, 0))
    return { n: f.n, shownPx: Math.round(shown * 10) / 10, pct: Math.round((shown / f.w) * 1000) / 10, flushL: l <= 0.5, flushR: rgt >= vw - 0.5 }
  })

  console.log('=====', d.name, '=====')
  console.log(JSON.stringify({ ...info, frames: undefined, visibility: vis }))
  await page.close()
}

await browser.close()
