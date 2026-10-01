import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
const info = await page.evaluate(async () => {
  const m = await import('/src/shared/assets/images/index.js')
  const url = m.storyImages.photo
  const res = await fetch(url)
  const text = await res.text()
  return {
    url,
    status: res.status,
    length: text.length,
    hasGoldFill: text.includes('C7A45A') || text.includes('c7a45a'),
    pathCount: (text.match(/<path/g) || []).length,
    imageCount: (text.match(/<image/g) || []).length,
    viewBox: (text.match(/viewBox="([^"]+)"/) || [])[1],
    // the longest path's data length, to see if the 79k ring survived
    longestPath: Math.max(...[...text.matchAll(/d="([^"]+)"/g)].map((m) => m[1].length)),
    hasWebp: text.includes('data:image/webp'),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()