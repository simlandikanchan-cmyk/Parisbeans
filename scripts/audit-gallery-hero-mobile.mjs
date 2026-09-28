// Audits the GalleryHero carousel against the Figma spec at <=480px, and proves
// the >480px composition is untouched by the same stylesheet change.
//
// Run: node scripts/audit-gallery-hero-mobile.mjs
//
// The mobile numbers are asserted, not just printed: card 1 flush at x=0 with
// square corners, card 2 raised 90px and 335 tall, 65px gap, 16px text inset,
// ~170px above the row, ~130px of clear space below, and a real swipeable
// scroller (scrollLeft must actually move, and the body must not scroll
// sideways). Desktop is checked for the opposite of every mobile override.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9226
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\gal-mobile-profile'
const PORT = 5324
const SHOT_DIR = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\opencode'
const LABELS = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'gallery hero mobile'

const { createServer: createViteServer } = await import('vite')
const vite = await createViteServer({
  configFile: './vite.config.js',
  server: { port: PORT, host: '127.0.0.1', strictPort: true },
  logLevel: 'error',
})
await vite.listen()
const base = `http://127.0.0.1:${PORT}`

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=430,932', 'about:blank'],
  { stdio: 'ignore' }
)

let ws, id = 0
const pending = new Map()
const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id
    pending.set(n, { resolve, reject })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const p = l.find((t) => t.type === 'page')
    if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break }
  } catch {}
  await sleep(250)
}
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
  }
}
const evaluate = async (expr) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description ||
        r.exceptionDetails.text ||
        JSON.stringify(r.exceptionDetails)
    )
  }
  return r.result.value
}
/** Retry through execution-context swaps (Vite dev transform / HMR). */
const safeEval = async (expr, tries = 12) => {
  for (let i = 0; i < tries; i++) {
    try {
      return await evaluate(expr)
    } catch (e) {
      if (i === tries - 1) throw e
      await sleep(400)
    }
  }
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Page.navigate', { url: `${base}/gallery` })

let appeared = false
for (let i = 0; i < 60; i++) {
  appeared = await safeEval(
    `!!document.querySelector('.gal-hero-collage .gallery-image')`,
    1
  ).catch(() => false)
  if (appeared) break
  await sleep(300)
}
if (!appeared) throw new Error('gallery collage not found')

/**
 * Everything the Figma spec names, read from computed style and layout boxes.
 * No animation is frozen: the marquee is supposed to be OFF here, so its
 * computed name is itself an assertion, and freezing would hide a regression.
 */
const MEASURE = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  const g = (s) => document.querySelector(s);
  const r = (el) => { const b = el.getBoundingClientRect();
    return { x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1),
             right:+b.right.toFixed(1), bottom:+b.bottom.toFixed(1) }; };
  const hero = g('.gal-hero');
  const cont = g('.gal-hero .container');
  const title = g('.gal-hero-title');
  const desc = g('.gal-hero-desc');
  const eyebrow = g('.gal-hero .eyebrow');
  const collage = g('.gal-hero-collage');
  const track = g('.gallery-track');
  const set = g('.gallery-set:not(.gallery-set--loop)');
  const loop = g('.gallery-set--loop');
  const figs = document.querySelectorAll('.gallery-set:not(.gallery-set--loop) .gallery-image');
  const f1 = r(figs[0]), f2 = r(figs[1]), f3 = r(figs[2]);
  const cs = getComputedStyle(collage);
  const hs = getComputedStyle(hero);
  const ts = getComputedStyle(title);
  const ds = getComputedStyle(desc);
  const es = getComputedStyle(eyebrow);
  const f1s = getComputedStyle(figs[0]);
  const i1s = getComputedStyle(figs[0].querySelector('img'));

  // Does the row actually swipe? scrollLeft only moves if the box is a real
  // scroll container, not a marquee being dragged by an animation.
  const before = collage.scrollLeft;
  collage.scrollLeft = 220;
  await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
  const after = collage.scrollLeft;
  const maxScroll = collage.scrollWidth - collage.clientWidth;
  collage.scrollLeft = 0;
  await new Promise(r2 => requestAnimationFrame(r2));

  return {
    vw: innerWidth,
    scrollWidth: collage.scrollWidth,
    clientWidth: collage.clientWidth,
    maxScroll: +maxScroll.toFixed(1),
    swiped: +(after - before).toFixed(1),
    bodyOverflowX: +(document.documentElement.scrollWidth - innerWidth).toFixed(1),
    containerPad: parseFloat(getComputedStyle(cont).paddingInlineStart),
    titleX: r(title).x, titleRight: r(title).right,
    descBottom: r(desc).bottom,
    eyebrow: { color: es.color, transform: es.textTransform, size: es.fontSize },
    eyebrowBox: r(eyebrow),
    title: { size: ts.fontSize, lh: ts.lineHeight, color: ts.color, family: ts.fontStyle + ' ' + ts.fontFamily.split(',')[0] },
    desc: { size: ds.fontSize, lh: ds.lineHeight, color: ds.color },
    collageBox: r(collage),
    collage: {
      overflowX: cs.overflowX, overflowY: cs.overflowY,
      snap: cs.scrollSnapType, scrollbarWidth: cs.scrollbarWidth,
      padLeft: cs.paddingLeft, marginTop: cs.marginTop,
    },
    heroBg: hs.backgroundColor,
    heroPadBottom: hs.paddingBottom,
    trackAnim: getComputedStyle(track).animationName,
    setGap: getComputedStyle(set).gap,
    trackGap: getComputedStyle(track).gap,
    loopDisplay: getComputedStyle(loop).display,
    figCount: figs.length,
    f1, f2, f3,
    f1Radius: f1s.borderRadius,
    imgFit: i1s.objectFit,
    imgH: i1s.height, imgW: i1s.width,
    // Derived against the Figma numbers
    textInset: +r(title).x.toFixed(1),
    gapAbove: +(collage.getBoundingClientRect().y - r(desc).bottom).toFixed(1),
    rise: +(f2.y - f1.y).toFixed(1),
    hGap: +(f2.x - f1.right).toFixed(1),
    peek: +(innerWidth - f2.x).toFixed(1),
    sectionPadBelow: parseFloat(hs.paddingBottom),
  };
})()`

const MOBILE = [320, 390, 480]
const DESKTOP = [768, 1280]

console.log(`\n########  ${LABELS.toUpperCase()}  ########\n`)
const results = []

