// Emits docs/_audit-appendix.md: the full computed-value tables that back the
// audit. Appended to docs/typography-audit.md so every measured number in the
// document is traceable to the harness output rather than retyped.
import { readFileSync, writeFileSync } from 'node:fs'

const f = JSON.parse(readFileSync('docs/_audit-findings.json', 'utf8'))
const detail = JSON.parse(readFileSync('docs/_audit-detail.json', 'utf8'))
const raw = JSON.parse(readFileSync('docs/_audit-raw.json', 'utf8'))

const W = raw.widths
const r2 = (n) => (n == null ? '' : String(Math.round(n * 100) / 100))
const roleLabel = { eyebrow: 'Eyebrow', heading: 'Heading', desc: 'Description' }

const out = []
out.push('## Appendix A. Computed font size at all 17 audited widths')
out.push('')
out.push('Tiers: phone `<600`, tablet `600-1099`, desktop `>=1100`. Values are the')
out.push('rendered `font-size` in px at each viewport width, measured on the live')
out.push('page. `20.0` flat across a whole column marks a hard-coded value rather')
out.push('than a fluid one.')
out.push('')

for (const t of f.tables) {
  out.push(`### ${t.route} — \`${t.path}\``)
  out.push('')
  for (const role of ['eyebrow', 'heading', 'desc']) {
    const any = t.rows.some((r) => r[role].some((v) => v != null))
    if (!any) continue
    out.push(`**${roleLabel[role]}**`)
    out.push('')
    out.push(`| section | ${W.join(' | ')} |`)
    out.push(`|---|${W.map(() => '---').join('|')}|`)
    for (const row of t.rows) {
      if (!row[role].some((v) => v != null)) continue
      const name = row.headingTag && role === 'heading' ? `\`${row.headingTag}\` ${row.block}` : row.block
      const cells = row[role].map((v) => (v == null ? '—' : r2(v)))
      // annotate a run of identical values so hard-coded steps stand out
      let run = 1
      for (let i = 1; i <= cells.length; i++) {
        if (i < cells.length && cells[i] === cells[i - 1]) { run++; continue }
        if (run > 2) cells[i - 1] = `${cells[i - 1]} (flat)`
        run = 1
      }
      out.push(`| ${name} | ${cells.join(' | ')} |`)
    }
    out.push('')
  }
}

out.push('## Appendix B. Full computed style per role')
out.push('')
out.push('Sampled at 320, 768 and 1440. `lh` is the used line-height in px, `trk`')
out.push('the computed letter-spacing, `max-w` the resolved max-width.')
out.push('')
for (const t of f.tables) {
  out.push(`### ${t.route} — \`${t.path}\``)
  out.push('')
  out.push('| section | role | w | family | size | weight | style | lh | trk | colour | align | wrap | max-w | lines | contrast |')
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const block of t.rows) {
    for (const role of ['eyebrow', 'heading', 'desc']) {
      for (const w of [320, 768, 1440]) {
        const row = detail.find((x) => x.width === w && x.block === block.block && x.route === t.route)
        const e = row && row[role]
        if (!e) continue
        out.push(`| \`${block.block}\` | ${role} | ${w} | ${e.family} | ${e.size} | ${e.weight} | ${e.style} | ${e.lh} | ${e.track} | \`${e.color}\` | ${e.align} | ${e.wrap} | ${e.maxW} | ${e.lines} | ${e.contrast ?? 'over image'} |`)
      }
    }
  }
  out.push('')
}

out.push('## Appendix C. Type ramp signatures')
out.push('')
out.push('Sites grouped by the exact sequence of sizes they produce across all 17')
out.push('widths. Sites sharing a signature follow the identical ramp, so a')
out.push('separate signature means a separate declaration, not merely a different')
out.push('sample point.')
out.push('')
for (const role of ['eyebrow', 'heading', 'desc']) {
  out.push(`### ${roleLabel[role]} — ${f.curves[role].length} distinct ramps`)
  out.push('')
  for (const c of f.curves[role]) {
    const flat = Object.entries(c.sizes).filter(([, v]) => v != null)
    out.push(`- **${c.sites.length} site${c.sites.length > 1 ? 's' : ''}** — ${c.sites.join(', ')}`)
    out.push(`  - ramp: ${flat.map(([w, v]) => `${w}:${r2(v)}`).join('  ')}`)
  }
  out.push('')
}

const appendix = out.join('\n').trimEnd() + '\n'
writeFileSync('docs/_audit-appendix.md', appendix)

// Splice into the audit document so the prose and the tables cannot drift
// apart. Everything from the Appendix A heading onwards is regenerated.
const DOC = 'docs/typography-audit.md'
const MARKER = '## Appendix A.'
const doc = readFileSync(DOC, 'utf8')
const at = doc.indexOf(MARKER)
if (at === -1) throw new Error(`${DOC} has no "${MARKER}" heading to replace`)
writeFileSync(DOC, doc.slice(0, at) + appendix)
console.log('wrote docs/_audit-appendix.md and spliced it into docs/typography-audit.md')
console.log('appendix lines:', out.length)