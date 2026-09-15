import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const report = []
let totalOriginal = 0
let totalOptimized = 0

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (full.toLowerCase().endsWith('.svg')) {
      out.push(full)
    }
  }
  return out
}

const DATA_URI_RE = /data:image\/(?:png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)/g

async function processSvg(filePath) {
  const originalSize = statSync(filePath).size
  const text = readFileSync(filePath, 'utf8')
  const rel = filePath.replace(root + (process.platform === 'win32' ? '\\' : '/'), '')

  const matches = [...text.matchAll(DATA_URI_RE)]
  if (matches.length === 0) {
    report.push({ file: rel, originalKb: Math.round(originalSize / 1024), optimizedKb: Math.round(originalSize / 1024), reduction: '0.0%', note: 'true vector, left unchanged' })
    totalOriginal += originalSize
    totalOptimized += originalSize
    return
  }

  totalOriginal += originalSize
  let newText = text
  let newBytes = 0
  const images = []
  let index = 0

  for (const match of matches) {
    const b64 = match[1].replace(/\s+/g, '')
    const buffer = Buffer.from(b64, 'base64')
    const meta = await sharp(buffer).metadata()
    const webp = await sharp(buffer).webp({ quality: 82, alphaQuality: 92 }).toBuffer()
    const dataUri = `data:image/webp;base64,${webp.toString('base64')}`
    images.push({ name: `${index + 1}`, size: webp.length, width: meta.width, height: meta.height })
    newBytes += webp.length
    newText = newText.replace(match[0], dataUri)
    index++
  }

  writeFileSync(filePath, newText)
  const newSvgSize = Buffer.byteLength(newText, 'utf8')
  const optimizedKb = Math.round((newBytes + newSvgSize) / 1024)
  totalOptimized += newBytes + newSvgSize
  const reduction = ((1 - (newBytes + newSvgSize) / originalSize) * 100).toFixed(1)
  report.push({
    file: rel,
    originalKb: Math.round(originalSize / 1024),
    optimizedKb,
    reduction: `${reduction}%`,
    webp: images.map((i) => `${i.name} (${i.width}x${i.height}, ${Math.round(i.size / 1024)} KB)`).join(', '),
    note: matches.length > 1 ? `${matches.length} embedded images` : '',
  })
}

function main() {
  const files = walk(root)
  return Promise.all(files.map(processSvg)).then(() => {
    const fmt = (kb) => (kb / 1024).toFixed(2) + ' MB'
    console.log('TOTAL original: ' + fmt(totalOriginal / 1024))
    console.log('TOTAL optimized: ' + fmt(totalOptimized / 1024))
    console.log('TOTAL saved: ' + fmt((totalOriginal - totalOptimized) / 1024) + ' (' + (((1 - totalOptimized / totalOriginal) * 100).toFixed(1)) + '%)')
    console.log('\n=== PER-FILE REPORT ===')
    for (const r of report) {
      if (r.webp) {
        console.log(`${r.file}: ${r.originalKb} KB -> ${r.optimizedKb} KB (${r.reduction})  [${r.webp}]${r.note ? ' ' + r.note : ''}`)
      } else {
        console.log(`${r.file}: ${r.originalKb} KB -> ${r.optimizedKb} KB (${r.reduction})  ${r.note}`)
      }
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})