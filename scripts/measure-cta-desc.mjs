// Measures .ostory-cta-desc on /our-story: current box, rendered line count,
// the width one unbroken line actually needs, and how much room the section
// shell offers at each viewport width.
//
// Run: node scripts/measure-cta-desc.mjs [widths]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9234
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\cta-desc-profile'
const BASE = 'http://localhost:5173'

const WIDTHS = (process.argv[2] || '599,600,744,768,900,1023,1024,1099,1100,1280,1366,1440,1920')
  .split(',').map(Number)

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=1920,1000', 'about:blank'],
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
await sleep(1500)

const PROBE = `(() => {
  const r = (n) => Math.round(n * 10) / 10;
  const el = document.querySelector('.ostory-cta-desc');
  const shell = document.querySelector('.ostory-cta-inner');
  const cs = getComputedStyle(el);
  const lineCount = () => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((q) => q.width > 0);
    return new Set(rects.map((q) => Math.round(q.top))).size;
  };
  const out = {
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, maxWidth: cs.maxWidth,
    boxW: r(el.getBoundingClientRect().width), shellW: r(shell.getBoundingClientRect().width),
    lines: lineCount(), text: el.textContent.replace(/\\s+/g, ' ').trim(),
  };
  // width one unbroken line needs at the current font-size, without letting it
  // affect layout: clone off-screen, nowrap, and read it back
  const probe = el.cloneNode(true);
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;white-space:nowrap;max-width:none;width:auto';
  document.body.appendChild(probe);
  out.oneLineW = r(probe.getBoundingClientRect().width);
  probe.remove();
  out.fitsNow = out.oneLineW <= out.boxW + 0.5;
  return out;
})()`

const pad = (s, n) => String(s).padEnd(n)
console.log(`${pad('vw', 6)}${pad('font', 9)}${pad('max-w', 10)}${pad('box w', 9)}${pad('shell w', 10)}${pad('1-line w', 11)}lines  fits`)
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(450)
  const p = await ev(PROBE)
  console.log(
    `${pad(w, 6)}${pad(p.fontSize, 9)}${pad(p.maxWidth, 10)}${pad(p.boxW, 9)}${pad(p.shellW, 10)}${pad(p.oneLineW, 11)}${pad(p.lines, 6)}${p.fitsNow ? 'yes' : 'NO'}`
  )
}
console.log(`\ntext: ${(await ev(PROBE)).text}`)
chrome.kill()
