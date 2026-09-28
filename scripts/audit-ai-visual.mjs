// Programmatic visual audit — the substitute for eyeballing screenshots.
// Measures geometry, overlap, clipping, tap-target size and WCAG contrast in a
// real headless Chrome render.
//
// Run: node scripts/audit-ai-visual.mjs
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9224
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\ai-profile2'
const PORT = 5322

const upstream = createServer((req, res) => {
  req.on('data', () => {})
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ choices: [{ message: { content: 'Yes, we are open daily.' } }] }))
  })
})
await new Promise((r) => upstream.listen(0, r))

process.env.VITE_AI_ENDPOINT = `http://127.0.0.1:${upstream.address().port}/v1/chat/completions`
process.env.AI_API_KEY = 'sk-test'
process.env.VITE_AI_MODEL = 'gpt-4o-mini'

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
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' }
)

let ws
let id = 0
const pending = new Map()
const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id
    pending.set(n, { resolve, reject })
    ws.send(JSON.stringify({ id: n, method, params }))
  })

for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const p = l.find((t) => t.type === 'page')
    if (p?.webSocketDebuggerUrl) {
      ws = new WebSocket(p.webSocketDebuggerUrl)
      break
    }
  } catch {}
  await sleep(250)
}
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = rej
})
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
  }
}
const evaluate = async (expr) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Page.navigate', { url: base })
for (let i = 0; i < 60; i++) {
  if (await evaluate(`!!document.querySelector('.ai-float')`).catch(() => false)) break
  await sleep(250)
}
await evaluate(`document.querySelector('.ai-float').click(); true`)
await sleep(800)

const AUDIT = `(() => {
  const px = (el, p) => parseFloat(getComputedStyle(el)[p]) || 0;
  const lum = ([r,g,b]) => { const f = c => { c/=255; return c<=0.03928? c/12.92 : Math.pow((c+0.055)/1.055,2.4) };
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) };
  const parse = s => { const m = s.match(/[\\d.]+/g); return m ? m.slice(0,3).map(Number) : null };
  const parseA = s => { const m = s.match(/[\\d.]+/g); return m && m.length>3 ? Number(m[3]) : 1 };
  // Walk ancestors compositing backgrounds to find the effective backdrop.
  const bgOf = el => {
    let n = el, acc = null;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor), a = parseA(getComputedStyle(n).backgroundColor);
      if (c && a > 0) acc = acc ? acc.map((v,i) => v*a + c[i]*(1-a)) : (a < 1 ? c.map(v=>v*a) : c);
      if (a >= 1) break;
      n = n.parentElement;
    }
    return acc || [255,255,255];
  };
  const ratio = (fg, bg) => { const L1=lum(fg), L2=lum(bg);
    return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05) };
  const bgHex = c => '#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');

  const vis = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
           parseFloat(cs.opacity) > 0.01 &&
           cs.visibility !== 'hidden' && cs.display !== 'none' &&
           r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };

  // 1. contrast
  const contrast = [];
  document.querySelectorAll('.ai-panel *, .ai-float').forEach(el => {
    if (!vis(el)) return;
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('').trim();
    if (!txt) return;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color); if (!fg) return;
    const alpha = parseA(cs.color);
    const bg = bgOf(el);
    const eff = alpha < 1 ? fg.map((v,i)=>v*alpha + bg[i]*(1-alpha)) : fg;
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const cr = ratio(eff, bg);
    const need = large ? 3 : 4.5;
    contrast.push({ sel: el.className || el.tagName, text: txt.slice(0,28),
      size: +size.toFixed(1), ratio: +cr.toFixed(2), need, pass: cr >= need,
      fg: bgHex(eff), bg: bgHex(bg) });
  });

  // 2. tap targets
  const taps = [];
  document.querySelectorAll('.ai-panel button, .ai-float, .ai-suggest button, textarea').forEach(el => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect();
    taps.push({ sel: (el.className||el.tagName).toString().slice(0,32),
      w: Math.round(r.width), h: Math.round(r.height),
      pass24: r.width>=24 && r.height>=24, pass44: r.width>=44 && r.height>=44 });
  });

  // 3. clipping / overflow
  const overflow = [];
  document.querySelectorAll('.ai-panel, .ai-list, .ai-head, .ai-form, .ai-msg-body, .ai-suggest').forEach(el => {
    if (!vis(el)) return;
    overflow.push({ sel: el.className, scrollW: el.scrollWidth, clientW: el.clientWidth,
      clippedX: el.scrollWidth > el.clientWidth + 1,
      scrollH: el.scrollHeight, clientH: el.clientHeight });
  });

  // 4. geometry vs viewport
  const box = s => { const el=document.querySelector(s); if(!el) return null;
    const r=el.getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
            right:Math.round(r.right),bottom:Math.round(r.bottom)} };
  const panel = box('.ai-panel'), float = box('.ai-float');
  const overlap = panel && float && !(panel.bottom < float.y || panel.y > float.bottom ||
                    panel.right < float.x || panel.x > float.right);

  // 5. stacking: is the panel actually the top element at its centre?
  let topAtCentre = 'n/a'
  let blocker = null
  if (panel) {
    const el = document.elementFromPoint(panel.x + panel.w/2, panel.y + panel.h/2)
    topAtCentre = el ? (el.className || el.tagName).toString() : 'null'
    if (el && !(panelRef = document.querySelector('.ai-panel')).contains(el)) {
      blocker = topAtCentre
    }
  }
  // Is the composer actually hit-testable (nothing overlaying the input)?
  const inp = document.querySelector('#ai-message')
  let inputBlockedBy = null
  if (inp) {
    const ir = inp.getBoundingClientRect()
    const hit = document.elementFromPoint(ir.x + ir.width/2, ir.y + ir.height/2)
    if (hit && hit !== inp && !inp.contains(hit) && !hit.contains(inp)) {
      inputBlockedBy = (hit.className || hit.tagName).toString()
    }
  }
  const preloader = document.querySelector('.preloader, [class*="preload"]')
  const preloaderState = preloader
    ? { found: true, display: getComputedStyle(preloader).display,
        opacity: getComputedStyle(preloader).opacity,
        pointerEvents: getComputedStyle(preloader).pointerEvents,
        cls: preloader.className }
    : { found: false }

  return { contrast, taps, overflow, panel, float, overlap, topAtCentre, blocker,
           inputBlockedBy, preloaderState,
           vw: innerWidth, vh: innerHeight,
           docScrollX: document.documentElement.scrollWidth > innerWidth + 1 };
})()`

