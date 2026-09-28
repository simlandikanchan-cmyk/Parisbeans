// Measures empty space in the OurStoryOrigin section across the tablet range
// (769-1024px), where the grid collapses to a single column but the circular
// image keeps its desktop clamp() width.
//
// Run: node scripts/measure-story-tablet.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9229
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-profile'
const BASE = 'http://[::1]:5173'

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
if (!ok) throw new Error('story origin section not found at ' + BASE + '/our-story')
await sleep(1200)

const PROBE = `(() => {
  const sec = document.querySelector('.ostory-origin');
  const grid = document.querySelector('.ostory-origin-grid');
  const copy = document.querySelector('.ostory-origin-copy');
  const eb = document.querySelector('.ostory-emblem-photo');
  const wrap = document.querySelector('.ostory-emblem-wrap');
  const r = (el) => { const b = el.getBoundingClientRect();
    return { x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1),
             right:+b.right.toFixed(1), bottom:+b.bottom.toFixed(1) }; };
  const sc = getComputedStyle(sec), gc = getComputedStyle(grid), wc = getComputedStyle(wrap);
  const E = r(eb), W = r(wrap), C = r(copy), S = r(sec), G = r(grid);
  return {
    vw: innerWidth,
    secH: S.h, padTop: sc.paddingTop, padBottom: sc.paddingBottom,
    gridCols: gc.gridTemplateColumns, gridGap: gc.gap,
    gridW: G.w,
    copyW: C.w, copyH: C.h,
    wrapW: W.w, imgW: E.w, imgH: E.h,
    imgX: E.x,
    // dead space either side of the image inside its wrap
    imgLeftVoid: +(E.x - W.x).toFixed(1),
    imgRightVoid: +((W.x + W.w) - E.right).toFixed(1),
    imgWidthPctOfColumn: +((E.w / W.w) * 100).toFixed(1),
    // dead space between the image and the GRID column edge (the meaningful one)
    gridLeftVoid: +(E.x - G.x).toFixed(1),
    gridRightVoid: +((G.x + G.w) - E.right).toFixed(1),
    imgPctOfGrid: +((E.w / G.w) * 100).toFixed(1),
    docOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
    // vertical gap between the copy block and the image
    gapCopyToImg: +(E.y - C.bottom).toFixed(1),
    radius: getComputedStyle(eb).borderRadius,
  };
})()`

for (const w of [360, 390, 480, 640, 768, 769, 834, 900, 1024, 1025, 1200, 1440]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(500)
  const p = await ev(PROBE)
  const tag = w <= 1024 ? 'TABLET' : 'desktop'
  console.log(`\n--- ${w}px  (${tag}) ---`)
  console.log(`  section height        : ${p.secH}px   padding ${p.padTop} / ${p.padBottom}`)
  console.log(`  grid columns          : ${p.gridCols}`)
  console.log(`  grid gap              : ${p.gridGap}`)
  console.log(`  copy block            : ${p.copyW} x ${p.copyH}`)
  console.log(`  image                 : ${p.imgW} x ${p.imgH}  radius=${p.radius}`)
  console.log(`  image width vs column : ${p.imgWidthPctOfColumn}%   (vs GRID column: ${p.imgPctOfGrid}%, dead L ${p.gridLeftVoid}px / R ${p.gridRightVoid}px)`)
  console.log(`  vertical gap copy->img: ${p.gapCopyToImg}px`)
  console.log(`  page h-overflow       : ${p.docOverflowX}   ${p.docOverflowX ? '*** REGRESSION ***' : 'ok'}`)
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
