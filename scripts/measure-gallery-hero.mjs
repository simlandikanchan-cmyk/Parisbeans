// Measures the GalleryHero mobile collage against the Figma spec.
// Freezes the marquee first so the numbers are deterministic.
//
// Run: node scripts/measure-gallery-hero.mjs [--label "after fix"]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9225
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\gal-profile'
const PORT = 5323
// `npm run dev` binds IPv6 loopback only; 127.0.0.1 refuses connections.
const LABEL = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'baseline'

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
      if (i === tries - 1) {
        console.log('\n  !! failing expression:')
        console.log(expr.split('\n').map((l, n) => `     ${n + 1}| ${l}`).join('\n'))
        throw e
      }
      await sleep(400)
    }
  }
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Page.navigate', { url: `${base}/gallery` })

// Wait for React AND the collage frames, tolerating context swaps.
let appeared = false
for (let i = 0; i < 60; i++) {
  appeared = await safeEval(
    `!!document.querySelector('.gal-hero-collage .gallery-image')`,
    1
  ).catch(() => false)
  if (appeared) break
  await sleep(300)
}
if (!appeared) {
  const why = await safeEval(
    `JSON.stringify({url:location.href, ready:document.readyState, root:!!document.getElementById('root'), figs:document.querySelectorAll('.gallery-image').length, body:document.body.innerText.slice(0,200)})`
  ).catch((e) => 'eval failed: ' + e.message)
  console.log('  collage never appeared:', why)
  throw new Error('gallery collage not found')
}
await sleep(500)

// Record the NATURAL animation state before touching anything, then freeze the
// track so the geometry below is deterministic. Freezing first would hide
// whether the stylesheet actually stopped the drift.
await safeEval(`
  (() => {
    const t = document.querySelector('.gallery-track');
    window.__naturalAnim = getComputedStyle(t).animationName;
    window.__naturalDur = getComputedStyle(t).animationDuration;
    t.style.animation = 'none';
    t.style.transform = 'none';
    return true;
  })()
`)
await sleep(300)

const MEASURE = `(() => {
  const g = (s) => document.querySelector(s);
  const r = (el) => { const b = el.getBoundingClientRect();
    return { x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1),
             right:+b.right.toFixed(1), bottom:+b.bottom.toFixed(1) }; };
  const cont = g('.gal-hero .container');
  const title = g('.gal-hero-title');
  const desc = g('.gal-hero-desc');
  const collage = g('.gal-hero-collage');
  const track = g('.gallery-track');
  const figs = document.querySelectorAll('.gallery-set:not(.gallery-set--loop) .gallery-image');
  const f1 = r(figs[0]), f2 = r(figs[1]);
  const cs = getComputedStyle(collage);
  const cBox = r(collage);
  return {
    vw: innerWidth,
    containerPad: parseFloat(getComputedStyle(cont).paddingInlineStart),
    titleX: r(title).x, titleRight: r(title).right,
    descX: r(desc).x, descBottom: r(desc).bottom,
    collageX: cBox.x, collageW: cBox.w, collageY: cBox.y, collageH: cBox.h,
    collageBottom: cBox.bottom,
    frame1: f1, frame2: f2,
    insetMismatch: +(f1.x - r(title).x).toFixed(1),
    vGap: +(f1.y - r(desc).bottom).toFixed(1),
    hGap: +(f2.x - f1.right).toFixed(1),
    peekVisible: +(innerWidth - f2.x).toFixed(1),
    // Is the 2nd frame riding above the 1st?
    rise: +(f2.y - f1.y).toFixed(1),
    // Clipping: the raised frame must not be cut by the collage's overflow.
    f2TopClearance: +(f2.y - cBox.y).toFixed(1),
    f1BottomClearance: +(cBox.bottom - f1.bottom).toFixed(1),
    animName: window.__naturalAnim,
    animDur: window.__naturalDur,
    marginTop: cs.marginTop,
    frameW: cs.getPropertyValue('--gal-frame-w').trim(),
    gapVar: cs.getPropertyValue('--gal-gap').trim(),
    aspect: +(f1.h / f1.w).toFixed(3),
  };
})()`

