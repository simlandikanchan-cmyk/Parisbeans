// Ground-truth measurement for .ostory-cta-desc: how wide is the text really,
// per rendered line, and does it fit its own box?
//
// Run: node scripts/measure-cta-lines.mjs [widths]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9235
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\cta-lines-profile'
const BASE = 'http://localhost:5173'
const WIDTHS = (process.argv[2] || '599,600,768,1024,1100,1440,1920').split(',').map(Number)

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
// wait for the webfont, or every width below is measured against the fallback
for (let i = 0; i < 40; i++) {
  if (await ev(`document.fonts.status === 'loaded'`)) break
  await sleep(250)
}
await sleep(800)

const PROBE = `(() => {
  const r = (n) => Math.round(n * 10) / 10;
  const el = document.querySelector('.ostory-cta-desc');
  const cs = getComputedStyle(el);
  const text = el.textContent.replace(/\\s+/g, ' ').trim();

  // per rendered line, from client rects
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()].filter((q) => q.width > 0);
  const byTop = new Map();
  for (const q of rects) {
    const k = Math.round(q.top);
    if (!byTop.has(k)) byTop.set(k, { top: k, left: r(q.left), right: r(q.right), w: 0 });
    const e = byTop.get(k);
    e.left = Math.min(e.left, r(q.left));
    e.right = Math.max(e.right, r(q.right));
  }
  const lines = [...byTop.values()].sort((a, b) => a.top - b.top).map((e) => ({ ...e, w: r(e.right - e.left) }));

  // widest single line this text can produce, via canvas in the resolved font
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const measure = (s) => r(ctx.measureText(s).width);

  // greedy wrap at the element's content width, to see how many lines it needs
  const contentW = r(el.clientWidth);
  const wrapAt = (limit) => {
    const words = text.split(' ');
    let n = 1, cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (measure(t) > limit && cur) { n++; cur = w } else cur = t;
    }
    return n;
  };

  return {
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight, maxWidth: cs.maxWidth, whiteSpace: cs.whiteSpace,
    boxW: r(el.getBoundingClientRect().width), clientW: contentW,
    lines,
    fullTextW: measure(text),
    firstWordThrough: measure('It is a small Parisian ritual built into your HAIR RAP BY YOYO'),
    fontsLoaded: document.fonts.status,
    fitsContent: measure(text) <= contentW + 0.5,
    linesIf600: wrapAt(600), linesIf700: wrapAt(700), linesIf760: wrapAt(760),
    linesIf820: wrapAt(820), linesIf900: wrapAt(900),
  };
})()`

const pad = (s, n) => String(s).padEnd(n)
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1200, deviceScaleFactor: 1, mobile: false })
  await sleep(450)
  const p = await ev(PROBE)
  console.log(`\n=== ${w}px ===  fonts:${p.fontsLoaded}`)
  console.log(`  ${p.fontSize} / lh ${p.lineHeight} / ${p.fontWeight} / ws:${p.whiteSpace} / max-w ${p.maxWidth}`)
  console.log(`  box ${p.boxW}  content ${p.clientW}  rendered lines ${p.lines.length}`)
  p.lines.forEach((l, i) => console.log(`    line ${i + 1}: w=${l.w}  [${l.left} -> ${l.right}]`))
  console.log(`  full text needs ${p.fullTextW}px at this size  -> fits content box: ${p.fitsContent ? 'yes' : 'NO'}`)
  console.log(`  lines needed at width 600/700/760/820/900 : ${p.linesIf600} / ${p.linesIf700} / ${p.linesIf760} / ${p.linesIf820} / ${p.linesIf900}`)
}
chrome.kill()
