// Regression check: the gallery hero fix is scoped to <=767px, so confirm the
// desktop and tablet compositions are byte-for-byte unchanged in geometry.
//
// Run: node scripts/check-gallery-regression.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9227
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\gal-profile3'
const PORT = 5325

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
   '--window-size=1600,1000', 'about:blank'],
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
await cdp('Page.navigate', { url: `${base}/gallery` })
for (let i = 0; i < 60; i++) {
  if (await ev(`!!document.querySelector('.gallery-track')`).catch(() => false)) break
  await sleep(300)
}
await sleep(700)

// Expected pre-existing geometry for the UNCHANGED wide layouts.
// Desktop: staggered collage, frames start at the section edge (x=0).
// Tablet (768-1024): locked full-bleed, frames start at x=0.
console.log('\nwidth    frame1.x   frame1.w   collage.x  frame1 aspect   note')
console.log('-'.repeat(74))
for (const w of [768, 834, 1024, 1280, 1440, 1920]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(500)
  const m = await ev(`(() => {
    const t = document.querySelector('.gallery-track');
    t.style.animation = 'none'; t.style.transform = 'none';
    const c = document.querySelector('.gal-hero-collage').getBoundingClientRect();
    const f = document.querySelector('.gallery-set:not(.gallery-set--loop) .gallery-image').getBoundingClientRect();
    return { cx:+c.x.toFixed(1), fx:+f.x.toFixed(1), fw:+f.width.toFixed(1), fh:+f.height.toFixed(1) };
  })()`)
  console.log(
    `${String(w).padEnd(8)} ${String(m.fx).padStart(7)}   ${String(m.fw).padStart(8)}   ${String(m.cx).padStart(8)}  ${(m.fh / m.fw).toFixed(3).padStart(12)}   ${
      Math.abs(m.fx) < 1 ? 'flush at edge (unchanged)' : 'INSETTED - REGRESSION'
    }`
  )
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
await vite.close()