for (const w of MOBILE) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 844, deviceScaleFactor: 2, mobile: true })
  await safeEval(`location.reload()`)
  await sleep(2500)
  await safeEval(`document.querySelector('.gal-hero-collage .gallery-image') ? 1 : 0`)
  const m = await safeEval(MEASURE)
  results.push({ w, m })
  console.log(`--- ${w}px (Figma spec) ---`)
  console.log(`  text inset            : ${m.textInset}px          want 16`)
  console.log(`  card 1                : x=${m.f1.x} w=${m.f1.w} h=${m.f1.h}   want x=0 274x284`)
  console.log(`  card 2                : x=${m.f2.x} w=${m.f2.w} h=${m.f2.h}   want 274 wide, 335 tall`)
  console.log(`  card 3 (continues)    : x=${m.f3.x} w=${m.f3.w} h=${m.f3.h}`)
  console.log(`  stagger (f2.y - f1.y) : ${m.rise}px          want -90 (card 2 higher)`)
  console.log(`  horizontal gap        : ${m.hGap}px          want 65`)
  console.log(`  right-edge peek       : ${m.peek}px`)
  console.log(`  gap paragraph->row    : ${m.gapAbove}px          want ~170`)
  console.log(`  section pad-bottom    : ${m.sectionPadBelow}px          want 130`)
  console.log(`  corners (figure/img)  : radius ${m.f1Radius} / fit ${m.imgFit} ${m.imgW}x${m.imgH}   want 0 / cover`)
  console.log(`  scroller              : ${m.collage.overflowX}/${m.collage.overflowY} snap=${m.collage.snap} bar=${m.collage.scrollbarWidth}`)
  console.log(`  scrollWidth/client    : ${m.scrollWidth}/${m.clientWidth}  max=${m.maxScroll}  swiped=${m.swiped}px`)
  console.log(`  body horizontal spill : ${m.bodyOverflowX}px          want <= 0`)
  console.log(`  track animation       : ${m.trackAnim}   want none (marquee off)`)
  console.log(`  loop set display      : ${m.loopDisplay}   want none`)
  console.log(`  set gap / track gap   : ${m.setGap} / ${m.trackGap}   want 65`)
  console.log(`  title                 : ${m.title.size}/${m.title.lh} ${m.title.color} ${m.title.family}`)
  console.log(`  paragraph             : ${m.desc.size}/${m.desc.lh} ${m.desc.color}`)
  console.log(`  eyebrow               : ${m.eyebrow.color} ${m.eyebrow.transform} ${m.eyebrow.size}`)
  console.log(`  hero background       : ${m.heroBg}   want rgb(247, 242, 234)`)
  console.log('')

  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`${SHOT_DIR}\\gallery-hero-${w}.png`, Buffer.from(shot.data, 'base64'))
}

