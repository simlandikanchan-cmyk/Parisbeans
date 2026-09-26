import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5173/gallery'

const devices = [
  { name: 'mobile-375', w: 375, h: 667, dsf: 2, mobile: true },
  { name: 'mobile-412', w: 412, h: 915, dsf: 2, mobile: true },
  { name: 'mobile-767', w: 767, h: 1024, dsf: 2, mobile: true },
  { name: 'tablet-768', w: 768, h: 1024, dsf: 2, mobile: true },
  { name: 'tablet-820', w: 820, h: 1180, dsf: 2, mobile: true },
  { name: 'tablet-1024', w: 1024, h: 1366, dsf: 2, mobile: true },
  { name: 'desktop-1440', w: 1440, h: 900, dsf: 1, mobile: false },
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

for (const d of devices) {
  const page = await browser.newPage()
  await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: d.dsf, isMobile: d.mobile, hasTouch: d.mobile })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2500))

  const t1 = await page.evaluate(() => getComputedStyle(document.querySelector('.gallery-track')).transform)
  await new Promise((r) => setTimeout(r, 1200))
  const t2 = await page.evaluate(() => getComputedStyle(document.querySelector('.gallery-track')).transform)

  const info = await page.evaluate(() => {
    const r = (el) => el.getBoundingClientRect()
    const coll = document.querySelector('.gal-hero-collage')
    const hero = document.querySelector('.gal-hero')
    const track = document.querySelector('.gallery-track')
    if (!coll || !hero || !track) return { missing: { coll: !!coll, hero: !!hero, track: !!track }, html: document.body.innerHTML.slice(0, 200) }
    const cr = r(coll)
    const hr = r(hero)
    const figs = [...coll.querySelectorAll('.gallery-set .gallery-image')].slice(0, 7)
    const rects = figs.map(r)
    const cs = (el) => getComputedStyle(el)
    // first frame whose left edge is still on screen, and the frame after it
    const idx = rects.findIndex((x) => x.left >= cr.left - 1)
    const a = rects[idx] ?? rects[0]
    const b = rects[idx + 1] ?? rects[1]
    const ea = figs[idx] ?? figs[0]
    const eb = figs[idx + 1] ?? figs[1]
    const vw = document.documentElement.clientWidth
    return {
      clientW: vw,
      heroBox: [Math.round(hr.left * 10) / 10, Math.round(hr.right * 10) / 10],
      collBox: [Math.round(cr.left * 10) / 10, Math.round(cr.right * 10) / 10],
      collCoversHero:
        cr.left <= hr.left + 0.5 && cr.right >= hr.right - 0.5,
      frameW: cs(ea).getPropertyValue('--w').trim(),
      frameWPx: Math.round(a.width * 10) / 10,
      topSpread: Math.round((Math.max(...rects.map((x) => x.top)) - Math.min(...rects.map((x) => x.top))) * 10) / 10,
      lefts: rects.map((x) => Math.round(x.left)),
      peekPx: Math.round((cr.right - b.left) * 10) / 10,
      peekPct: Math.round(((cr.right - b.left) / b.width) * 1000) / 10,
      gapBeforeNext: Math.round((b.left - a.right) * 10) / 10,
      marginTop: cs(coll).marginTop,
      frameWVar: cs(coll).getPropertyValue('--gal-frame-w').trim(),
      gapVar: cs(coll).getPropertyValue('--gal-gap').trim(),
      anim: cs(track).animationName + ' ' + cs(track).animationDuration,
      animPaused: cs(track).animationPlayState,
      img4shadow: cs(figs[3]).boxShadow,
      img4ml: cs(figs[3]).marginLeft,
      img4zi: cs(figs[3]).zIndex,
      hScrollbar: document.documentElement.scrollWidth > vw + 1,
      masks: cs(coll).maskImage,
    }
  })
  info.trackMoved = t1 !== t2
  console.log('=====', d.name, '=====')
  console.log(JSON.stringify(info, null, 1))
  await page.close()
}

await browser.close()
