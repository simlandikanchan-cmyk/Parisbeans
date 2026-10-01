// Verifies the once-per-tab-session preloader: first load in a tab plays the
// intro, a reload skips it, scroll is never locked when skipped, the hero is
// not held dimmed, and a NEW tab replays it. Also confirms a deep link with a
// query string or hash follows the same once-per-session rule.
//
// Run: node scripts/verify-preloader-once.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9247
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\preloader-once-profile'
const BASE = 'http://[::1]:5173'

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' })
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

let fails = 0
const check = (ok, msg) => { if (!ok) fails++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`) }

await cdp('Page.enable'); await cdp('Runtime.enable')

// Snapshot right after load, then again once the intro has had time to finish.
const snap = `JSON.stringify({
  present: !!document.querySelector('.preloader'),
  cls: document.querySelector('.preloader')?.className || null,
  attr: document.documentElement.dataset.preloader || null,
  flag: sessionStorage.getItem('parisbeans:preloader-played'),
  htmlOverflow: getComputedStyle(document.documentElement).overflow,
  bodyOverflow: getComputedStyle(document.body).overflow,
  heroOpacity: (() => { const h = document.querySelector('.hero');
    return h ? getComputedStyle(h).opacity : null })(),
  heroTransform: (() => { const h = document.querySelector('.hero');
    return h ? getComputedStyle(h).transform : null })(),
  tallerThanViewport: document.documentElement.scrollHeight > innerHeight + 20,
  // The site sets scroll-behavior: smooth, so a bare scrollTo(0, n) animates
  // and scrollY still reads 0 on the next line. behavior: 'instant' overrides it.
  scrollable: (() => { const before = window.scrollY;
    window.scrollTo({ top: 400, behavior: 'instant' });
    const moved = window.scrollY; window.scrollTo({ top: before, behavior: 'instant' });
    return moved > 0 })(),
})`

const load = async (url, label, expectPlay) => {
  await cdp('Page.navigate', { url: `${BASE}${url}` })
  await sleep(1400)
  const early = JSON.parse(await ev(snap))
  await sleep(3600)
  const late = JSON.parse(await ev(snap))
  console.log(`\n--- ${label}  (${url}) ---`)
  console.log(`  t+1.4s  preloader=${early.present ? early.cls : 'absent'}  attr=${early.attr}  flag=${early.flag}`)
  console.log(`  t+5.0s  preloader=${late.present ? late.cls : 'absent'}  attr=${late.attr}  htmlOverflow=${late.htmlOverflow} scrollable=${late.scrollable} tallerThanVp=${late.tallerThanViewport} heroOpacity=${late.heroOpacity}`)
  if (expectPlay) {
    check(early.present === true, 'intro is present on a first visit')
    check(late.present === false, 'intro unmounts after playing')
    check(late.attr === null, 'data-preloader cleared after the intro (scroll unlocked)')
  } else {
    check(early.present === false, 'intro is skipped on a repeat visit')
    check(early.attr === null, 'data-preloader never armed when skipped (no scroll lock)')
    check(late.htmlOverflow !== 'hidden' && late.bodyOverflow !== 'hidden',
      `page is scrollable when skipped (html ${late.htmlOverflow}, body ${late.bodyOverflow})`)
    check(late.scrollable === true, 'window actually scrolls when skipped')
    // Only pages that have a hero can be checked for the dim/offset hold.
    if (late.heroOpacity !== null)
      check(late.heroOpacity === '1' && (late.heroTransform === 'none' || late.heroTransform === 'matrix(1, 0, 0, 1, 0, 0)'),
        `hero not held dimmed/offset when skipped (opacity ${late.heroOpacity}, transform ${late.heroTransform})`)
  }
  check(late.flag === '1', 'session flag recorded')
  return late
}

console.log('\n########  Preloader once-per-tab-session  ########\n')
await load('/', 'FIRST visit in this tab', true)
await load('/', 'REFRESH (same tab, same url)', false)
await load('/menu', 'in-site navigation to /menu', false)
await load('/menu?from=nav#coffee', 'deep link with query + hash', false)
await load('/', 'back to / (still same session)', false)

// A new tab must replay it: sessionStorage is per-tab.
console.log('\n--- NEW tab (fresh sessionStorage) ---')
const t = await cdp('Target.createTarget', { url: 'about:blank' })
const attached = await cdp('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const sid = attached.sessionId
const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id; pending.set(n, { res, rej })
  ws.send(JSON.stringify({ id: n, method, params, sessionId: sid }))
})
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate', { url: `${BASE}/` })
await sleep(1500)
const r2 = await send('Runtime.evaluate', { expression: snap, returnByValue: true })
const newTab = JSON.parse(r2.result.value)
await sleep(3600)
const r3 = await send('Runtime.evaluate', { expression: snap, returnByValue: true })
const newTabLate = JSON.parse(r3.result.value)
check(newTab.present === true, 'a NEW tab replays the intro (per-tab, not per-device)')
check(newTabLate.present === false, 'new tab intro completes and unmounts')
check(newTabLate.scrollable === true, `new tab ends up scrollable (scrollable=${newTabLate.scrollable}, attr=${newTabLate.attr})`)
console.log(`  new tab: preloader=${newTab.present ? newTab.cls : 'absent'} attr=${newTabLate.attr} scrollable=${newTabLate.scrollable}`)

console.log(fails ? `\n${fails} check(s) FAILED\n` : '\nAll checks passed\n')
ws?.close(); chrome.kill(); await new Promise((r) => chrome.once('exit', r))
process.exit(fails ? 1 : 0)
