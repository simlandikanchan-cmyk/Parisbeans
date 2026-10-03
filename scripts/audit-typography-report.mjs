// Post-processes docs/_audit-raw.json into the tables and the inconsistency
// list that make up docs/typography-audit.md. Keeps the measurement in the
// harness and the judgement here, so the numbers are never retyped by hand.
import { readFileSync, writeFileSync } from 'node:fs'

const raw = JSON.parse(readFileSync('docs/_audit-raw.json', 'utf8'))
const byRouteWidth = new Map()
for (const r of raw.results) byRouteWidth.set(`${r.route}@${r.width}`, r)

const tier = (w) => (w < 600 ? 'phone' : w <= 1099 ? 'tablet' : 'desktop')
const r2 = (n) => Math.round(n * 100) / 100

// ------------------------------------------------------------------ inventory

// Which blocks the detector found, and what it matched. Checked by hand
// against the JSX; the "role detection" table in the report is this.
const inventory = []
for (const route of raw.routes) {
  const sample = byRouteWidth.get(`${route.name}@1440`)
  if (!sample) continue
  for (const s of sample.sections) {
    inventory.push({
      route: route.name,
      path: route.path,
      block: s.block,
      tag: s.blockTag,
      eyebrow: s.eyebrow ? `${s.eyebrow.tag}.${s.eyebrow.className.split(/\s+/)[0]}` : '—',
      heading: s.heading ? `${s.heading.tag}.${s.heading.className.split(/\s+/)[0] || '(none)'}` : '—',
      headingTag: s.headingTags.join(','),
      desc: s.desc ? `${s.desc.tag}.${s.desc.className.split(/\s+/).slice(0, 2).join('.') || '(none)'}` : '—',
      text: (s.heading || s.eyebrow || {}).text || '',
    })
  }
}

writeFileSync('docs/_audit-inventory.json', JSON.stringify(inventory, null, 1))

// ------------------------------------------------------------------ size matrix

// sizeKey -> list of {route, block, role, size} for every width in a tier.
const sizeMatrix = new Map()
for (const r of raw.results) {
  const t = tier(r.width)
  for (const s of r.sections) {
    for (const role of ['eyebrow', 'heading', 'desc']) {
      const el = s[role]
      if (!el || !el.fontSizePx) continue
      const key = `${role}|${t}`
      if (!sizeMatrix.has(key)) sizeMatrix.set(key, new Map())
      const m = sizeMatrix.get(key)
      // group by size string so identical sites collapse
      const k = el.fontSize
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(`${r.route}/${s.block}`)
    }
  }
}

// ------------------------------------------------------------------ per-role detail

const detail = []
for (const r of raw.results) {
  for (const s of r.sections) {
    const row = {
      route: r.route, width: r.width, tier: tier(r.width), block: s.block,
      h1Size: r.h1 ? r.h1.size : null,
    }
    for (const role of ['eyebrow', 'heading', 'desc']) {
      const el = s[role]
      const k = role
      // 'sans-serif' contains the substring 'serif', so the generic sans family
      // has to be excluded before the serif names are tested. The harness's own
      // isSerif flag gets this wrong; recompute from the stored stack.
      const fam = el && el.fontFamily
      const serif = fam ? /Fraunces|Georgia|(^|[\s,])serif([\s,]|$)/i.test(fam) && !/sans-serif/i.test(fam) : false
      row[k] = el
        ? {
            size: el.fontSize, family: serif ? 'serif' : 'sans', familyStack: fam, weight: el.fontWeight,
            style: el.fontStyle, lh: el.lineHeight, track: el.letterSpacing,
            color: el.color, align: el.textAlign, wrap: el.textWrap,
            maxW: el.maxWidth, left: el.firstLineLeft, right: el.lastLineRight, lines: el.lineCount,
            contrast: el.contrast, overflow: el.overflowing, tag: el.tag,
          }
        : null
    }
    if (row.eyebrow && row.heading) row.gapEB = s.gapEyebrowHeading
    if (row.heading && row.desc) row.gapHD = s.gapHeadingDesc
    // A vertical gap is only meaningful when the two boxes are stacked in one
    // flow. Where a heading sits in one grid column and its description in
    // another, the box-to-box distance measures the column, not spacing. A
    // horizontal-overlap test alone is not enough: a wide description that
    // spans both columns still overlaps. A plausible spacing distance is also
    // required, so a multi-column arrangement can never register as a gap.
    const rawEl = { eyebrow: s.eyebrow, heading: s.heading, desc: s.desc }
    const overlapX = (a, b) => {
      const x = Math.max(0, Math.min(a.boxLeft + a.boxWidth, b.boxLeft + b.boxWidth) - Math.max(a.boxLeft, b.boxLeft))
      return x / Math.min(a.boxWidth, b.boxWidth)
    }
    const stacked = (a, b, gapKey) => {
      if (!a || !b) return null
      const gap = s[gapKey]
      if (gap == null) return null
      return overlapX(a, b) >= 0.5 && gap >= -60 && gap <= 120
    }
    row.stackEB = stacked(rawEl.eyebrow, rawEl.heading, 'gapEyebrowHeading')
    row.stackHD = stacked(rawEl.heading, rawEl.desc, 'gapHeadingDesc')
    detail.push(row)
  }
}
writeFileSync('docs/_audit-detail.json', JSON.stringify(detail, null, 1))

