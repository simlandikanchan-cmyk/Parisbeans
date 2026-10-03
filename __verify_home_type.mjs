import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = 'http://localhost:5199/'

const WIDTHS = [320, 360, 375, 390, 414, 480, 599, 600, 767, 768]

const SECTIONS = [
  { key: 'hero', sec: '.hero', eb: '.hero-eyebrow', hd: '.hero-title', ds: '.hero-desc' },
  { key: 'experience', sec: '.experience', eb: '.experience .eyebrow', hd: '.experience-title', ds: '.experience-desc' },
  { key: 'story', sec: '.story', eb: '.pb-story-eyebrow', hd: '.story-title', ds: '.story-paragraph' },
  { key: 'benefits', sec: '.benefits', eb: null, hd: '.benefit-title', ds: '.benefit-text' },
  { key: 'cafe', sec: '.cafe', eb: '.cafe-copy .eyebrow', hd: '.cafe-title', ds: '.cafe-paragraph' },
  { key: 'gallery', sec: '.gallery', eb: '.gallery .eyebrow', hd: '.gallery-title', ds: '.gallery-desc' },
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const out = {}

for (const w of WIDTHS) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 })
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })
  // .reveal is translateY(28px) until it scrolls into view, which would make
  // every gap between an eyebrow, a heading and a paragraph measure wrong for
  // elements still below the fold. Settle every reveal before measuring.
  await page.evaluate(() => {
    const s = document.createElement('style')
    s.textContent = '.reveal{opacity:1!important;transform:none!important;transition:none!important}'
    document.head.appendChild(s)
  })
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await new Promise((r) => setTimeout(r, 400))

  out[w] = await page.evaluate((SECTIONS) => {
    const round = (n) => Math.round(n * 10) / 10
    const px = (v) => (v === '' || v == null ? '-' : v)

    const style = (el) => {
      const cs = getComputedStyle(el)
      return {
        size: cs.fontSize,
        family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
        weight: cs.fontWeight,
        style: cs.fontStyle,
        lh: cs.lineHeight,
        track: cs.letterSpacing,
        color: cs.color,
        transform: cs.textTransform,
        align: cs.textAlign,
        maxw: cs.maxWidth,
        wrap: cs.textWrap || cs.textWrapStyle,
        clipped: el.scrollWidth > el.clientWidth + 1,
      }
    }

    // last rendered line: count words on the final line box
    const lines = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const boxes = new Map()
      const range = document.createRange()
      let node
      while ((node = walker.nextNode())) {
        const text = node.nodeValue
        const re = /\S+/g
        let m
        while ((m = re.exec(text))) {
          range.setStart(node, m.index)
          range.setEnd(node, m.index + m[0].length)
          const r = range.getBoundingClientRect()
          if (!r.height) continue
          const key = Math.round(r.top)
          boxes.set(key, (boxes.get(key) || 0) + 1)
        }
      }
      const tops = [...boxes.keys()].sort((a, b) => a - b)
      return { n: tops.length, lastWords: tops.length ? boxes.get(tops[tops.length - 1]) : 0 }
    }

    const res = { docScrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, sections: {} }

    for (const s of SECTIONS) {
      const sec = document.querySelector(s.sec)
      if (!sec) { res.sections[s.key] = { missing: true }; continue }
      const secCs = getComputedStyle(sec)
      const entry = {
        padTop: secCs.paddingTop,
        padBottom: secCs.paddingBottom,
        secLeft: round(sec.getBoundingClientRect().left),
      }
      const eb = s.eb ? sec.querySelector(s.eb) : null
      const hd = sec.querySelector(s.hd)
      const ds = sec.querySelector(s.ds)
      const ebWrap = sec.querySelector('.hero-eyebrow-wrap')
      const divider = sec.querySelector('.hero-divider')

      if (eb) {
        entry.eyebrow = style(eb)
        entry.eyebrow.left = round(eb.getBoundingClientRect().left)
      }
      if (hd) {
        entry.heading = style(hd)
        entry.heading.left = round(hd.getBoundingClientRect().left)
        entry.heading.lines = lines(hd)
      }
      if (ds) {
        entry.desc = style(ds)
        entry.desc.left = round(ds.getBoundingClientRect().left)
      }

      const ebBox = eb ? eb.getBoundingClientRect() : null
      const ebWrapBox = ebWrap ? ebWrap.getBoundingClientRect() : null
      if (ebWrapBox && hd) {
        const hdBox = hd.getBoundingClientRect()
        entry.gapEyebrowHeading = round(hdBox.top - ebWrapBox.bottom)
      } else if (ebBox && hd) {
        entry.gapEyebrowHeading = round(hd.getBoundingClientRect().top - ebBox.bottom)
      }
      if (hd && ds) {
        const hdBox = hd.getBoundingClientRect()
        const dsBox = ds.getBoundingClientRect()
        entry.gapHeadingDesc = round(dsBox.top - hdBox.bottom)
        if (divider) {
          const dBox = divider.getBoundingClientRect()
          entry.gapHeadingDescWithDivider = round(dsBox.top - hdBox.bottom)
          entry.dividerBetween = dBox.top > hdBox.bottom - 1 && dBox.bottom < dsBox.top + 1
        }
      }
      res.sections[s.key] = entry
    }
    return res
  }, SECTIONS)

  await page.close()
}

