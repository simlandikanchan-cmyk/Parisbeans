// Typography audit harness — measures COMPUTED values for the three text roles
// (eyebrow / heading / description) in every section of every route.
//
// Roles are auto-detected per section rather than hardcoded, so a new section
// is picked up without editing this file. The detection is deliberately
// conservative and reports what it matched, so the audit can be checked
// against the JSX by hand.
//
// Usage:
//   node scripts/audit-typography.mjs            # writes docs/_audit-raw.json
//   node scripts/audit-typography.mjs --shot     # also writes section screenshots
//
// Requires the dev server on :5173.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = Number(process.env.CDP_PORT || 9240)
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\opencode\\typo-audit-profile'
const BASE = process.env.BASE || 'http://localhost:5173'
const WANT_SHOTS = process.argv.includes('--shot')

const WIDTHS = [320, 375, 390, 414, 599, 600, 744, 768, 900, 1023, 1024, 1099, 1100, 1280, 1366, 1440, 1920]

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'story', path: '/our-story' },
  { name: 'menu', path: '/menu' },
  { name: 'gallery', path: '/gallery' },
  { name: 'visit', path: '/visit-contact' },
  { name: 'privacy', path: '/privacy-policy' },
  { name: 'terms', path: '/terms-and-conditions' },
  { name: 'notfound', path: '/this-route-does-not-exist' },
]