// ------------------------------------------------------------------ findings

const findings = []
const add = (id, severity, category, title, body) => findings.push({ id, severity, category, title, body })

// (a) same role, different sizes within a tier
for (const [key, m] of [...sizeMatrix.entries()].sort()) {
  const [role, t] = key.split('|')
  if (m.size <= 1) continue
  const entries = [...m.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  add('a', 'high', 'a', `${role} has ${entries.length} sizes in the ${t} tier`,
    entries.map(([sz, sites]) => `**${sz}** — ${[...new Set(sites)].length} sites: ${[...new Set(sites)].join(', ')}`).join('\n'))
}

// (b) heading hierarchy: h1 vs h2 per page/width
const h1v2 = new Map()
for (const r of raw.results) {
  const h1 = r.h1 ? parseFloat(r.h1.size) : null
  for (const s of r.sections) {
    if (!s.heading) continue
    if (s.heading.tag !== 'h2' && s.heading.tag !== 'h1') continue
    const hs = s.heading.fontSizePx
    const k = `${r.route}@${r.width}`
    if (!h1v2.has(k)) h1v2.set(k, [])
    h1v2.get(k).push({ block: s.block, tag: s.heading.tag, size: s.heading.fontSize, h1, ok: hs <= h1 + 0.01 })
  }
}
const badH = [...h1v2.entries()].filter(([, v]) => v.some((x) => !x.ok))
if (badH.length) {
  add('b', 'high', 'b', 'A section heading is larger than the page h1',
    badH.slice(0, 40).map(([k, v]) => {
      const [route, width] = k.split('@')
      return `- \`${route}\` @ ${width}px: h1 = ${v[0].h1}px, but ${v.filter((x) => !x.ok).map((x) => `\`${x.block}\` (${x.tag}) = ${x.size}`).join(', ')}`
    }).join('\n'))
}

// (b2) h2 sizes equal to h1 (no hierarchy)
const equalH = [...h1v2.entries()].filter(([, v]) => v.some((x) => x.tag === 'h2' && x.h1 && Math.abs(x.size - x.h1) < 0.01))
if (equalH.length) {
  add('b2', 'medium', 'b', 'h2 exactly equals the h1 (no hierarchy between them)',
    equalH.slice(0, 30).map(([k, v]) => {
      const [route, width] = k.split('@')
      const s = v.find((x) => x.tag === 'h2' && x.h1 && Math.abs(x.size - x.h1) < 0.01)
      return `- \`${route}\` @ ${width}px: h1 = ${s.h1}px, h2 \`${s.block}\` = ${s.size}`
    }).join('\n'))
}

