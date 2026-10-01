// Captures the mobile menu drawer open at each target viewport, plus a desktop
// shot to confirm the desktop nav is untouched. PNGs land in scripts/shots/.
//
// Run: node scripts/shoot-menu-drawer.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9238
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\menu-shot-profile'
const BASE = 'http://[::1]:5173'
const OUT = 'scripts/shots'
mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ws, id = 0
const pending = new Map()
const cdp = (m, p = {}) => new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method: m, params: p })) })
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const t = l.find((x) => x.type === 'page'); if (t?.webSocketDebuggerUrl) { ws = new WebSocket(t.webSocketDebuggerUrl); break } } catch {}
  await sleep(250) }
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
ws.onmessage = (e) => { const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result) } }
const ev = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value }
const shot = async (name) => {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'))
  console.log('  wrote', `${OUT}/${name}.png`)
}

await cdp('Page.enable'); await cdp('Runtime.enable')

for (const [w, h, label] of [[390, 844, 'menu-390x844'], [360, 640, 'menu-360x640']]) {
  await cdp('Page.navigate', { url: `${BASE}/menu` })
  for (let i = 0; i < 60; i++) {
    if (await ev(`!!document.querySelector('.menu-toggle') && !document.querySelector('.preloader')`).catch(() => false)) break
    await sleep(300)
  }
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true })
  await sleep(600)
  await shot(`${label}-closed`)
  await ev(`document.querySelector('.menu-toggle:not(.close)').click()`)
  await sleep(1400)
  await shot(`${label}-open`)
}

// Desktop: nav must be intact and the drawer must not exist.
await cdp('Page.navigate', { url: `${BASE}/` })
for (let i = 0; i < 60; i++) {
  if (await ev(`!!document.querySelector('.nav-left') && !document.querySelector('.preloader')`).catch(() => false)) break
  await sleep(300)
}
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await sleep(700)
console.log('  desktop nav links visible:', await ev(`[...document.querySelectorAll('.nav-left .nav-link')]
  .filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.textContent).join(' | ')`))
console.log('  hamburger hidden at 1440:', await ev(`(() => { const b = document.querySelector('.menu-toggle:not(.close)');
  return !b || getComputedStyle(b).display === 'none' })()`))
await shot('desktop-1440')

ws?.close(); chrome.kill(); await new Promise((r) => chrome.once('exit', r))
