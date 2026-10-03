// Post-change check for .ostory-cta-desc: is it still centred on the page, and
// does the wider measure push anything off-screen?
//
// Run: node scripts/verify-cta-desc-oneline.mjs [widths]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9236
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\cta-verify-profile'
const BASE = 'http://localhost:5173'
const WIDTHS = (process.argv[2] || '320,375,414,599,600,744,768,900,1024,1100,1280,1366,1440,1920')
  .split(',').map(Number)

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=1920,1200', 'about:blank'],
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
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id)
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)
  }
}
const ev = async (expr) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await cdp('Page.navigate', { url: `${BASE}/our-story` })
let ok = false
for (let i = 0; i < 100; i++) {
  ok = await ev(`!!document.querySelector('.ostory-cta-desc')`).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error(`story page not found at ${BASE}/our-story`)
for (let i = 0; i < 40; i++) {
  if (await ev(`document.fonts.status === 'loaded'`)) break
  await sleep(250)
}
await sleep(800)

const PROBE = `(() => {
  const r = (n) => Math.round(n * 10) / 10;
  const el = document.querySelector('.ostory-cta-desc');
  const shell = document.querySelector('.ostory-cta-inner');
  const b = el.getBoundingClientRect();
  const sb = shell.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()].filter((q) => q.width > 0);
  const tops = new Set(rects.map((q) => Math.round(q.top)));
  const inkLeft = r(Math.min(...rects.map((q) => q.left)));
  const inkRight = r(Math.max(...rects.map((q) => q.right)));
  return {
    lines: tops.size,
    boxL: r(b.left), boxR: r(b.right), boxW: r(b.width),
    shellL: r(sb.left), shellR: r(sb.right), shellW: r(sb.width),
    pageCentre: r(innerWidth / 2), boxCentre: r(b.left + b.width / 2),
    inkCentre: r((inkLeft + inkRight) / 2),
    // overflow: anything sticking out past the viewport, and the widest offender
    scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    offenders: [...document.querySelectorAll('main *')]
      .map((n) => ({ n, b: n.getBoundingClientRect() }))
      .filter((o) => o.b.width > 0 && (o.b.right > innerWidth + 1 || o.b.left < -1))
      .slice(0, 5)
      .map((o) => o.n.tagName.toLowerCase() + '.' + String(o.n.className || '').trim().split(/\\s+/)[0]
        + ' [' + r(o.b.left) + '->' + r(o.b.right) + ']'),
  };
})()`

let fail = 0
console.log('width  lines  boxW   shellW  boxCentre  pageCentre  offCentre  overflow')
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1200, deviceScaleFactor: 1, mobile: false })
  await sleep(400)
  const p = await ev(PROBE)
  const off = p.boxCentre - p.pageCentre
  const offR = Math.round(off * 10) / 10
  const over = p.scrollW > p.innerW + 1
  const single = w >= 744 ? p.lines === 1 : null
  const bad = over || Math.abs(off) > 1 || (single !== null && !single)
  if (bad) fail++
  console.log(
    `${String(w).padEnd(6)} ${String(p.lines).padEnd(6)} ${String(p.boxW).padEnd(6)} ${String(p.shellW).padEnd(7)} `
    + `${String(p.boxCentre).padEnd(10)} ${String(p.pageCentre).padEnd(11)} ${String(offR).padEnd(10)} `
    + `${over ? 'OVERFLOW ' + p.scrollW + '>' + p.innerW : 'none'}${bad ? '  <-- FAIL' : ''}`
  )
  if (over && p.offenders.length) p.offenders.forEach((o) => console.log(`      ${o}`))
}
console.log(fail ? `\n${fail} width(s) failed` : '\nall widths pass: one line from 744px, centred, no overflow')
chrome.kill()
process.exit(fail ? 1 : 0)