let fails = 0
for (const [label, w, h, mobile] of [
  ['desktop 1440x900', 1440, 900, false],
  ['laptop 1280x720', 1280, 720, false],
  ['tablet 768x1024', 768, 1024, true],
  ['mobile 390x844', 390, 844, true],
  ['mobile 320x568', 320, 568, true],
]) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: 1, mobile,
  })
  await sleep(600)
  const a = await evaluate(AUDIT)

  console.log(`\n=== ${label} ===`)
  console.log(`  panel ${JSON.stringify(a.panel)}`)
  console.log(`  float ${JSON.stringify(a.float)}`)
  const off = a.panel && (a.panel.right > a.vw + 1 || a.panel.bottom > a.vh + 1 || a.panel.x < -1 || a.panel.y < -1)
  console.log(`  panel offscreen        : ${off}   ${off ? '*** FAIL ***' : 'ok'}`)
  if (off) fails++
  console.log(`  panel/float overlap    : ${a.overlap}   ${a.overlap ? '*** FAIL ***' : 'ok'}`)
  if (a.overlap) fails++
  console.log(`  page h-scroll          : ${a.docScrollX}   ${a.docScrollX ? '*** FAIL ***' : 'ok'}`)
  if (a.docScrollX) fails++
  console.log(`  topmost at panel centre: ${a.topAtCentre}`)
  if (a.blocker) { console.log(`      *** something overlays the panel: ${a.blocker} ***`); fails++ }
  if (a.inputBlockedBy) { console.log(`      *** composer input not clickable, blocked by: ${a.inputBlockedBy} ***`); fails++ }
  if (a.preloaderState.found) {
    console.log(`  preloader              : display=${a.preloaderState.display} opacity=${a.preloaderState.opacity} pointer-events=${a.preloaderState.pointerEvents}`)
  }

  const cf = a.contrast.filter((c) => !c.pass)
  const cs = a.contrast.filter((c) => c.pass)
  console.log(`  contrast               : ${cs.length} pass / ${cf.length} below AA`)
  cf.forEach((c) => { console.log(`      FAIL ${c.ratio} (need ${c.need}) ${c.size}px "${c.text}" ${c.fg} on ${c.bg}`); fails++ })

  const t24 = a.taps.filter((t) => !t.pass24)
  const t44 = a.taps.filter((t) => !t.pass44)
  console.log(`  tap targets >=24px     : ${a.taps.length - t24.length}/${a.taps.length}  ${t24.map(t=>`${t.sel}(${t.w}x${t.h})`).join(' ')}`)
  console.log(`  tap targets >=44px     : ${a.taps.length - t44.length}/${a.taps.length}`)
  t24.forEach((t) => { console.log(`      FAIL <24px ${t.sel} ${t.w}x${t.h}`); fails++ })

  const clip = a.overflow.filter((o) => o.clippedX)
  console.log(`  horizontal clipping    : ${clip.length ? clip.map(c=>`${c.sel} (${c.scrollW}>${c.clientW})`).join(', ') : 'none'}`)
}

console.log(`\n${fails === 0 ? 'No issues found.' : fails + ' issue(s) found.'}\n`)
ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
await vite.close()
upstream.close()