for (const w of DESKTOP) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false })
  await safeEval(`location.reload()`)
  await sleep(2500)
  const m = await safeEval(MEASURE)
  results.push({ w, m, desktop: true })
  console.log(`--- ${w}px (desktop must be UNCHANGED) ---`)
  console.log(`  text inset            : ${m.textInset}px   (not the 16px mobile override)`)
  console.log(`  card 1                : x=${m.f1.x} w=${m.f1.w} h=${m.f1.h}   (not 274x284)`)
  console.log(`  corners (figure)      : radius ${m.f1Radius}   (not 0)`)
  console.log(`  track animation       : ${m.trackAnim}   want galMarquee`)
  console.log(`  loop set display      : ${m.loopDisplay}   want flex (marquee needs it)`)
  console.log(`  scroller              : ${m.collage.overflowX}/${m.collage.overflowY}   want hidden/hidden`)
  console.log(`  set gap / track gap   : ${m.setGap} / ${m.trackGap}   (not 65)`)
  console.log('')
}

const m = results.filter((r) => !r.desktop).map((r) => r.m)
const d = results.filter((r) => r.desktop).map((r) => r.m)
const near = (v, t, tol = 1.5) => Math.abs(v - t) <= tol

console.log('=== mobile verdict (<=480) ===')
const mobileChecks = [
  ['text inset 16px', m.every((r) => near(r.textInset, 16)), m.map((r) => r.textInset).join(',')],
  ['card 1 flush at x=0', m.every((r) => Math.abs(r.f1.x) < 1.5), m.map((r) => r.f1.x).join(',')],
  ['card 1 274x284', m.every((r) => near(r.f1.w, 274) && near(r.f1.h, 284)), m.map((r) => `${r.f1.w}x${r.f1.h}`).join(',')],
  ['card 2 274x335', m.every((r) => near(r.f2.w, 274) && near(r.f2.h, 335)), m.map((r) => `${r.f2.w}x${r.f2.h}`).join(',')],
  ['card 2 raised 90px', m.every((r) => near(r.rise, -90)), m.map((r) => r.rise).join(',')],
  ['horizontal gap 65px', m.every((r) => near(r.hGap, 65)), m.map((r) => r.hGap).join(',')],
  ['gap above row ~170px', m.every((r) => r.gapAbove >= 160 && r.gapAbove <= 200), m.map((r) => r.gapAbove).join(',')],
  ['pad below 130px', m.every((r) => near(r.sectionPadBelow, 130)), m.map((r) => r.sectionPadBelow).join(',')],
  ['square corners on figure', m.every((r) => r.f1Radius === '0px'), m.map((r) => r.f1Radius).join(',')],
  ['img object-fit cover', m.every((r) => r.imgFit === 'cover'), m.map((r) => r.imgFit).join(',')],
  ['row is an x scroller', m.every((r) => r.collage.overflowX === 'auto' && r.collage.overflowY === 'hidden'), ''],
  ['snap x mandatory', m.every((r) => /x.*mandatory/.test(r.collage.snap)), m.map((r) => r.collage.snap).join(' | ')],
  ['scrollbar hidden', m.every((r) => r.collage.scrollbarWidth === 'none'), m.map((r) => r.collage.scrollbarWidth).join(',')],
  ['row actually swipes', m.every((r) => r.swiped > 100), m.map((r) => r.swiped).join(',')],
  ['no body h-scroll spill', m.every((r) => r.bodyOverflowX <= 0.5), m.map((r) => r.bodyOverflowX).join(',')],
  ['marquee off', m.every((r) => r.trackAnim === 'none'), m.map((r) => r.trackAnim).join(',')],
  ['loop set hidden', m.every((r) => r.loopDisplay === 'none'), m.map((r) => r.loopDisplay).join(',')],
  ['7 cards remain', m.every((r) => r.figCount === 7), m.map((r) => r.figCount).join(',')],
  ['title 32/1.2 #3b2118', m.every((r) => near(parseFloat(r.title.size), 32) && near(parseFloat(r.title.lh), 38.4, 1) && r.title.color === 'rgb(59, 33, 24)'), m.map((r) => `${r.title.size}/${r.title.lh}/${r.title.color}`).join(' | ')],
  ['paragraph 15/1.5', m.every((r) => near(parseFloat(r.desc.size), 15) && near(parseFloat(r.desc.lh), 22.5, 1)), m.map((r) => `${r.desc.size}/${r.desc.lh}`).join(' | ')],
  ['eyebrow gold uppercase', m.every((r) => r.eyebrow.transform === 'uppercase' && r.eyebrow.color === 'rgb(199, 164, 90)'), m.map((r) => `${r.eyebrow.color}/${r.eyebrow.transform}`).join(' | ')],
]

