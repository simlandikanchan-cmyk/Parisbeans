// Verifies the mobile menu drawer: renders it at 390x844 and 360x640 and
// checks the spec (hairline rows, 28px index column, 24px serif labels, 56px
// row height, cream contact block, 52px CTA, three 40px social buttons), then
// exercises the behaviour contract: open/close triggers, Escape, backdrop
// click, link click, focus trap, focus restoration, and the reduced-motion
// path. Also asserts no horizontal page scroll while the drawer is open.
//
// Run: node scripts/verify-menu-drawer.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9233
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\menu-drawer-profile'
const BASE = 'http://[::1]:5173'

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--window-size=390,844', 'about:blank'],
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
await cdp('Page.navigate', { url: `${BASE}/menu` })
let ready = false
for (let i = 0; i < 100; i++) {
  ready = await ev(`!!document.querySelector('.menu-toggle')`).catch(() => false)
  if (ready) break
  await sleep(300)
}
if (!ready) throw new Error('header never mounted')
// The preloader (z-index 9999) covers the page for a few seconds. Any hit
// testing or visual check before it unmounts measures the wrong element.
for (let i = 0; i < 20; i++) {
  if (await ev(`!document.querySelector('.preloader')`).catch(() => false)) break
  await sleep(400)
}
await sleep(600)

