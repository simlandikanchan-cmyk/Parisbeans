// A/B the story-page tablet layout in one browser session: measures the current
// stylesheet, then re-measures with the pre-flex display declarations injected
// as an override, and prints the per-box delta. Proves the grid -> flex change
// is visually neutral (or shows exactly where it is not).
//
// Run: node scripts/measure-story-tablet-ab.mjs [widths]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9232
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-ab-profile'
const BASE = 'http://localhost:5173'

const WIDTHS = (process.argv[2] || '641,768,834,900,960,1023,1024')
  .split(',')
  .map(Number)

// The declarations as they stood before StoryPage.css made the tablet band flex.
const REVERT = `
.ostory-hero-box { display: block !important; }
.ostory-origin-grid { display: grid !important; align-items: center !important; }
.ostory-story-img { display: grid !important; justify-items: center !important; }
.ostory-cta-inner { display: flex !important; flex-direction: column !important; }
.ostory-emblem-wrap { align-self: auto !important; justify-self: center !important; }
`

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=1100,1000', 'about:blank'],
  { stdio: 'ignore' }
)
let ws, id = 0
const pending = new Map()
const cdp = (m, p = {}) =>
  new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method: m, params: p })) })
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const t = l.find((x) => x.type === 'page')
    if (t?.webSocketDebuggerUrl) { ws = new WebSocket(t.webSocketDebuggerUrl); break }
  } catch {}
  await sleep(250)
}
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result) }
}
const ev = async (expr) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Page.navigate', { url: `${BASE}/our-story` })
let ok = false
for (let i = 0; i < 100; i++) {
  ok = await ev(`!!document.querySelector('.ostory-origin')`).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error('story page not found at ' + BASE + '/our-story')
await sleep(1500)

const SEL = [
  '.ostory-hero', '.ostory-hero-box', '.ostory-hero .ostory-eyebrow', '.ostory-title',
  '.ostory-desc', '.ostory-gallery', '.ostory-panel.is-active',
  '.ostory-origin', '.ostory-origin-grid', '.ostory-origin .eyebrow', '.ostory-origin-title',
  '.ostory-origin-text', '.ostory-emblem-wrap', '.ostory-emblem-photo',
  '.ostory-story-img', '.ostory-story-img img',
  '.ostory-cta', '.ostory-cta-inner', '.ostory-cta-title', '.ostory-cta-desc', '.ostory-cta-btn',
]

const PROBE = `(() => {
  const sels = ${JSON.stringify(SEL)};
  const out = {};
  const r = (n) => Math.round(n * 10) / 10;
  for (const s of sels) {
    out[s] = [...document.querySelectorAll(s)].map((el) => {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return { x: r(b.x), y: r(b.y + scrollY), w: r(b.width), h: r(b.height), d: cs.display,
               fs: cs.fontSize, lh: cs.lineHeight, ta: cs.textAlign };
    });
  }
  out.__overflowX = document.documentElement.scrollWidth > innerWidth + 1;
  out.__docH = Math.round(document.documentElement.scrollHeight);
  return out;
})()`

const setRevert = (on) => ev(`(() => {
  let el = document.getElementById('ab-revert');
  if (${on}) {
    if (!el) { el = document.createElement('style'); el.id = 'ab-revert'; document.head.appendChild(el); }
    el.textContent = ${JSON.stringify(REVERT)};
  } else if (el) { el.remove(); }
  return true;
})()`)

for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(400)
  await setRevert(false)
  await sleep(400)
  const after = await ev(PROBE)
  await setRevert(true)
  await sleep(400)
  const before = await ev(PROBE)
  await setRevert(false)

  console.log(`\n=== ${w}px ===`)
  let changed = 0
  for (const k of Object.keys(after)) {
    if (k.startsWith('__')) {
      if (after[k] !== before[k]) { console.log(`  ${k}: ${before[k]} -> ${after[k]}`); changed++ }
      continue
    }
    after[k].forEach((a, i) => {
      const b = before[k]?.[i]
      if (!b) return
      const dRow = a.d !== b.d ? `display ${b.d} -> ${a.d}` : ''
      const dBox = ['x', 'y', 'w', 'h'].filter((p) => a[p] !== b[p])
        .map((p) => `${p} ${b[p]} -> ${a[p]}`).join(', ')
      const dType = ['fs', 'lh', 'ta'].filter((p) => a[p] !== b[p])
        .map((p) => `${p} ${b[p]} -> ${a[p]}`).join(', ')
      if (dRow || dBox || dType) {
        changed++
        console.log(`  ${k}${after[k].length > 1 ? `[${i}]` : ''}`)
        if (dRow) console.log(`      ${dRow}`)
        if (dBox) console.log(`      ${dBox}`)
        if (dType) console.log(`      ${dType}`)
      }
    })
  }
  if (!changed) console.log('  identical to pre-flex layout')
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
