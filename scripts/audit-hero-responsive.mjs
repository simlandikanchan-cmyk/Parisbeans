// Responsive audit for the homepage hero (.hero / .hero-copy).
// Detects horizontal overflow, clipped boxes, hero copy overflowing the hero
// box (which used to collide with the next section), and vertical overlap
// between the hero and its following sibling.
// Run: node scripts/audit-hero-responsive.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9241
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\hero-profile'
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
await cdp('Page.navigate', { url: `${BASE}/` })
for (let i = 0; i < 100; i++) {
  if (await ev(`!!document.querySelector('.hero')`).catch(() => false)) break
  await sleep(300)
}
await sleep(2000)

const PROBE = `(() => {
  const r = (el) => { const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
             right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
  const q = (s) => document.querySelector(s);
  const info = (sel) => { const el = q(sel); if (!el) return { sel, missing: true };
    const b = r(el); const cs = getComputedStyle(el);
    return { sel, ...b, scrollW: el.scrollWidth, clientW: el.clientWidth,
             overflowX: el.scrollWidth - el.clientWidth, whiteSpace: cs.whiteSpace,
             fontSize: cs.fontSize, text: (el.textContent || '').trim().slice(0, 34) }; };

  const hero = q('.hero');
  const heroBox = r(hero);
  // force reveals so we measure final (settled) layout, not the entrance state
  hero.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible'));
  hero.classList.add('is-visible');
  const title = q('.hero-title');
  if (title) title.classList.add('is-visible');

  const copy = q('.hero-copy');
  const copyBox = copy ? r(copy) : null;
  // Copy bottom vs hero bottom => negative means content spills past the hero
  const copySpill = copyBox ? +(copyBox.bottom - heroBox.bottom).toFixed(1) : null;

  const nextEl = hero.nextElementSibling;
  const nextBox = nextEl ? r(nextEl) : null;
  const nextOverlap = nextBox ? +(heroBox.bottom - nextBox.y).toFixed(1) : null;

  const clipped = [];
  for (const el of hero.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (cs.overflow === 'visible' && cs.overflowX === 'visible') continue;
    const dx = el.scrollWidth - el.clientWidth;
    if (dx > 1) clipped.push({ sel: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'),
      dx, clientW: el.clientWidth, scrollW: el.scrollWidth,
      text: (el.textContent || '').trim().slice(0, 34) });
  }

  const pastRight = [];
  for (const el of hero.querySelectorAll('*')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    if (b.right > innerWidth + 1) pastRight.push({ sel: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'),
      right: +b.right.toFixed(1), over: +(b.right - innerWidth).toFixed(1),
      text: (el.textContent || '').trim().slice(0, 34) });
  }

  // Do any two hero text blocks visually overlap each other vertically?
  const blocks = [...hero.querySelectorAll('.hero-eyebrow, .hero-title, .hero-divider, .hero-desc, .hero-actions')];
  const boxes = blocks.map((e) => ({ sel: e.className.split(' ')[0], ...r(e) }));
  const collisions = [];
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      if (boxes[i].bottom > boxes[j].y + 1 && boxes[j].bottom > boxes[i].y + 1)
        collisions.push(boxes[i].sel + ' <-> ' + boxes[j].sel);

  return {
    vw: innerWidth, vh: innerHeight,
    docW: document.documentElement.scrollWidth,
    hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    heroBox, copySpill, nextOverlap,
    nodes: ['.hero', '.hero-content', '.hero-copy', '.hero-eyebrow-wrap', '.hero-title',
            '.hero-title-line-inner', '.hero-desc', '.hero-actions',
            '.hero-actions .btn--primary', '.hero-actions .btn--ghost'].map(info),
    blocks: boxes, collisions, clipped: clipped.slice(0, 12), pastRight: pastRight.slice(0, 12),
  };
})()`

const WIDTHS = [320, 360, 375, 390, 414, 480, 560, 600, 767, 768, 900, 1024, 1280, 1440, 1920]
let bad = 0
for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 844, deviceScaleFactor: 1, mobile: w < 768 })
  await sleep(450)
  const p = await ev(PROBE)
  const tag = w <= 767 ? 'PHONE' : w <= 1099 ? 'TABLET' : 'DESKTOP'
  const probs = []
  if (p.hOverflow) probs.push(`H-OVERFLOW docW=${p.docW}`)
  if (p.copySpill > 1) probs.push(`COPY SPILLS HERO by ${p.copySpill}px`)
  if (p.nextOverlap > 1) probs.push(`OVERLAPS NEXT SECTION by ${p.nextOverlap}px`)
  if (p.collisions.length) probs.push(`COLLISION: ${p.collisions.join(', ')}`)
  if (p.clipped.length) probs.push(`CLIPPED x${p.clipped.length}`)
  if (p.pastRight.length) probs.push(`PAST RIGHT x${p.pastRight.length}`)
  if (probs.length) bad++
  console.log(`\n======== ${w}px  (${tag}) ========  ${probs.length ? '*** ' + probs.join(' | ') + ' ***' : 'clean'}`)
  console.log(`  hero h=${p.heroBox.h} copySpill=${p.copySpill} nextOverlap=${p.nextOverlap} docW=${p.docW}`)
  for (const n of p.nodes) {
    if (n.missing) { console.log(`  ${n.sel.padEnd(28)} MISSING`); continue }
    const over = n.overflowX > 1 ? `  <<< clipped ${n.overflowX}px` : ''
    const off = n.right > p.vw + 1 ? `  <<< past right ${(n.right - p.vw).toFixed(1)}px` : ''
    console.log(`  ${n.sel.padEnd(28)} x=${String(n.x).padStart(7)} w=${String(n.w).padStart(7)} h=${String(n.h).padStart(7)} fs=${n.fontSize} ws=${n.whiteSpace}${over}${off}`)
  }
  if (p.pastRight.length) for (const n of p.pastRight) console.log(`     PAST RIGHT ${n.sel} +${n.over}px "${n.text}"`)
  if (p.clipped.length) for (const n of p.clipped) console.log(`     CLIPPED ${n.sel} +${n.dx}px (${n.clientW}<${n.scrollW}) "${n.text}"`)
}
console.log(`\n>>> ${bad}/${WIDTHS.length} widths with issues\n`)

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))