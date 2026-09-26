import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5173/gallery'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

/* ---- 1. Tablet 768: does the target arrangement occur inside the loop? ---- */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))

  const out = await page.evaluate(() => {
    const coll = document.querySelector('.gal-hero-collage')
    const track = document.querySelector('.gallery-track')
    const figs = [...coll.querySelector('.gallery-set').querySelectorAll('.gallery-image')]
    track.style.animation = 'none'
    const setWidth = coll.querySelector('.gallery-set').getBoundingClientRect().width
    const cr = coll.getBoundingClientRect()
    const vw = cr.width
    const shots = []
    for (const off of [0, 60, 100, 130, 200, 300]) {
      track.style.transform = `translateX(${-off}px)`
      const b = figs.slice(0, 3).map((f) => f.getBoundingClientRect())
      const l = b.map((x) => Math.round(x.left * 10) / 10)
      const r = b.map((x) => Math.round(x.right * 10) / 10)
      shots.push({
        off,
        f1: l[0] < -1 ? `bleeds off left by ${-l[0]}` : l[0] === 0 ? 'flush at left edge' : `inset ${l[0]}`,
        f2: `${l[1]}..${r[1]} (centre ${Math.round((l[1] + r[1]) / 2)} vs vp ${Math.round(vw / 2)})`,
        f3: r[2] > vw + 1 ? `bleeds off right by ${Math.round(r[2] - vw)}` : r[2] <= vw ? `ends at ${r[2]}` : 'inside',
        f2pctVisible: Math.round((Math.min(r[1], vw) - Math.max(l[1], 0)) / (r[1] - l[1]) * 100),
      })
    }
    track.style.transform = 'none'
    return { setWidth: Math.round(setWidth * 10) / 10, loopTravel: Math.round(setWidth * 10) / 10, collWidth: Math.round(cr.width * 10) / 10, shots }
  })
  console.log('===== tablet 768: loop sweep =====')
  console.log(JSON.stringify(out, null, 1))
  await page.close()
}

/* ---- 2. Break-out vs plain 100vw when the ancestor has inline padding ---- */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))

  const out = await page.evaluate(() => {
    const hero = document.querySelector('.gal-hero')
    const coll = document.querySelector('.gal-hero-collage')
    const track = document.querySelector('.gallery-track')
    track.style.animation = 'none'
    track.style.transform = 'none'
    const style = document.createElement('style')
    style.textContent = '.gal-hero { padding-inline: 20px !important; }'
    document.head.appendChild(style)

    const read = () => {
      const cr = coll.getBoundingClientRect()
      const hr = hero.getBoundingClientRect()
      return {
        heroContentBox: [hr.left + 20, hr.right - 20],
        collBox: [Math.round(cr.left * 10) / 10, Math.round(cr.right * 10) / 10],
        gapAtLeft: Math.round((cr.left - hr.left) * 10) / 10,
        gapAtRight: Math.round((hr.right - cr.right) * 10) / 10,
        coversViewport: cr.left <= 0.5 && cr.right >= window.innerWidth - 0.5,
      }
    }
    const withBreakOut = read()
    coll.style.marginLeft = '0'
    coll.style.transform = 'none'
    const plain100vw = read()
    style.remove()
    coll.style.marginLeft = ''
    coll.style.transform = ''
    return { withBreakOut, plain100vw }
  })
  console.log('===== ancestor padding-inline: 20px, viewport 768 =====')
  console.log(JSON.stringify(out, null, 1))
  await page.close()
}

await browser.close()
