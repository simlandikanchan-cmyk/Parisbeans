// Reports how the OurStoryOrigin h2 wraps at every breakpoint: rendered line
// count, the text on each line, the box width and font-size. Used to confirm the
// tablet 2-line break without disturbing phone or desktop.
//
// Run: node scripts/measure-origin-heading.mjs [--label "..."]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9230
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\heading-profile'
const BASE = 'http://[::1]:5173'
const LABEL = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'current'

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
  ok = await ev(`!!document.querySelector('.ostory-origin-title')`).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error('heading not found')
await sleep(1200)

const PROBE = `(() => {
  const h = document.querySelector('.ostory-origin-title');
  const cs = getComputedStyle(h);
  const box = h.getBoundingClientRect();

  // Group every character into lines by its rect top.
  const lines = new Map();
  const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = n.textContent;
    for (let i = 0; i < t.length; i++) {
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, i + 1);
      const rect = r.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      const key = Math.round(rect.top);
      if (!lines.has(key)) lines.set(key, '');
      lines.set(key, lines.get(key) + t[i]);
    }
  }
  const rendered = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1].replace(/\\s+/g, ' ').trim());

  // Natural width of the two target lines in the same font.
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' / ' + cs.lineHeight + ' ' + cs.fontFamily;
  const w1 = ctx.measureText('From a Parisian Feeling').width;
  const w2 = ctx.measureText('to a Salon Experience.').width;

  return {
    vw: innerWidth,
    boxW: +box.width.toFixed(1),
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    maxWidth: cs.maxWidth,
    lineCount: rendered.length,
    rendered,
    need1: +w1.toFixed(1),
    need2: +w2.toFixed(1),
    fits: w1 <= box.width && w2 <= box.width,
  };
})()`

console.log(`\n########  ${LABEL}  ########\n`)
for (const w of [360, 390, 480, 640, 768, 834, 900, 1024, 1200, 1440]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(450)
  const p = await ev(PROBE)
  const band = w <= 640 ? 'phone' : w <= 1024 ? 'TABLET' : 'desktop'
  console.log(`--- ${w}px (${band}) ---`)
  console.log(`  box ${p.boxW}px  font ${p.fontSize}/${p.lineHeight}  max-width ${p.maxWidth}`)
  console.log(`  LINES (${p.lineCount}):`)
  p.rendered.forEach((l, i) => console.log(`     ${i + 1}. "${l}"`))
  console.log(`  target line widths needed: "${p.need1}px" / "${p.need2}px"  -> both fit in box: ${p.fits}`)
  console.log('')
}

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