console.log('=== desktop untouched (>=481) ===')
const desktopChecks = [
  ['marquee still animating', d.every((r) => r.trackAnim === 'galMarquee'), d.map((r) => r.trackAnim).join(',')],
  ['loop set still displayed', d.every((r) => r.loopDisplay !== 'none'), d.map((r) => r.loopDisplay).join(',')],
  ['corners still rounded', d.every((r) => r.f1Radius !== '0px'), d.map((r) => r.f1Radius).join(',')],
  ['cards not 274x284', d.every((r) => Math.abs(r.f1.w - 274) > 20), d.map((r) => r.f1.w).join(',')],
  ['not an x scroller', d.every((r) => r.collage.overflowX === 'hidden'), d.map((r) => r.collage.overflowX).join(',')],
  ['gap not 65px', d.every((r) => Math.abs(parseFloat(r.setGap) - 65) > 5), d.map((r) => r.setGap).join(',')],
  ['16px inset override absent', d.every((r) => !near(r.textInset, 16)), d.map((r) => r.textInset).join(',')],
]

for (const [name, pass, detail] of [...mobileChecks, ...desktopChecks]) {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(30)} ${detail}`)
}
const failed = [...mobileChecks, ...desktopChecks].filter(([, pass]) => !pass)
console.log('')
console.log(failed.length ? `  ${failed.length} FAILING` : '  all green')
console.log(`  screenshots: ${SHOT_DIR}\\gallery-hero-{320,390,480}.png`)
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
await vite.close()
process.exit(failed.length ? 1 : 0)