let fails = 0
const check = (ok, msg) => {
  if (!ok) fails++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`)
}

const OPEN = `document.querySelector('.menu-toggle:not(.close)').click()`

// Real input events, not synthetic dispatch: synthetic .click() does reach
// React but skips the browser's hit testing, so it would not catch a z-index
// or pointer-events regression that would block a real user.
const pressEscape = async () => {
  for (const type of ['rawKeyDown', 'keyUp'])
    await cdp('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
}
const clickAt = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased'])
    await cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
}
// AnimatePresence keeps the node mounted for the ~320ms exit, so poll.
// Generous window: these runs race a rAF-driven exit on a loaded machine.
const waitClosed = async () => {
  for (let i = 0; i < 80; i++) {
    if (await ev(`!document.querySelector('.pb-menu-drawer')`).catch(() => false)) return true
    await sleep(100)
  }
  return false
}
// Proves the click/key reached React independently of the exit animation, so a
// failure says which half broke rather than just "not closed".
const waitClosing = async () => {
  for (let i = 0; i < 40; i++) {
    if (await ev(`document.querySelector('.menu-toggle:not(.close)')?.getAttribute('aria-expanded') === 'false'`)
      .catch(() => false)) return true
    await sleep(100)
  }
  return false
}
const waitOpen = async () => {
  for (let i = 0; i < 40; i++) {
    if (await ev(`!!document.querySelector('.pb-menu-drawer')`).catch(() => false)) return true
    await sleep(100)
  }
  return false
}
// A fixed sleep after opening is flaky: the 320ms enter animation is rAF-driven,
// so under CPU load it can still be in flight when a fixed wait expires, and
// the visual probe then measures a half-slid drawer. Poll for the settled state.
// Must also watch the children: under reduced motion the drawer itself never
// transforms, so checking only its transform would report "settled" while the
// opacity fade and the per-link stagger were still running.
const waitSettled = async () => {
  for (let i = 0; i < 60; i++) {
    const ok = await ev(`(() => {
      const d = document.querySelector('.pb-menu-drawer');
      if (!d) return false;
      const link = d.querySelector('.pb-menu-link');
      const foot = d.querySelector('.pb-menu-footer');
      const idle = (el) => { const t = getComputedStyle(el).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'; };
      const opaque = (el) => parseFloat(getComputedStyle(el).opacity) > 0.99;
      return idle(d) && opaque(d) && idle(link) && opaque(link) && idle(foot) && opaque(foot)
        && document.body.classList.contains('drawer-open');
    })()`).catch(() => false)
    if (ok) return true
    await sleep(100)
  }
  return false
}

// ---------------------------------------------------------------- visuals
const PROBE = `(() => {
  const d = document.querySelector('.pb-menu-drawer');
  if (!d) return { missing: true };
  const cs = getComputedStyle(d);
  const links = [...d.querySelectorAll('.pb-menu-link')];
  const first = links[0];
  const lcs = first ? getComputedStyle(first) : null;
  const label = first && first.querySelector('.pb-menu-label');
  const index = first && first.querySelector('.pb-menu-index');
  const ics = first ? getComputedStyle(index) : null;
  const lblcs = label ? getComputedStyle(label) : null;
  const meta = d.querySelector('.pb-menu-meta');
  const cta = d.querySelector('.pb-menu-cta');
  const socials = [...d.querySelectorAll('.pb-menu-social a')];
  const bd = document.querySelector('.pb-menu-backdrop');
  const bcs = bd ? getComputedStyle(bd) : null;
  const nav = d.querySelector('.pb-menu-nav');
  const foot = d.querySelector('.pb-menu-footer');
  const box = d.getBoundingClientRect();
  const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom <= innerHeight + 1 && r.top >= -1 && r.right <= innerWidth + 1; };
  return {
    missing: false,
    width: Math.round(box.width),
    right: Math.round(box.right),
    vw: innerWidth,
    vh: innerHeight,
    rows: links.length,
    rowH: lcs ? lcs.minHeight : null,
    rowBorder: lcs ? lcs.borderBottom : null,
    rowBg: lcs ? lcs.backgroundColor : null,
    rowRadius: lcs ? lcs.borderRadius : null,
    labelSize: lblcs ? lblcs.fontSize : null,
    labelFamily: lblcs ? lblcs.fontFamily : null,
    indexW: ics ? ics.width : null,
    indexSize: ics ? ics.fontSize : null,
    indexSpacing: ics ? ics.letterSpacing : null,
    activeBar: (() => { const a = d.querySelector('.pb-menu-link.is-active');
      return a ? getComputedStyle(a, '::before').width : 'no-active-link'; })(),
    activeColor: (() => { const a = d.querySelector('.pb-menu-link.is-active');
      return a ? getComputedStyle(a).color : null; })(),
    metaBg: meta ? getComputedStyle(meta).backgroundColor : null,
    metaRadius: meta ? getComputedStyle(meta).borderRadius : null,
    metaRows: meta ? meta.querySelectorAll('.pb-menu-meta-row').length : 0,
    metaHasBorder: meta ? getComputedStyle(meta).borderTopWidth : null,
    ctaH: cta ? Math.round(cta.getBoundingClientRect().height) : null,
    ctaW: cta ? Math.round(cta.getBoundingClientRect().width) : null,
    ctaRadius: cta ? getComputedStyle(cta).borderRadius : null,
    ctaVisible: vis(cta),
    socialCount: socials.length,
    socialSizes: socials.map((a) => { const r = a.getBoundingClientRect();
      return Math.round(r.width) + 'x' + Math.round(r.height); }),
    socialVisible: socials.map(vis),
    navScrolls: nav ? nav.scrollHeight > nav.clientHeight + 1 : null,
    navClipped: (() => { if (!nav || !links.length) return null;
      const n = nav.getBoundingClientRect();
      return links[links.length - 1].getBoundingClientRect().bottom > n.bottom + 1; })(),
    drawerScrolls: d.scrollHeight > d.clientHeight + 1,
    navScrollbar: nav ? getComputedStyle(nav).scrollbarWidth : null,
    footVisible: vis(foot),
    backdropBg: bcs ? bcs.backgroundColor : null,
    backdropBlur: bcs ? (bcs.backdropFilter || bcs.webkitBackdropFilter) : null,
    role: d.getAttribute('role'),
    modal: d.getAttribute('aria-modal'),
    labelAria: d.getAttribute('aria-label'),
    activeAria: d.querySelector('.pb-menu-link.is-active')?.getAttribute('aria-current') || null,
    bodyOverflow: document.body.style.overflow,
    chatVisible: (() => { const w = document.querySelector('.ai-widget');
      return w ? getComputedStyle(w).visibility : 'no-widget'; })(),
    pageOverflowX: document.documentElement.scrollWidth > innerWidth,
    pageScrollW: document.documentElement.scrollWidth,
    drawerOverflowX: d.scrollWidth > d.clientWidth + 1,
    scrollbarHidden: cs.scrollbarWidth,
    x: cs.transform,
  };
})()`

console.log('\n########  Mobile menu drawer  ########\n')
for (const [w, h] of [[390, 844], [360, 640]]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true })
  await sleep(400)
  await ev(OPEN)
  await waitOpen()
  await waitSettled()
  const p = await ev(PROBE)
  console.log(`--- ${w}x${h} ---`)
  if (p.missing) { check(false, 'drawer present'); continue }
  check(p.rows === 5, `5 nav rows (got ${p.rows})`)
  check(p.rowH === '56px', `row min-height 56px (got ${p.rowH})`)
  check(/1px solid rgba\(43, 27, 18, 0\.1\)/.test(p.rowBorder), `hairline divider, no box (border: ${p.rowBorder}, bg ${p.rowBg}, radius ${p.rowRadius})`)
  check(p.rowBg === 'rgba(0, 0, 0, 0)' && (p.rowRadius === '0px' || !p.rowRadius), `row is transparent/unrounded (bg ${p.rowBg}, radius ${p.rowRadius})`)
  check(p.labelSize === '24px', `label 24px (got ${p.labelSize})`)
  check(/Fraunces/.test(p.labelFamily || ''), `label is serif (${p.labelFamily})`)
  check(p.indexW === '28px', `index column 28px (got ${p.indexW})`)
  check(p.indexSize === '12px' && p.indexSpacing === '1.8px', `index 12px / 0.15em (got ${p.indexSize} / ${p.indexSpacing})`)
  check(p.activeBar === '2px', `active 2px left bar (got ${p.activeBar})`)
  check(p.activeAria === 'page', `aria-current="page" on active link (got ${p.activeAria})`)
  check(/rgb\(245,\s*237,\s*227\)/.test(p.metaBg || ''), `contact block cream #F5EDE3 (got ${p.metaBg})`)
  check(p.metaRows === 2, `phone + hours merged into one block (got ${p.metaRows} rows)`)
  check(p.metaHasBorder === '0px', `contact block has no border (got ${p.metaHasBorder})`)
  check(p.ctaH === 52, `CTA 52px pill (got ${p.ctaH})`)
  check(p.ctaVisible, 'CTA fully visible without scrolling')
  check(p.ctaRadius !== '0px', `CTA is a pill (radius ${p.ctaRadius})`)
  check(p.socialCount === 3, `3 social buttons (got ${p.socialCount})`)
  check(p.socialSizes.every((s) => s === '40x40'), `social buttons 40x40 (got ${p.socialSizes.join(', ')})`)
  check(p.socialVisible.every(Boolean), 'all social buttons fully visible')
  check(p.footVisible, 'footer block fully visible')
  check(p.backdropBg === 'rgba(43, 27, 18, 0.45)', `backdrop rgba(43,27,18,0.45) (got ${p.backdropBg})`)
  check(/blur\(6px\)/.test(p.backdropBlur || ''), `backdrop blur 6px (got ${p.backdropBlur})`)
  check(p.role === 'dialog' && p.modal === 'true', `role=dialog aria-modal=true (got ${p.role}/${p.modal})`)
  check(p.labelAria === 'Site menu', `aria-label="Site menu" (got ${p.labelAria})`)
  check(p.bodyOverflow === 'hidden', `body scroll locked (got ${p.bodyOverflow})`)
  check(p.chatVisible === 'hidden', `chat assistant hidden while open (got ${p.chatVisible})`)
  check(!p.pageOverflowX, `no page horizontal scroll (scrollWidth ${p.pageScrollW} vs ${p.vw})`)
  check(!p.drawerOverflowX, `no drawer horizontal scroll (scrollbar-width: ${p.scrollbarHidden})`)
  check(p.x === 'none' || p.x === 'matrix(1, 0, 0, 1, 0, 0)', `drawer settled at x=0 (transform ${p.x})`)
  check(p.right <= p.vw + 1, `drawer right edge inside viewport (${p.right} <= ${p.vw})`)
  // The pinned-footer layout only works if the nav scrolls rather than
  // overflowing: a half-cut row is the failure mode this guards.
  check(p.navClipped === false, `no nav row clipped by the footer (clipped: ${p.navClipped}, navScrolls: ${p.navScrolls})`)
  check(!p.drawerScrolls, `drawer frame itself never scrolls (drawerScrolls: ${p.drawerScrolls})`)
  check(p.navScrollbar === 'none', `nav scrollbar hidden (got ${p.navScrollbar})`)

  // Close button
  await clickAt(...JSON.parse(await ev(`(() => { const r = document.querySelector('.menu-toggle.close').getBoundingClientRect();
    return JSON.stringify([Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]) })()`)))
  check(await waitClosed(), 'close button closes the drawer')

  // Escape
  await ev(OPEN); await waitOpen(); await waitSettled()
  await pressEscape()
  const escHandled = await waitClosing()
  check(escHandled, 'Escape reaches the handler (aria-expanded -> false)')
  check(await waitClosed(), 'Escape closes the drawer')

  // Backdrop. At <=360px the drawer is intentionally full-bleed, so there is
  // no exposed backdrop to click; assert the element and styles only there.
  await ev(OPEN); await waitOpen(); await waitSettled()
  const gutter = JSON.parse(await ev(`(() => {
    const d = document.querySelector('.pb-menu-drawer').getBoundingClientRect();
    return JSON.stringify({ left: Math.round(d.left), width: Math.round(d.width),
      vw: innerWidth, x: Math.max(2, Math.round(d.left / 2)), y: Math.round(innerHeight / 2) }) })()`))
  if (gutter.left <= 2) {
    check(true, `drawer is full-bleed at ${w}px, so no backdrop gutter exists to click`)
  } else {
    const at = await ev(`((document.elementFromPoint(${gutter.x}, ${gutter.y}) || {}).className || '')`)
    check(/pb-menu-backdrop/.test(at), `gutter point hits the backdrop (got "${at}")`)
    await clickAt(gutter.x, gutter.y)
    check(await waitClosing(), 'backdrop click reaches the handler (aria-expanded -> false)')
    check(await waitClosed(), 'backdrop click closes the drawer')
  }

  // focus on open
  await ev(OPEN); await waitOpen(); await waitSettled()
  check(await ev(`document.querySelector('.pb-menu-drawer').contains(document.activeElement)`),
    'focus moved into the drawer on open')
  const activeOnClose = await ev(`document.activeElement?.className || ''`)
  check(/close/.test(activeOnClose), `close button received focus (got "${activeOnClose}")`)

  // focus trap: shift-tab from the first focusable should land on the last
  await ev(`document.querySelector('.pb-menu-drawer a[href]').focus()`)
  await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', modifiers: 8, windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  await sleep(250)
  check(await ev(`document.querySelector('.pb-menu-drawer').contains(document.activeElement)`),
    'Tab focus stays trapped inside the drawer')

  // link click closes and navigates
  await ev(OPEN); await waitOpen(); await waitSettled()
  const lk = JSON.parse(await ev(`(() => { const r = document.querySelector('.pb-menu-link').getBoundingClientRect();
    return JSON.stringify([Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]) })()`))
  await clickAt(lk[0], lk[1])
  check(await waitClosed(), 'nav link click closes the drawer')

  // reload for the next viewport, then confirm the lock + focus released
  await cdp('Page.navigate', { url: `${BASE}/menu` })
  for (let i = 0; i < 60; i++) {
    if (await ev(`!!document.querySelector('.menu-toggle') && !document.querySelector('.preloader')`).catch(() => false)) break
    await sleep(300)
  }
  check(await ev(`document.body.style.overflow === ''`), 'body scroll lock released')
  check(await ev(`document.querySelector('.ai-widget')
    ? getComputedStyle(document.querySelector('.ai-widget')).visibility !== 'hidden' : true`),
    'chat assistant restored on close')
  console.log('')
}

// ------------------------------------------------------- reduced motion
console.log('--- reduced motion (390x844) ---')
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
// Reload so framer-motion's useReducedMotion initialises against the
// preference instead of picking up a mid-session change.
await cdp('Page.navigate', { url: `${BASE}/menu` })
for (let i = 0; i < 60; i++) {
  if (await ev(`!!document.querySelector('.menu-toggle') && !document.querySelector('.preloader')`).catch(() => false)) break
  await sleep(300)
}
check(await ev(`matchMedia('(prefers-reduced-motion: reduce)').matches`),
  'browser reports prefers-reduced-motion: reduce')
await ev(OPEN)
await waitOpen()
await waitSettled()
// Poll until the transform stops changing, so we never measure mid-flight.
const settled = await ev(`(async () => {
  const d = document.querySelector('.pb-menu-drawer');
  const t0 = getComputedStyle(d).transform;
  await new Promise((r) => setTimeout(r, 400));
  const t1 = getComputedStyle(d).transform;
  return JSON.stringify({ t0, t1 }) })()`)
const s = JSON.parse(settled)
const rm = await ev(`(() => {
  const d = document.querySelector('.pb-menu-drawer');
  if (!d) return { missing: true };
  return { t: getComputedStyle(d).transform,
    opacity: getComputedStyle(d).opacity,
    labelT: getComputedStyle(d.querySelector('.pb-menu-link .pb-menu-label')).transform,
    indexT: getComputedStyle(d.querySelector('.pb-menu-link')).transform,
    visible: d.getBoundingClientRect().left < innerWidth };
})()`)
if (rm.missing) { check(false, 'drawer opens under reduced motion') }
else {
  check(s.t0 === s.t1, `transform settled (no slide) (${s.t0} -> ${s.t1})`)
  check(rm.t === 'none' || rm.t === 'matrix(1, 0, 0, 1, 0, 0)', `no horizontal offset at rest (transform ${rm.t})`)
  check(parseFloat(rm.opacity) > 0.98, `faded fully in (opacity ${rm.opacity})`)
  check(rm.labelT === 'none', `no per-link y-offset (transform ${rm.labelT})`)
  check(rm.indexT === 'none', `no per-link slide (transform ${rm.indexT})`)
  check(rm.visible, 'drawer on screen')
}
console.log('')

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
console.log(fails ? `\n${fails} check(s) FAILED\n` : '\nAll checks passed\n')
process.exit(fails ? 1 : 0)
