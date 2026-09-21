#!/usr/bin/env node
/**
 * Paris Beans - extract embedded WebP from gallery_hero SVGs and emit
 * responsive srcset variants.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'gallery_hero');

function parseDataUri(svg) {
  const re = /<image[^>]*xlink:href="data:image\/webp;base64,([^"]*)"[^>]*>/g;
  const out = [];
  let m;
  while ((m = re.exec(svg)) !== null) {
    out.push(Buffer.from(m[1], 'base64'));
  }
  return out;
}

const FILES = [
  'Photo rectangle.svg',
  'Photo rectangle (1).svg',
  'Photo rectangle (2).svg',
  'Photo rectangle (3).svg',
  'Photo rectangle (4).svg',
  'Photo rectangle (5).svg',
  'Photo rectangle (6).svg',
];

async function main() {
  for (const f of FILES) {
    const svgPath = path.join(OUT, f);
    const svg = fs.readFileSync(svgPath, 'utf8');
    const bufs = parseDataUri(svg);
    if (bufs.length === 0) {
      console.log('no embedded raster in', f);
      continue;
    }
    const src = bufs[0];
    const meta = await sharp(src).metadata();
    console.log(f, 'raster', meta.width, 'x', meta.height);

    const base = f.replace(/\.svg$/, '').replace(/[()]/g, '');
    for (const w of [480, 800]) {
      const buf = await sharp(src).resize(w, Math.round(meta.height * w / meta.width), { fit: 'inside' }).webp({ quality: 82, effort: 4 }).toBuffer();
      const out = path.join(OUT, base + '-' + w + '.webp');
      fs.writeFileSync(out, buf);
      console.log('  wrote', path.basename(out), Math.round(buf.length / 1024), 'KB');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });