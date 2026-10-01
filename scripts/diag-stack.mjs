import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})
const page = await browser.newPage()
await page.setViewport({ width: 744, height: 1200, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}` })
await page.evaluate(async () => {
  await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
  scrollTo(0, document.querySelector('.ostory-origin').getBoundingClientRect().top + scrollY - 16)
})
await new Promise((r) => setTimeout(r, 1200))

const out = await page.evaluate(() => {
  const g = document.querySelector('.ostory-emblem-photo').getBoundingClientRect()
  const stackAt = (x, y) =>
    document
      .elementsFromPoint(x, y)
      .map((el) => {
        const cs = getComputedStyle(el)
        return {
          sel:
            el.tagName.toLowerCase() +
            (el.id ? '#' + el.id : '') +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
              : ''),
          bg: cs.backgroundColor,
          bgi: cs.backgroundImage.slice(0, 60),
          clip: cs.clipPath,
          overflow: cs.overflow,
          radius: cs.borderRadius,
          pe: cs.pointerEvents,
          pos: cs.position,
          z: cs.zIndex,
        }
      })
  return {
    photo: { l: g.left, t: g.top, w: g.width, h: g.height },
    cornerTopLeft: stackAt(g.left + 2, g.top + 2),
    justInsideArch: stackAt(g.left + g.width * 0.53, g.top + g.height * 0.3),
    bottomStrip: stackAt(g.left + g.width * 0.75, g.top + g.height * 0.9945),
    html: getComputedStyle(document.documentElement).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
  }
})

console.log(JSON.stringify(out, null, 2))
await browser.close()