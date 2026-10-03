// Reports the Our Story page type scale at every breakpoint: for each section
// that has a label/heading/description set, the rendered font-size, line count
// and characters-per-line, plus whether the page picked up horizontal overflow.
// Companion to measure-origin-heading.mjs, which only covers the Origin heading.
//
// Expects the shared tablet scale across the 600-1099px band — 13px labels
// (--ostory-tablet-eyebrow), 52px headings (--ostory-tablet-heading, capped) and
// 20px descriptions (--ostory-tablet-desc) on all three sections — and each
// section's own existing scale outside it.
//
// Run: node scripts/verify-story-type.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9232
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-type-profile'
const BASE = 'http://[::1]:5173'

// OurStoryImageRow is deliberately absent: it is a full-bleed picture with no
// heading, no label and no description, so there is no type scale to hold it to.
const SECTIONS = [
  { name: 'hero', label: '.ostory-hero .ostory-eyebrow', title: '.ostory-title', desc: '.ostory-desc' },
  { name: 'origin', label: '.ostory-origin .ostory-eyebrow', title: '.ostory-origin-title', desc: '.ostory-origin-text' },
  { name: 'cta', label: '.ostory-cta .ostory-eyebrow', title: '.ostory-cta-title', desc: '.ostory-cta-desc' },
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
  ok = await ev(SECTIONS.map((s) => `!!document.querySelector('${s.label}') && !!document.querySelector('${s.title}') && !!document.querySelector('${s.desc}')`).join(' && ')).catch(() => false)
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
    const l = document.querySelector(s.label);
    const ts = getComputedStyle(t);
    const ds = getComputedStyle(d);
    const ls2 = getComputedStyle(l);
    const tl = linesOf(t);
    const dl = linesOf(d);
    out[s.name] = {
      labelSize: ls2.fontSize,
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

// The tablet band's own edges, from the canonical scale in global.css. It is
// 600-1099px: 1099 is the last tablet width, so 1025-1099 is tablet landscape
// and is checked like the rest of the band, not written off as desktop.
const TABLET_MIN = 600
const TABLET_MAX = 1099

// --ostory-tablet-heading is clamp(42px, 7vw, 52px): the floor holds from 600
// to 600px (7vw is 42 at the band's own floor), the ramp runs to the 52px cap
// at 743px, and the value is flat above it. Comparing against a hardcoded 52px
// flags the 600-742px ramp as a mismatch when it is the token working.
const expectedHeading = (w) => `${Math.min(52, Math.max(42, w * 0.07)).toFixed(2).replace(/\.?0+$/, '')}px`

console.log('\n########  Our Story page type scale  ########\n')
for (const w of [360, 480, 599, 600, 640, 700, 768, 834, 900, 1023, 1024, 1025, 1099, 1100, 1200, 1440]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(450)
  const p = await ev(PROBE)
  const band = w < TABLET_MIN ? 'phone' : w <= TABLET_MAX ? 'TABLET' : 'desktop'
  const isTablet = band === 'TABLET'
  console.log(`--- ${w}px (${band}) ---`)
  const wantTitle = expectedHeading(w)
  const flag = (ok, want) => (ok ? '' : `   <-- MISMATCH (want ${want})`)
  for (const s of SECTIONS) {
    const v = p.sections[s.name]
    const lOk = !isTablet || v.labelSize === '13px'
    const tOk = !isTablet || v.titleSize === wantTitle
    const dOk = !isTablet || v.descSize === '20px'
    console.log(`  ${s.name.padEnd(7)} label ${v.labelSize.padEnd(7)}${flag(lOk, '13px')}`)
    console.log(`  ${''.padEnd(7)} h2    ${v.titleSize.padEnd(7)} ${v.titleLines} lines ~${String(v.titleCpl).padStart(2)} chars  max-w ${String(v.titleMaxW).padEnd(8)}${flag(tOk, wantTitle)}`)
    console.log(`  ${''.padEnd(7)} p     ${v.descSize.padEnd(7)} ${v.descLines} lines ~${String(v.descCpl).padStart(2)} chars  max-w ${String(v.descMaxW).padEnd(8)}${flag(dOk, '20px')}`)
  }
  // The three labels are one token in the band, so a disagreement between them
  // is the failure worth naming even where the shared value itself is right.
  const labelSizes = [...new Set(SECTIONS.map((s) => p.sections[s.name].labelSize))]
  if (isTablet && labelSizes.length > 1) {
    console.log(`  <-- LABELS DISAGREE across the band: ${labelSizes.join(' / ')}`)
  }
  console.log(`  overflow-x: ${p.overflowX}${p.overflowX ? `  (scrollWidth ${p.scrollW} > ${p.vw})   <-- PAGE SCROLLS SIDEWAYS` : ''}`)
  console.log('')
}

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
