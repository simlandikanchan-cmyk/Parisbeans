// Characterises how the left inset behaves as the marquee scrolls.
// The collage is a continuously translating track, so the inset only holds at
// the start of each loop. This measures where the leftmost visible frame's edge
// actually sits at several points in the cycle.
//
// Run: node scripts/measure-gallery-scroll.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9226
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\gal-profile2'
const PORT = 5324

const { createServer: createViteServer } = await import('vite')
const vite = await createViteServer({
  configFile: './vite.config.js',
  server: { port: PORT, host: '127.0.0.1', strictPort: true },
  logLevel: 'error',
})
await vite.listen()
const base = `http://127.0.0.1:${PORT}`

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=430,932', 'about:blank'],
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
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await cdp('Page.navigate', { url: `${base}/gallery` })
for (let i = 0; i < 60; i++) {
  if (await ev(`!!document.querySelector('.gallery-track')`).catch(() => false)) break
  await sleep(300)
}
await sleep(800)

console.log('\n390px — leftmost visible frame edge through one marquee cycle\n')
console.log('  progress   leftmost visible   sliced at   peek visible')
console.log('  ' + '-'.repeat(58))

for (const pct of [0, 5, 12, 25, 40, 55, 70, 85]) {
  const out = await ev(`(() => {
    const t = document.querySelector('.gallery-track');
    const half = t.scrollWidth / 2;
    t.style.animation = 'none';
    t.style.transform = 'translate3d(' + (-half * ${pct / 100}) + 'px,0,0)';
    const figs = [...document.querySelectorAll('.gallery-set:not(.gallery-set--loop) .gallery-image')];
    const vw = innerWidth;
    const vis = figs.map(f => f.getBoundingClientRect())
                    .filter(r => r.right > 0 && r.x < vw);
    if (!vis.length) return null;
    const leftmost = vis[0];
    const main = vis[0], next = vis[1];
    return {
      leftmostLeft: +leftmost.left.toFixed(1),
      sliced: leftmost.left < -0.5,
      mainW: +main.width.toFixed(1),
      peek: next ? +(vw - Math.max(0, next.left)).toFixed(1) : 0,
    };
  })()`)
  if (!out) { console.log(`  ${String(pct).padStart(6)}%   (no frame on screen)`); continue }
  const state = out.sliced ? 'YES  x=0' : 'no   (clear)'
  console.log(`  ${String(pct).padStart(6)}%   ${String(out.leftmostLeft).padStart(10)}px   ${state.padEnd(12)} ${out.peek}px  (main w=${out.mainW})`)
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
await vite.close()
