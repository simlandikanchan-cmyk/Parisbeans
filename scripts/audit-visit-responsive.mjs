// Responsive audit for /visit-contact.
// Finds horizontal overflow, clipped/overflowing boxes, and measures the
// page's key blocks across the canonical breakpoint scale.
//
// Run: node scripts/audit-visit-responsive.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9234
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\visit-profile'
const BASE = 'http://[::1]:5173'

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=1440,1000', 'about:blank'],
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
await cdp('Network.enable')
await cdp('Network.setCacheDisabled', { cacheDisabled: true })
await cdp('Page.navigate', { url: `${BASE}/visit-contact` })
let ok = false
for (let i = 0; i < 100; i++) {
  ok = await ev(`!!document.querySelector('.visit-contact-grid')`).catch(() => false)
  if (ok) break
  await sleep(300)
}
if (!ok) throw new Error('visit page not found at ' + BASE + '/visit-contact')
await cdp('Page.reload', { ignoreCache: true })
for (let i = 0; i < 100; i++) {
  if (await ev(`!!document.querySelector('.visit-contact-grid')`).catch(() => false)) break
  await sleep(300)
}
await sleep(1800)

const PROBE = `(() => {
  const r = (el) => { const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
             right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
  const q = (s) => document.querySelector(s);
  const info = (sel) => { const el = q(sel); if (!el) return { sel, missing: true };
    const b = r(el); const cs = getComputedStyle(el);
    return { sel, ...b, cssW: cs.width, scrollW: el.scrollWidth, clientW: el.clientWidth,
             overflowX: el.scrollWidth - el.clientWidth, whiteSpace: cs.whiteSpace,
             text: (el.textContent || '').trim().slice(0, 40) }; };

  // Any element whose content is wider than its own box => clipped
  const clipped = [];
  for (const el of document.querySelectorAll('main *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (cs.overflow === 'visible' && cs.overflowX === 'visible') continue;
    const dx = el.scrollWidth - el.clientWidth;
    if (dx > 1) clipped.push({ sel: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'),
                               dx, clientW: el.clientWidth, scrollW: el.scrollWidth,
                               text: (el.textContent || '').trim().slice(0, 40) });
  }

  // Elements extending past the right edge of the viewport
  const pastRight = [];
  for (const el of document.querySelectorAll('main *')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    if (b.right > innerWidth + 1) pastRight.push({ sel: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'),
      right: +b.right.toFixed(1), w: +b.width.toFixed(1), over: +(b.right - innerWidth).toFixed(1),
      text: (el.textContent || '').trim().slice(0, 40) });
  }

  const fields = [...document.querySelectorAll('.visit-form [name]')].map(el => ({
    name: el.name, tag: el.tagName.toLowerCase(), ph: el.placeholder, required: el.required,
  }));

  return {
    vw: innerWidth,
    docW: document.documentElement.scrollWidth,
    bodyW: +document.body.getBoundingClientRect().width.toFixed(1),
    hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    textareas: document.querySelectorAll('.visit-form textarea').length,
    fields,
    nodes: ['.visit-hero', '.visit-hero-copy', '.visit-hero-title', '.visit-hero-desc',
            '.visit-contact', '.visit-contact-grid', '.visit-card', '.visit-form',
            '.visit-map-wrap', '.visit-info-footer', '.visit-social',
            '.visit-cta', '.visit-cta-content', '.visit-cta-title', '.visit-cta-desc'].map(info),
    clipped: clipped.slice(0, 14),
    pastRight: pastRight.slice(0, 14),
  };
})()`

const WIDTHS = [320, 360, 390, 414, 480, 560, 600, 640, 767, 768, 820, 900, 1023, 1024, 1099, 1100, 1280, 1440, 1600, 1920]
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(420)
  const p = await ev(PROBE)
  const tag = w <= 767 ? 'PHONE' : w <= 1099 ? 'TABLET' : 'DESKTOP'
  console.log(`\n======== ${w}px  (${tag}) ========`)
  console.log(`  h-overflow ${p.hOverflow ? '*** YES  docW=' + p.docW + ' ***' : 'no'}   bodyW=${p.bodyW}   textareas=${p.textareas}`)
  if (p.textareas > 1) console.log(`  *** DUPLICATE TEXTAREA: ${p.textareas} found — names: ${p.fields.filter(f=>f.tag==='textarea').map(f=>f.name+'("'+f.ph+'")').join(', ')}`)
  for (const n of p.nodes) {
    if (n.missing) { console.log(`  ${n.sel.padEnd(24)} MISSING`); continue }
    const over = n.overflowX > 1 ? `  <<< clipped ${n.overflowX}px` : ''
    const off = n.right > p.vw + 1 ? `  <<< past right by ${(n.right - p.vw).toFixed(1)}px` : ''
    console.log(`  ${n.sel.padEnd(24)} x=${String(n.x).padStart(7)} w=${String(n.w).padStart(7)} h=${String(n.h).padStart(7)} ws=${n.whiteSpace}${over}${off}`)
  }
  if (p.pastRight.length) {
    console.log(`  PAST RIGHT EDGE (${p.pastRight.length}):`)
    for (const n of p.pastRight) console.log(`     ${n.sel}  right=${n.right} over=${n.over}  "${n.text}"`)
  }
  if (p.clipped.length) {
    console.log(`  CLIPPED BOXES (${p.clipped.length}):`)
    for (const n of p.clipped) console.log(`     ${n.sel}  +${n.dx}px  client=${n.clientW} scroll=${n.scrollW}  "${n.text}"`)
  }
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
