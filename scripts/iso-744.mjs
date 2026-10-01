import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const W = Number(process.argv[2] || 744)
const t0 = Date.now()
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 90000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
})
const page = await browser.newPage()
page.on('error', (e) => log('PAGE ERROR ' + e.message))
await page.setViewport({ width: W, height: 1200, deviceScaleFactor: 1 })
log('viewport set')
await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
log('loaded')
await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}` })
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
})
log('settled')
await new Promise((r) => setTimeout(r, 1500))

const g = await page.evaluate(() => {
  const p = document.querySelector('.ostory-emblem-photo').getBoundingClientRect()
  return { l: p.left, t: p.top, w: p.width, h: p.height }
})
log('geometry ' + JSON.stringify(g))

const clip = { x: Math.floor(g.l), y: Math.floor(g.t), width: Math.ceil(g.w), height: Math.ceil(g.h) }
log('clip ' + JSON.stringify(clip))

const stable = async (name, mutate) => {
  log(`${name}: applying mutation`)
  if (mutate) await page.evaluate(mutate)
  log(`${name}: mutation applied`)
  await new Promise((r) => setTimeout(r, 250))
  let prev = await page.screenshot({ clip, encoding: 'base64' })
  log(`${name}: first capture (${prev.length} b64 chars)`)
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 220))
    const next = await page.screenshot({ clip, encoding: 'base64' })
    if (next === prev) {
      log(`${name}: converged after ${i + 1} retries`)
      return { png: prev, tries: i + 1, stable: true }
    }
    log(`${name}: retry ${i + 1} differed`)
    prev = next
  }
  log(`${name}: DID NOT CONVERGE`)
  return { png: prev, tries: 6, stable: false }
}

const A = await stable('A', null)
const B = await stable('B', () => document.querySelector('.pb-story-ring').style.setProperty('display', 'none'))
const C = await stable('C', () => {
  document.querySelector('.pb-story-ring').style.setProperty('display', 'none')
  document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
})
log('all captures done')

for (const [k, v] of Object.entries({ A, B, C }))
  writeFileSync(`C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\iso-${W}-${k}.png`, Buffer.from(v.png, 'base64'))
log('pngs written')

for (const [k, v] of Object.entries({ A, B, C })) {
  const s = sharp(Buffer.from(v.png, 'base64'))
  const meta = await s.metadata()
  log(`${k}: ${meta.width}x${meta.height}`)
}
log('sharp metadata ok')
await browser.close()
log('closed')