// (b3) boundary steps
const BOUNDS = [[599, 600], [767, 768], [1023, 1024], [1099, 1100], [320, 375]]
const boundRows = []
for (const [lo, hi] of BOUNDS) {
  for (const route of raw.routes.map((x) => x.name)) {
    const a = byRouteWidth.get(`${route}@${lo}`)
    const b = byRouteWidth.get(`${route}@${hi}`)
    if (!a || !b) continue
    for (const role of ['eyebrow', 'heading', 'desc']) {
      for (let i = 0; i < Math.min(a.sections.length, b.sections.length); i++) {
        const ea = a.sections[i][role]
        const eb = b.sections[i][role]
        if (!ea || !eb) continue
        const da = parseFloat(ea.fontSize), db = parseFloat(eb.fontSize)
        if (Math.abs(db - da) > 0.05) {
          boundRows.push({ route, edge: `${lo}->${hi}`, role, block: a.sections[i].block, from: ea.fontSize, to: eb.fontSize, delta: r2(db - da) })
        }
      }
    }
  }
}
writeFileSync('docs/_audit-boundaries.json', JSON.stringify(boundRows, null, 1))
if (boundRows.length) {
  add('b3', 'high', 'b', 'Size steps at tier boundaries',
    boundRows.map((r) => `| ${r.route} | ${r.edge} | ${r.role} | \`${r.block}\` | ${r.from} -> ${r.to} | ${r.delta > 0 ? '+' : ''}${r.delta} |`).join('\n')
      .split('\n').map((l, i) => (i === 0 ? '| route | edge | role | section | from -> to | delta |\n|---|---|---|---|---|---|' : l)).join('\n'))
}

// (c) alignment: do the three roles sit on the same axis? Centred text is
// compared on its centre line and left-aligned text on its ink left edge, so a
// centred eyebrow over a centred heading is not mistaken for a misalignment
// just because their boxes have different widths.
const CENTRED = /^(center|centre)$/
const axis = (e) => {
  if (!e || e.firstLineLeft == null) return null
  return CENTRED.test(e.align) ? e.firstLineLeft + (e.lastLineRight - e.firstLineLeft) / 2 : e.firstLineLeft
}
const align = []
for (const row of detail) {
  const entries = [['eyebrow', row.eyebrow], ['heading', row.heading], ['desc', row.desc]]
    .filter(([, e]) => e && axis(e) != null)
  if (entries.length < 2) continue
  // A single mix of centred and start-aligned roles is itself the finding.
  const modes = new Set(entries.map(([, e]) => (CENTRED.test(e.align) ? 'centre' : 'start')))
  const vals = entries.map(([, e]) => axis(e))
  const spread = Math.max(...vals) - Math.min(...vals)
  if (spread > 1.5 || modes.size > 1) {
    align.push({
      route: row.route, width: row.width, tier: row.tier, block: row.block,
      spread: r2(spread), modes: [...modes],
      offenders: entries.filter(([, e]) => Math.abs(axis(e) - vals[0]) > 1.5).map(([n]) => n),
      aligns: entries.map(([n, e]) => `${n}:${e.align}@${r2(axis(e))}`),
    })
  }
}

// (d) too-small text
const tooSmall = []
for (const row of detail) {
  if (row.desc && row.desc.size && parseFloat(row.desc.size) < 16) tooSmall.push({ route: row.route, width: row.width, block: row.block, size: row.desc.size })
  if (row.eyebrow && row.eyebrow.size && parseFloat(row.eyebrow.size) < 12) tooSmall.push({ route: row.route, width: row.width, block: row.block, size: row.eyebrow.size, role: 'eyebrow' })
}

// (e) line-break defects, from the raw text
const breaks = []
for (const r of raw.results) {
  if (r.width !== 1440 && r.width !== 768 && r.width !== 390) continue
  for (const s of r.sections) {
    for (const role of ['eyebrow', 'heading', 'description']) {
      const el = s[role]
      if (!el) continue
      const txt = el.textRaw.replace(/\s+/g, ' ')
      for (const line of el.lines) {
        if (/^&\S/.test(line.text.trim()) || /^[&·-]/.test(line.text.trim())) {
          breaks.push({ kind: 'ampersand-starts-line', route: r.route, width: r.width, block: s.block, role, line: line.text })
        }
        if (/[a-z][,.]?[A-Z]/.test(txt) && /[a-zA-Z],[A-Z]/.test(txt)) {
          breaks.push({ kind: 'missing-space', route: r.route, width: r.width, block: s.block, role, text: txt.slice(0, 90) })
        }
      }
      // orphan: last line of a multi-line heading is a single short word
      if (role === 'heading' && el.lines.length > 1) {
        const last = el.lines[el.lines.length - 1].text.trim()
        if (last.split(/\s+/).length === 1 && last.length <= 4) {
          breaks.push({ kind: 'orphan-last-line', route: r.route, width: r.width, block: s.block, line: last, full: el.lines.map((l) => l.text).join(' | ') })
        }
      }
    }
  }
}

