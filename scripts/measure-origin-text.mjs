// Measures the origin copy block: heading width vs paragraph width, the dead
// space to the right of the paragraphs, and characters per line. Optionally
// previews a candidate CSS block so both can be compared in one session.
//
// Run: node scripts/measure-origin-text.mjs [widths] [candidateCssFile]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { readFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9233
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\origin-text-profile'
const BASE = 'http://localhost:5173'

const WIDTHS = (process.argv[2] || '641,768,834,900,1023').split(',').map(Number)
const CANDIDATE = process.argv[3] ? readFileSync(process.argv[3], 'utf8') : ''

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
  ok = await ev(`!!document.querySelector('.ostory-origin-copy')`).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error('story page not found at ' + BASE + '/our-story')
await sleep(1500)

const PROBE = `(() => {
  const r = (n) => Math.round(n * 10) / 10;
  const copy = document.querySelector('.ostory-origin-copy');
  const grid = document.querySelector('.ostory-origin-grid');
  const title = document.querySelector('.ostory-origin-title');
  const texts = [...document.querySelectorAll('.ostory-origin-text')];
  const box = (el) => { const b = el.getBoundingClientRect(); return { x: r(b.x), w: r(b.width), right: r(b.right) }; };
  // characters per rendered line, from the client's per-line rects
  const perLine = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((q) => q.width > 0);
    const tops = new Set(rects.map((q) => Math.round(q.top)));
    const text = el.textContent.replace(/\\s+/g, ' ').trim();
    return { lines: tops.size, approxCharsPerLine: Math.round(text.length / tops.size) };
  };
  return {
    grid: box(grid), copy: box(copy), title: box(title),
    copyDisplay: getComputedStyle(copy).display,
    texts: texts.map((el) => ({ ...box(el), ...perLine(el) })),
    copyRightVoid: r(box(copy).right - Math.max(...texts.map((el) => box(el).right))),
    titleVsTextVoid: r(box(title).right - Math.max(...texts.map((el) => box(el).right))),
  };
})()`

const setCandidate = (on) => ev(`(() => {
  let el = document.getElementById('candidate');
  if (${on}) {
    if (!el) { el = document.createElement('style'); el.id = 'candidate'; document.head.appendChild(el); }
    el.textContent = ${JSON.stringify(CANDIDATE)};
  } else if (el) { el.remove(); }
  return true;
})()`)

const show = (label, p) => {
  console.log(`  ${label}`)
  console.log(`    grid ${p.grid.w}  copy ${p.copy.w} (display ${p.copyDisplay})  title ${p.title.w}`)
  p.texts.forEach((t, i) =>
    console.log(`    text[${i}] w=${t.w} right=${t.right} lines=${t.lines} ~${t.approxCharsPerLine} chars/line`))
  console.log(`    dead space right of text vs copy right : ${p.copyRightVoid}px`)
  console.log(`    step  title right vs text right        : ${p.titleVsTextVoid}px`)
}

for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(400)
  if (CANDIDATE) {
    await setCandidate(false); await sleep(350)
    const before = await ev(PROBE)
    await setCandidate(true); await sleep(350)
    const after = await ev(PROBE)
    console.log(`\n=== ${w}px ===`)
    show('CURRENT', before)
    show('WITH CANDIDATE CSS', after)
  } else {
    await sleep(350)
    console.log(`\n=== ${w}px ===`)
    show('CURRENT', await ev(PROBE))
  }
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
