import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})

for (const w of [375, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 1400, deviceScaleFactor: 1 })
  await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))

  const out = await page.evaluate(() => {
    const el = document.querySelector('.ostory-origin .ostory-eyebrow')
    const cs = getComputedStyle(el)
    const r = document.createRange()
    r.selectNodeContents(el)
    const rects = [...r.getClientRects()].filter((x) => x.width > 0.2)
    const inkL = Math.min(...rects.map((x) => x.left))
    const inkR = Math.max(...rects.map((x) => x.right))
    const box = el.getBoundingClientRect()

    // what the width would be at other letter-spacings, measured the same way
    const probe = document.createElement('span')
    probe.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;` +
      `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};` +
      `text-transform:${cs.textTransform};color:${cs.color};`
    document.body.appendChild(probe)
    const trials = {}
    for (const ls of [0.05, 0.06, 0.07, 0.08, 0.09, 0.1]) {
      probe.style.letterSpacing = `${ls}em`
      trials[ls] = Math.round(probe.getBoundingClientRect().width * 10) / 10
    }
    probe.remove()
    return {
      fontSize: cs.fontSize,
      letterSpacing: cs.letterSpacing,
      boxW: Math.round(box.width * 10) / 10,
      inkW: Math.round((inkR - inkL) * 10) / 10,
      inkLeft: Math.round(inkL * 10) / 10,
      text: el.textContent,
      trials,
    }
  })
  console.log(`${w}px  ${JSON.stringify(out, null, 0)}`)
  await page.close()
}
await browser.close()
