// Identifies which element the mobile gallery report is actually about, by
// measuring the hero collage AND the .gal-grid sections at phone widths.
//
// Run: node scripts/diagnose-gallery-layout.mjs
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9228
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\gal-diag'
// `npm run dev` binds IPv6 loopback only, so 127.0.0.1 refuses connections.
const BASE = 'http://[::1]:5173'

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
await cdp('Page.navigate', { url: `${BASE}/gallery` })
let ready = false
for (let i = 0; i < 100; i++) {
  ready = await ev(`!!document.querySelector('.gal-hero-title')`).catch(() => false)
  if (ready) break
  await sleep(300)
}
if (!ready) {
  console.log('\npage never rendered the hero:', await ev(`JSON.stringify({
    url: location.href, ready: document.readyState,
    rootKids: document.getElementById('root')?.children.length,
    body: document.body.innerText.slice(0, 300)
  })`).catch((e) => 'eval failed: ' + e.message))
  throw new Error('hero not rendered')
}
await sleep(1200)

console.log('\n================ STRUCTURE UNDER THE H1 ================')
console.log(await ev(`(() => {
  const h1 = document.querySelector('.gal-hero-title');
  const sec = h1.closest('section');
  const rows = [];
  const walk = (el, d) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      rows.push('  '.repeat(d) + c.tagName.toLowerCase() + '.' + (c.className||'').toString().split(' ').filter(Boolean).join('.')
        + '  display=' + cs.display
        + (cs.gridTemplateColumns !== 'none' ? '  cols=' + cs.gridTemplateColumns : '')
        + (cs.flexWrap !== 'normal' ? '  wrap=' + cs.flexWrap : '')
        + '  w=' + Math.round(r.width));
      if (d < 2) walk(c, d + 1);
    }
  };
  walk(sec, 0);
  return rows.join('\\n');
})()`))

for (const w of [375, 390]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 844, deviceScaleFactor: 1, mobile: true })
  await sleep(700)

  console.log(`\n================ ${w}px : HERO COLLAGE ================`)
  console.log(await ev(`(() => {
    const t = document.querySelector('.gallery-track');
    t.style.animation='none'; t.style.transform='none';
    const figs=[...document.querySelectorAll('.gallery-set:not(.gallery-set--loop) .gallery-image')];
    const vw=innerWidth;
    const out = figs.slice(0,3).map((f,i)=>{
      const b=f.getBoundingClientRect();
      return '  frame'+(i+1)+'  x='+b.x.toFixed(1)+'  w='+b.width.toFixed(1)+'  h='+b.height.toFixed(1)
        +'  y='+b.y.toFixed(1)+'  visible='+Math.max(0, Math.min(vw,b.right)-Math.max(0,b.x)).toFixed(1)+'px';
    });
    const col=getComputedStyle(document.querySelector('.gal-hero-collage'));
    out.push('  collage: overflow-x='+col.overflowX+'  track animation='+getComputedStyle(t).animationName);
    out.push('  is it a grid? cols='+getComputedStyle(document.querySelector('.gal-hero-collage')).gridTemplateColumns);
    return out.join('\\n');
  })()`))

  console.log(`\n---------------- ${w}px : .gal-grid SECTIONS ----------------`)
  console.log(await ev(`(() => {
    const out=[];
    document.querySelectorAll('.gal-grid').forEach((g,gi)=>{
      const gr=g.getBoundingClientRect();
      const cs=getComputedStyle(g);
      const track=g.querySelector('.gal-track');
      const tiles=[...g.querySelectorAll('.gal-tile')].slice(0,3).map((t2,i)=>{
        const b=t2.getBoundingClientRect();
        return 'tile'+(i+1)+' x='+b.x.toFixed(1)+' w='+b.width.toFixed(1)+' h='+b.height.toFixed(1)+' y='+b.y.toFixed(1);
      });
      out.push('  ['+gi+'] '+g.className);
      out.push('      display='+cs.display+'  cols='+cs.gridTemplateColumns+'  overflow-x='+cs.overflowX+'  scrollSnap='+cs.scrollSnapType);
      out.push('      container w='+Math.round(gr.width)+'  track display='+(track?getComputedStyle(track).display:'-'));
      tiles.forEach(t=>out.push('      '+t));
    });
    return out.join('\\n');
  })()`))
}

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