console.log(`\n########  ${LABEL.toUpperCase()}  ########\n`)
const rows = []
for (const w of [375, 390]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 844, deviceScaleFactor: 2, mobile: true })
  await sleep(600)
  const m = await evaluate(MEASURE)
  rows.push(m)
  console.log(`--- ${w}px ---`)
  console.log(`  container side padding : ${m.containerPad}px   <- text inset (h1 x=${m.titleX})`)
  console.log(`  frame 1                : x=${m.frame1.x} w=${m.frame1.w} h=${m.frame1.h} right=${m.frame1.right}`)
  console.log(`  frame 2                : x=${m.frame2.x} right=${m.frame2.right}`)
  console.log(`  collage box            : x=${m.collageX} w=${m.collageW}`)
  console.log('')
  console.log(`  [1] inset mismatch (frame1.x - text x) : ${m.insetMismatch}px   want 0`)
  console.log(`  [1b] main frame width as % of viewport   : ${((m.frame1.w / m.vw) * 100).toFixed(1)}%   want < 74%`)
  console.log(`  [1b] main frame w x h                  : ${m.frame1.w} x ${m.frame1.h}`)
  console.log(`  [2] vertical gap (desc.bottom->frame1.y): ${m.vGap}px            want >= 44px`)
  console.log(`  [3] frame 1 aspect h/w                 : ${m.aspect}   (w=${m.frame1.w}, h=${m.frame1.h})`)
  console.log(`  [4] peek visible width (vw - frame2.x)  : ${m.peekVisible}px`)
  console.log(`  [4] horizontal gap between frames       : ${m.hGap}px`)
  console.log(`  [5] frame 2 stagger (f2.y - f1.y)       : ${m.rise}px   want positive = 2nd sits LOWER`)
  console.log(`      frame 2 top clearance from clip     : ${m.f2TopClearance}px   want >= 0 (not cut off)`)
  console.log(`      frame 1 bottom clearance            : ${m.f1BottomClearance}px`)
  console.log(`      collage h=${m.collageH}  frame2 bottom=${m.frame2.bottom}  collage bottom=${m.collageBottom}`)
  console.log(`  vars: --gal-frame-w=${m.frameW}  --gal-gap=${m.gapVar}  margin-top=${m.marginTop}`)
  console.log('')
}

const f = (n) => rows.reduce((a, r) => a + n(r), 0) / rows.length
const avgInset = f((r) => Math.abs(r.insetMismatch))
const avgGap = f((r) => r.vGap)
const avgPeek = f((r) => r.peekVisible)
const avgH = f((r) => r.hGap)
console.log('=== verdict ===')
const checks = [
  ['[1] frame 1 aligns with text', avgInset < 1.5, `${avgInset.toFixed(1)}px off`],
  ['[1b] main frame < 74% of viewport', f((r) => r.frame1.w / r.vw) < 0.74, `${(f((r) => (r.frame1.w / r.vw) * 100)).toFixed(1)}%`],
  ['[2] vertical gap >= 44px', avgGap >= 44, `${avgGap.toFixed(1)}px`],
  ['[4] peek is a sliver, < 110px', avgPeek < 110, `${avgPeek.toFixed(1)}px`],
  ['[4] frame gap >= 12px', avgH >= 12, `${avgH.toFixed(1)}px`],
  ['[5] frame 2 staggered LOWER', f((r) => r.rise) > 8, `${f((r) => r.rise).toFixed(1)}px lower`],
  ['[6] frame 2 not clipped at top', f((r) => r.f2TopClearance) >= 0, `${f((r) => r.f2TopClearance).toFixed(1)}px`],
  ['[7] frame 2 inside collage box', rows.every((r) => r.frame2.bottom <= r.collageBottom + 0.5), rows.map((r) => (r.frame2.bottom - r.collageBottom).toFixed(1)).join(',')],
]
for (const [name, pass, detail] of checks) {
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(30)} ${detail}`)
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
await vite.close()