// (f) mixed weight/tracking/family for the same role, per tier
const mix = new Map()
for (const row of detail) {
  for (const role of ['eyebrow', 'heading', 'desc']) {
    const el = row[role]
    if (!el) continue
    const k = `${role}|${row.tier}`
    if (!mix.has(k)) mix.set(k, new Map())
    const m = mix.get(k)
    const sig = `${el.family}|${el.weight}|${el.style}|${el.track}|${el.color}`
    if (!m.has(sig)) m.set(sig, new Set())
    m.get(sig).add(`${row.route}/${row.block}`)
  }
}

// (h) contrast
const contrast = new Map()
for (const row of detail) {
  for (const role of ['eyebrow', 'heading', 'desc']) {
    const el = row[role]
    if (!el || !el.contrast) continue
    const k = `${role}|${el.color}`
    if (!contrast.has(k)) contrast.set(k, new Map())
    const m = contrast.get(k)
    const bk = `${el.contrast}`
    if (!m.has(bk)) m.set(bk, new Set())
    m.get(bk).add(`${row.route}/${row.block}`)
  }
}

// ------------------------------------------------------------------ gaps

// Only stacked pairs produce a real vertical gap. Side-by-side pairs (two
// column layouts) report their column height here and are excluded.
const gapTable = []
for (const key of ['gapEB', 'gapHD']) {
  const stackedKey = key === 'gapEB' ? 'stackEB' : 'stackHD'
  const roles = key === 'gapEB' ? ['eyebrow', 'heading'] : ['heading', 'desc']
  const m = new Map()
  for (const row of detail) {
    const v = row[key]
    if (v == null || row[stackedKey] === false) continue
    if (!m.has(`${row.route}/${row.block}`)) m.set(`${row.route}/${row.block}`, new Map())
    m.get(`${row.route}/${row.block}`).set(row.width, v)
  }
  for (const [site, byWidth] of m) {
    const vals = [...byWidth.entries()].sort((a, b) => a[0] - b[0])
    gapTable.push({
      pair: key === 'gapEB' ? roles.join('->') : roles.join('->'),
      site, widths: vals.map(([w, v]) => [w, v]),
      min: Math.min(...vals.map((x) => x[1])), max: Math.max(...vals.map((x) => x[1])),
      // true when the gap is one constant value at every width
      constant: new Set(vals.map((x) => x[1])).size === 1 ? vals[0][1] : null,
    })
  }
}
const sideBySide = []
for (const key of ['gapEB', 'gapHD']) {
  const stackedKey = key === 'gapEB' ? 'stackEB' : 'stackHD'
  for (const row of detail) {
    if (row[stackedKey] === false && row[key] != null) {
      const site = `${row.route}/${row.block}`
      if (!sideBySide.find((x) => x.site === site)) sideBySide.push({ pair: key, site, gap: row[key], width: row.width })
    }
  }
}

// ------------------------------------------------------------------ size curves

// Exact pixel values mostly reflect the same fluid clamp() sampled at different
// viewports, so they are not on their own an inconsistency. What matters is
// whether two sites follow the SAME curve. Each site's value at every audited
// width is compared against the other sites in its role+tier; sites whose
// sampled values match everywhere are one curve.
const widths = raw.widths
const curveOf = (role) => {
  const sites = new Map()
  for (const r of raw.results) {
    for (const s of r.sections) {
      const el = s[role]
      if (!el) continue
      const site = `${r.route}/${s.block}`
      if (!sites.has(site)) sites.set(site, new Map())
      sites.get(site).set(r.width, parseFloat(el.fontSize))
    }
  }
  const list = [...sites.entries()]
  const curves = []
  for (const [site, byWidth] of list) {
    const sig = widths.map((w) => byWidth.get(w)).join(',')
    const hit = curves.find((c) => c.sig === sig)
    if (hit) hit.sites.push(site)
    else curves.push({ sig, sites: [site], sizes: Object.fromEntries(widths.map((w) => [w, byWidth.get(w)])) })
  }
  return curves.sort((a, b) => b.sites.length - a.sites.length)
}
const curves = { eyebrow: curveOf('eyebrow'), heading: curveOf('heading'), desc: curveOf('desc') }

