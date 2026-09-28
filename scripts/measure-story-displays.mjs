// Reports the computed display of every element on /our-story, so "is every
// section container on flex?" can be answered from the DOM instead of guessed.
//
// Run: node scripts/measure-story-displays.mjs [widths]
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9234
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-display-profile'
const BASE = 'http://localhost:5173'

const WIDTHS = (process.argv[2] || '768,834,900,1023').split(',').map(Number)

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
if (!ok) throw new Error('story page not found at ' + BASE + '/our-story')
await sleep(1500)

// Only the story feature's own markup, header/footer excluded.
const PROBE = `(() => {
  const walk = (root) => {
    const rows = [];
    for (const el of root.querySelectorAll('*')) {
      if (!el.className || typeof el.className !== 'string') continue;
      if (!el.className.includes('ostory-')) continue;
      if (el.closest('header, footer, nav')) continue;
      const cs = getComputedStyle(el);
      rows.push([
        el.tagName.toLowerCase(),
        el.className.trim().split(/\\s+/).join('.'),
        cs.display,
        cs.flexDirection,
      ].join('  '));
    }
    return rows;
  };
  const main = document.querySelector('main') || document.body;
  return walk(main);
})()`

for (const w of WIDTHS) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
  await sleep(500)
  const rows = await ev(PROBE)
  console.log(`\n=== ${w}px ===`)
  for (const r of rows) console.log('  ' + r)
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
