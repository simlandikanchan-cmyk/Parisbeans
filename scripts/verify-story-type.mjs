// Reports the Our Story page type scale at every breakpoint: for each section
// that has a heading/description pair, the rendered font-size, line count and
// characters-per-line, plus whether the page picked up horizontal overflow.
// Companion to measure-origin-heading.mjs, which only covers the Origin heading.
//
// Expects 56px headings / 20px bodies across the 641-1024px tablet band, and
// each section's own existing scale outside it.
//
// Run: node scripts/verify-story-type.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9232
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-type-profile'
const BASE = 'http://[::1]:5173'

// OurStoryImageRow is deliberately absent: it is a full-bleed picture with no
// heading and no description, so there is no type scale to hold it to.
const SECTIONS = [
  { name: 'hero', title: '.ostory-title', desc: '.ostory-desc' },
  { name: 'origin', title: '.ostory-origin-title', desc: '.ostory-origin-text' },
  { name: 'cta', title: '.ostory-cta-title', desc: '.ostory-cta-desc' },
]

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
  ok = await ev(SECTIONS.every((s) => `!!document.querySelector('${s.title}') && !!document.querySelector('${s.desc}')`)).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error('one or more story sections not found')
await sleep(1200)

const PROBE = `(() => {
  // Group characters into lines by rect top.
  const linesOf = (el) => {
    const map = new Map();
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const txt = n.textContent;
      for (let i = 0; i < txt.length; i++) {
        const r = document.createRange();
        r.setStart(n, i); r.setEnd(n, i + 1);
        const rect = r.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        const key = Math.round(rect.top);
        if (!map.has(key)) map.set(key, '');
        map.set(key, map.get(key) + txt[i]);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1].replace(/\\s+/g, ' ').trim());
  };

  const SECTIONS = ${JSON.stringify(SECTIONS)};
  const out = {};
  for (const s of SECTIONS) {
    const t = document.querySelector(s.title);
    const d = document.querySelector(s.desc);
    const ts = getComputedStyle(t);
    const ds = getComputedStyle(d);
    const tl = linesOf(t);
    const dl = linesOf(d);
    out[s.name] = {
      titleSize: ts.fontSize,
      titleMaxW: ts.maxWidth,
      titleLines: tl.length,
      titleCpl: tl.length ? Math.round(tl[0].length) : 0,
      descSize: ds.fontSize,
      descMaxW: ds.maxWidth,
      descLines: dl.length,
      descCpl: dl.length ? Math.round(dl[0].length) : 0,
    };
  }
  return {
    vw: innerWidth,
    sections: out,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    scrollW: document.documentElement.scrollWidth,
  };
})()`

console.log('\n########  Our Story page type scale  ########\n')
for (const w of [360, 480, 640, 641, 700, 768, 834, 900, 1024, 1025, 1200, 1440]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(450)
  const p = await ev(PROBE)
  const band = w <= 640 ? 'phone' : w <= 1024 ? 'TABLET' : 'desktop'
  const isTablet = band === 'TABLET'
  console.log(`--- ${w}px (${band})${band === 'phone' ? '' : ''} ---`)
  for (const s of SECTIONS) {
    const v = p.sections[s.name]
    const tOk = !isTablet || v.titleSize === '56px'
    const dOk = !isTablet || v.descSize === '20px'
    const flag = (ok) => (ok ? '' : '   <-- MISMATCH')
    console.log(`  ${s.name.padEnd(7)} h2 ${v.titleSize.padEnd(7)} ${v.titleLines} lines ~${String(v.titleCpl).padStart(2)} chars  max-w ${String(v.titleMaxW).padEnd(8)}${flag(tOk)}`)
    console.log(`  ${''.padEnd(7)} p  ${v.descSize.padEnd(7)} ${v.descLines} lines ~${String(v.descCpl).padStart(2)} chars  max-w ${String(v.descMaxW).padEnd(8)}${flag(dOk)}`)
  }
  console.log(`  overflow-x: ${p.overflowX}${p.overflowX ? `  (scrollWidth ${p.scrollW} > ${p.vw})   <-- PAGE SCROLLS SIDEWAYS` : ''}`)
  console.log('')
}

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
