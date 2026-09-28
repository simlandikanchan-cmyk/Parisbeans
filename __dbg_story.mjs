import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9233
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\story-dbg'
const BASE = 'http://[::1]:5173'

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--window-size=1100,1000', 'about:blank'], { stdio: 'ignore' })
let ws, id = 0
const pending = new Map()
const cdp = (m, p = {}) => new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method: m, params: p })) })
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
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Page.navigate', { url: `${BASE}/our-story` })
await sleep(6000)

console.log('url      :', await ev('location.href'))
console.log('title    :', await ev('document.title'))
console.log('bodyLen  :', await ev('document.body.innerHTML.length'))
console.log('h1 text  :', JSON.stringify(await ev(`document.querySelector('h1')?.innerText ?? null`)))
console.log('h2 count :', await ev(`document.querySelectorAll('h2').length`))
console.log('classes  :', JSON.stringify(await ev(`[...document.querySelectorAll('h1,h2')].map(e=>e.className)`)))
console.log('ostory   :', JSON.stringify(await ev(`[...document.querySelectorAll('[class*=ostory]')].map(e=>e.className).slice(0,40)`)))
console.log('bodyHead :', JSON.stringify(await ev(`document.body.innerText.slice(0,300)`)))

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