// ---------------------------------------------------------------- browser

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`,
   '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
   '--force-device-scale-factor=1', '--window-size=1920,1200', 'about:blank'],
  { stdio: 'ignore' }
)
let ws, id = 0
const pending = new Map()
const cdp = (m, p = {}) =>
  new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method: m, params: p })) })
for (let i = 0; i < 80; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
    const t = l.find((x) => x.type === 'page')
    if (t?.webSocketDebuggerUrl) { ws = new WebSocket(t.webSocketDebuggerUrl); break }
  } catch {}
  await sleep(250)
}
if (!ws) { chrome.kill(); throw new Error('could not attach to Chrome') }
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
const pageErrors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.exceptionThrown') {
    pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
  }
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id)
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)
  }
}
const ev = async (expression) => {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}

await cdp('Page.enable')
await cdp('Runtime.enable')
// Reveal/entrance animations translate elements, which would corrupt every
// rect-based measurement below. Emulating reduced motion is how the app itself
// is meant to drop them, so the audit measures the settled state.
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

// ---------------------------------------------------------------- probe

const PROBE = String.raw`(() => {
  const ROLE_PROPS = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
    'letterSpacing', 'color', 'textTransform', 'textAlign', 'textWrap',
    'maxWidth', 'whiteSpace', 'marginBottom', 'marginTop', 'fontVariant',
  ];
  const px = (v) => parseFloat(v) || 0;

  // Number of rendered lines, by grouping per-character rects by their top.
  const linesOf = (el) => {
    const map = new Map();
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const txt = n.textContent;
      for (let i = 0; i < txt.length; i++) {
        const r = document.createRange();
        r.setStart(n, i); r.setEnd(n, i + 1);
        const rect = r.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        const key = Math.round(rect.top);
        if (!map.has(key)) map.set(key, { text: '', left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
        const L = map.get(key);
        L.text += txt[i];
        L.left = Math.min(L.left, rect.left);
        L.right = Math.max(L.right, rect.right);
        L.top = Math.min(L.top, rect.top);
        L.bottom = Math.max(L.bottom, rect.bottom);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({
      text: v.text.replace(/\s+/g, ' ').trim(),
      left: +v.left.toFixed(1),
      right: +v.right.toFixed(1),
      ink: +(v.right - v.left).toFixed(1),
    }));
  };

  // Effective background colour behind an element, for the contrast check.
  const parseRGB = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  // Text over a photograph has no measurable contrast ratio: walking the tree
  // for a background-color finds the section's white, not the pixels behind
  // the glyphs. A hero photo is often a *sibling* div painted with a
  // background-image rather than an ancestor, so test rect overlap against
  // every media element instead of walking ancestors.
  const MEDIA = 'img,picture,video,canvas,svg';
  let mediaCache = null;
  const mediaOverlapping = (rect) => {
    if (!mediaCache) {
      mediaCache = [...document.querySelectorAll(MEDIA)].filter((n) => {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
        const r = n.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).map((n) => ({ r: n.getBoundingClientRect(), tagged: n.matches(MEDIA), image: getComputedStyle(n).backgroundImage !== 'none' }));
      // Sibling decorative panels that paint a photo, e.g. .menu-hero-img.
      for (const n of document.querySelectorAll('[class*="-img"],[class*="media"],[class*="-bg"]')) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage === 'none' || cs.display === 'none' || +cs.opacity === 0) continue;
        const r = n.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) mediaCache.push({ r, tagged: false, image: true });
      }
    }
    const area = rect.width * rect.height;
    if (area <= 0) return false;
    return mediaCache.some((m) => {
      const x = Math.max(0, Math.min(rect.right, m.r.right) - Math.max(rect.left, m.r.left));
      const y = Math.max(0, Math.min(rect.bottom, m.r.bottom) - Math.max(rect.top, m.r.top));
      return (x * y) / area > 0.3;
    });
  };
  const overImage = (el) => mediaOverlapping(el.getBoundingClientRect());
  const bgOf = (el) => {
    let n = el;
    let acc = null;
    while (n && n !== document.documentElement) {
      const c = parseRGB(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? { r: acc.r * (1 - c.a) + c.r * c.a, g: acc.g * (1 - c.a) + c.g * c.a, b: acc.b * (1 - c.a) + c.b * c.a, a: 1 } : c;
        if (acc.a >= 0.999) return acc;
      }
      n = n.parentElement;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => {
    const a = lum(fg) + 0.05, b = lum(bg) + 0.05;
    return +(a > b ? a / b : b / a).toFixed(2);
  };

  const readRole = (el, kind) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const lines = linesOf(el);
    const o = {
      kind,
      tag: el.tagName.toLowerCase(),
      className: (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').trim(),
      selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + ((typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean).join('.')),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      textRaw: el.textContent || '',
      boxLeft: +r.left.toFixed(1),
      boxWidth: +r.width.toFixed(1),
      lineCount: lines.length,
      lines: lines.map((l) => ({ text: l.text, left: l.left, ink: l.ink })),
      // Ink left edge of the first line, which is the true text-alignment edge.
      firstLineLeft: lines.length ? lines[0].left : null,
      lastLineRight: lines.length ? lines[lines.length - 1].right : null,
      firstLineInk: lines.length ? lines[0].ink : null,
      overflowing: r.width > 0 && el.scrollWidth > Math.ceil(r.width) + 1,
      transform: cs.transform,
    };
    for (const p of ROLE_PROPS) o[p] = cs[p];
    o.fontSizePx = px(cs.fontSize);
    o.lineHeightPx = px(cs.lineHeight) || o.fontSizePx * parseFloat(cs.lineHeight);
    // 'sans-serif' contains the substring 'serif', so the generic sans family
    // must be excluded before any serif name is tested.
    o.isSerif = /Fraunces|Georgia|(^|[\s,])serif([\s,]|$)/i.test(cs.fontFamily) && !/sans-serif/i.test(cs.fontFamily);
    const bg = bgOf(el);
    const fg = parseRGB(cs.color);
    o.bgColor = 'rgb(' + [bg.r, bg.g, bg.b].map((v) => Math.round(v)).join(', ') + ')';
    o.overImage = overImage(el);
    o.contrast = fg && !o.overImage ? contrast(fg, bg) : null;
    o.contrastNote = o.overImage ? 'text over image: ratio not measurable' : null;
    return o;
  };

  // ---- role detection -------------------------------------------------
  const EYE_CLASS = /(^|\s|-)(eyebrow)(-|$|\s)/;
  const isEyebrow = (el) => {
    const c = typeof el.className === 'string' ? el.className : '';
    return EYE_CLASS.test(c) || EYE_CLASS.test(el.classList ? [...el.classList].join(' ') : '');
  };
  const HEADINGS = 'h1,h2,h3,h4,h5,h6';
  // A <p> is a description only if it is prose: several words, no aria role, and
  // not a status/error/caption/label element.
  const isProse = (el) => {
    if (el.tagName !== 'P') return false;
    if (el.closest('[role="status"],[role="alert"],[aria-hidden="true"]')) return false;
    const c = (typeof el.className === 'string' ? el.className : '');
    if (/caption|status|label|meta|note|word|tagline|price|code|chip/i.test(c)) return false;
    return (el.textContent || '').trim().split(/\s+/).length >= 4;
  };

  const main = document.querySelector('main') || document.body;
  const blocks = [...main.children].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && el.getBoundingClientRect().height > 0;
  });

  const sections = [];
  for (const block of blocks) {
    const all = [block, ...block.querySelectorAll('*')];
    const eyebrows = all.filter(isEyebrow);
    const headings = all.filter((el) => el.matches(HEADINGS) && !el.closest('[aria-hidden="true"]'));
    const heading = headings[0] || null;
    // Description: first prose <p> that follows the heading in document order,
    // and is still inside the block.
    let desc = null;
    const ps = all.filter(isProse);
    if (heading) {
      desc = ps.find((p) => heading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
    } else {
      desc = ps[0] || null;
    }
    // The eyebrow that belongs to THIS block, not to a nested one. Among the
    // candidates prefer the innermost element that actually holds the text: a
    // wrapper like .hero-eyebrow-wrap carries no styles of its own, so reading
    // its computed font would report inherited garbage instead of the real one.
    const own = (el) => !el.closest('section,main,header,footer,aside,nav,div[class*="modal"],dialog') || el.closest('section,main,header,footer,aside,nav,div[class*="modal"],dialog') === block;
    const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const depth = (el) => { let d = 0; for (let n = el; n; n = n.parentElement) d++; return d };
    const ownEyes = eyebrows.filter(own);
    const eyebrow = (ownEyes.filter(hasOwnText).sort((a, b) => depth(b) - depth(a))[0]
      || ownEyes.sort((a, b) => depth(b) - depth(a))[0]
      || eyebrows.sort((a, b) => depth(b) - depth(a))[0]
      || null);

    const rec = {
      block: (typeof block.className === 'string' ? block.className : block.id ? '#' + block.id : block.tagName.toLowerCase()).trim() || block.tagName.toLowerCase(),
      blockTag: block.tagName.toLowerCase(),
      eyebrowCount: eyebrows.length,
      headingCount: headings.length,
      headingTags: headings.map((h) => h.tagName.toLowerCase()),
      eyebrow: readRole(eyebrow, 'eyebrow'),
      heading: readRole(heading, 'heading'),
      desc: readRole(desc, 'description'),
    };
    if (rec.eyebrow && rec.heading) {
      rec.gapEyebrowHeading = +(rec.heading.boxTop - rec.eyebrow.boxBottom).toFixed(1);
    }
    if (rec.heading && rec.desc) {
      rec.gapHeadingDesc = +(rec.desc.boxTop - rec.heading.boxBottom).toFixed(1);
    }
    sections.push(rec);
  }

  return {
    vw: innerWidth,
    url: location.pathname,
    h1: (() => {
      const h = document.querySelector('h1');
      if (!h) return null;
      const cs = getComputedStyle(h);
      return { size: cs.fontSize, text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), cls: typeof h.className === 'string' ? h.className : '' };
    })(),
    docFontSize: getComputedStyle(document.documentElement).fontSize,
    sections,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    scrollW: document.documentElement.scrollWidth,
    innerW: innerWidth,
  };
})()`

// I added boxTop/boxBottom to the readRole output via a small patch below,
// because gap measurement needs them.
const PROBE_PATCHED = PROBE.replace(
  'boxLeft: +r.left.toFixed(1),',
  'boxLeft: +r.left.toFixed(1),\n      boxTop: +r.top.toFixed(1),\n      boxBottom: +r.bottom.toFixed(1),'
)

// ---------------------------------------------------------------- run

mkdirSync('docs', { recursive: true })
const SHOT_DIR = 'docs/_audit-shots'
if (WANT_SHOTS) mkdirSync(SHOT_DIR, { recursive: true })

const results = []
for (const route of ROUTES) {
  await cdp('Page.navigate', { url: BASE + route.path })
  // Wait for the route's own content, then for fonts.
  await sleep(500)
  let ready = false
  for (let i = 0; i < 60; i++) {
    ready = await ev(`!!document.querySelector('main') && document.querySelector('main').children.length > 0`).catch(() => false)
    if (ready) break
    await sleep(300)
  }
  await ev(`document.fonts ? document.fonts.ready.then(() => 1) : 1`).catch(() => {})
  await sleep(900)

  for (const w of WIDTHS) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false })
    await sleep(420)
    const data = await ev(PROBE_PATCHED)
    data.route = route.name
    data.width = w
    results.push(data)

    if (WANT_SHOTS && [390, 744, 1440].includes(w)) {
      await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: 1400, deviceScaleFactor: 1, mobile: false })
      await sleep(250)
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      const tag = `${route.name}-${w}`
      writeFileSync(join(SHOT_DIR, `${tag}.png`), Buffer.from(shot.data, 'base64'))
    }
  }
  process.stderr.write(`  done ${route.name}\n`)
}

const out = { base: BASE, widths: WIDTHS, routes: ROUTES, pageErrors, results }
writeFileSync('docs/_audit-raw.json', JSON.stringify(out, null, 1))
console.log(`\nwrote docs/_audit-raw.json  (${results.length} page/width samples)`)
if (pageErrors.length) {
  console.log(`\n!! ${pageErrors.length} page exception(s):`)
  for (const e of [...new Set(pageErrors)].slice(0, 5)) console.log('   ' + String(e).split('\n')[0])
}
if (WANT_SHOTS) console.log(`screenshots in ${SHOT_DIR}/`)

ws?.close()
chrome.kill()
await new Promise((r) => chrome.once('exit', r))