// ------------------------------------------------------------------ tables

const KEY = [320, 375, 414, 599, 600, 744, 768, 1023, 1024, 1099, 1100, 1440, 1920]
const tables = []
for (const r of raw.routes) {
  const rows = []
  const seen = new Set()
  for (const w of widths) {
    const res = byRouteWidth.get(`${r.name}@${w}`)
    if (!res) continue
    for (const s of res.sections) {
      if (!seen.has(s.block)) { seen.add(s.block); rows.push({ block: s.block, tag: s.blockTag }) }
    }
  }
  for (const row of rows) {
    const sample = byRouteWidth.get(`${r.name}@1440`)?.sections.find((s) => s.block === row.block)
      || byRouteWidth.get(`${r.name}@768`)?.sections.find((s) => s.block === row.block)
    row.headingTag = sample?.heading?.tag || ''
    for (const role of ['eyebrow', 'heading', 'desc']) {
      // every audited width, so the table lines up with the header
      row[role] = widths.map((w) => {
        const s = byRouteWidth.get(`${r.name}@${w}`)?.sections.find((x) => x.block === row.block)
        const el = s?.[role]
        return el ? parseFloat(el.fontSize) : null
      })
    }
  }
  tables.push({ route: r.name, path: r.path, rows })
}

const out = {
  inventory, boundRows, align, tooSmall, breaks,
  curves: Object.fromEntries(Object.entries(curves).map(([k, v]) => [k, v.map((c) => ({ sites: c.sites, sizes: c.sizes }))])),
  gapTable, sideBySide, tables, keyWidths: KEY,
  contrast: Object.fromEntries([...contrast.entries()].map(([k, m]) => [k, [...m.entries()].map(([cr, sites]) => ({ cr, sites: [...new Set(sites)] }))])),
  overflow: raw.results.filter((r) => r.overflowX).map((r) => ({ route: r.route, width: r.width, scrollW: r.scrollW, innerW: r.innerW })),
}
writeFileSync('docs/_audit-findings.json', JSON.stringify(out, null, 1))

console.log('=== INVENTORY ===')
for (const i of inventory) console.log(`${i.route.padEnd(9)} ${i.block.slice(0, 34).padEnd(34)} E:${i.eyebrow.slice(0, 26).padEnd(26)} H:${i.heading.slice(0, 30).padEnd(30)} D:${i.desc.slice(0, 34)}`)
console.log('\n=== SIZES PER TIER ===')
for (const [k, m] of sizeMatrix) {
  console.log(`${k}: ${[...m.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([sz, s]) => `${sz}(${new Set(s).size})`).join('  ')}`)
}
console.log('\n=== MIX (family|weight|style|tracking|color) ===')
for (const [k, m] of mix) {
  console.log(`${k}:`)
  for (const [sig, s] of m) console.log(`   ${sig}  x${new Set(s).size}  e.g. ${[...new Set(s)].slice(0, 4).join(', ')}`)
}
console.log('\n=== CONTRAST ===')
for (const [k, v] of Object.entries(out.contrast)) console.log(`${k}: ${v.map((x) => `${x.cr}(${x.sites.length})`).join('  ')}`)
console.log('\n=== BOUNDARY STEPS ===', out.boundRows.length)
console.log('=== ALIGNMENT spread > 1.5px ===', out.align.length)
console.log('=== TOO SMALL (<16 desc, <12 eyebrow) ===', out.tooSmall.length)
console.log('=== BREAK DEFECTS ===', out.breaks.length)
console.log('=== OVERFLOW-X ===', out.overflow.length)
