// Layout fingerprint for every /our-story section across a width range.
// Catches box/position drift when a section's display type changes.
//
// Run: node scripts/measure-story-tablet-type.mjs [widths] [outFile]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9231
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-type-profile'
const BASE = 'http://localhost:5173'

const WIDTHS = (process.argv[2] || '641,768,800,834,900,960,1023,1024')
  .split(',')
  .map(Number)
const OUT = process.argv[3]

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
  for (const s of sels) {
    const els = [...document.querySelectorAll(s)];
    out[s] = els.map((el) => {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const r = (n) => Math.round(n * 10) / 10;
      return [cs.display, r(b.x), r(b.y + scrollY), r(b.width), r(b.height), cs.fontSize, cs.lineHeight, cs.textAlign, cs.justifyContent, cs.alignItems].join('|');
    });
  }
  out.__overflowX = document.documentElement.scrollWidth > innerWidth + 1;
  out.__docH = Math.round(document.documentElement.scrollHeight);
  return out;
})()`

const report = {}
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(600)
  const p = await ev(PROBE)
  const lines = []
  for (const [k, v] of Object.entries(p)) {
    if (k.startsWith('__')) { lines.push(`${k}=${v}`); continue }
    v.forEach((row, i) => lines.push(`${k}${v.length > 1 ? '[' + i + ']' : ''}  ${row}`))
  }
  report[w] = lines
  console.log(`\n--- ${w}px ---`)
  for (const l of lines) console.log('  ' + l)
}
if (OUT) writeFileSync(OUT, JSON.stringify(report, null, 1))

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