await browser.close()

const row = (label, get) => {
  const cells = WIDTHS.map((w) => get(out[w]))
  const uniq = [...new Set(cells.map((c) => JSON.stringify(c)))]
  return { label, cells, uniq: uniq.length }
}

const report = []
for (const s of SECTIONS) {
  for (const role of ['eyebrow', 'heading', 'desc']) {
    for (const prop of ['size', 'family', 'weight', 'style', 'lh', 'track', 'color', 'transform', 'align', 'left', 'clipped']) {
      const get = (d) => {
        const e = d.sections[s.key]
        if (!e || e.missing) return 'MISSING'
        if (!e[role]) return 'n/a'
        return String(e[role][prop] ?? 'n/a')
      }
      const r = row(`${s.key}.${role}.${prop}`, get)
      if (r.uniq > 1 || prop === 'size') report.push(r)
    }
  }
  for (const prop of ['padTop', 'padBottom', 'gapEyebrowHeading', 'gapHeadingDesc', 'gapHeadingDescWithDivider', 'dividerBetween']) {
    const get = (d) => String(d.sections[s.key]?.[prop] ?? 'n/a')
    const r = row(`${s.key}.${prop}`, get)
    report.push(r)
  }
}

console.log('\n=== VALUES PER WIDTH (320 360 375 390 414 480 599 600 767 768) ===')
for (const r of report) {
  console.log(`\n${r.label}  [${r.uniq} distinct]`)
  console.log('  ' + WIDTHS.map((w, i) => `${w}:${r.cells[i]}`).join('  '))
}

console.log('\n=== HORIZONTAL SCROLL / CLIP ===')
for (const w of WIDTHS) {
  const d = out[w]
  const clipped = []
  for (const s of SECTIONS) {
    const e = d.sections[s.key]
    if (!e || e.missing) continue
    for (const role of ['eyebrow', 'heading', 'desc']) {
      if (e[role]?.clipped) clipped.push(`${s.key}.${role}`)
    }
  }
  console.log(`${w}px  scrollW=${d.docScrollW} vw=${d.vw} hScroll=${d.docScrollW > d.vw + 1} clipped=[${clipped.join(',')}]`)
}

console.log('\n=== HEADING LINE RAG (orphan check) ===')
for (const s of SECTIONS) {
  const cells = WIDTHS.map((w) => {
    const l = out[w].sections[s.key]?.heading?.lines
    return l ? `${l.n}L/last=${l.lastWords}w` : 'n/a'
  })
  console.log(`${s.key.padEnd(11)} ` + WIDTHS.map((w, i) => `${w}:${cells[i]}`).join('  '))
}

console.log('\n=== 767 -> 768 STEP ===')
for (const s of SECTIONS) {
  for (const role of ['eyebrow', 'heading', 'desc']) {
    const a = out[767].sections[s.key]?.[role]?.size
    const b = out[768].sections[s.key]?.[role]?.size
    if (a && b) {
      const d = (parseFloat(b) - parseFloat(a)).toFixed(2)
      console.log(`${s.key}.${role}: 767=${a} 768=${b} step=${d}px${Math.abs(d) > 4 ? '  <-- JUMP' : ''}`)
    }
  }
}