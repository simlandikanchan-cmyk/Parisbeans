#!/usr/bin/env node
/**
 * Paris Beans - extract embedded WebP from OurStoryHero panel SVGs and
 * emit responsive srcset variants.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'story');

function parseDataUri(svg) {
  const re = /<image[^>]*xlink:href="data:image\/webp;base64,([^"]*)"[^>]*>/g;
  const out = [];
  let m;
  while ((m = re.exec(svg)) !== null) {
    out.push(Buffer.from(m[1], 'base64'));
  }
  return out;
}

function intrinsic(svg) {
  const m = /<svg[^>]*\bwidth="([\d.]+)"\b[^>]*\bheight="([\d.]+)"/i.exec(svg);
  if (m) return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
  const vb = /<svg[^>]*\bviewBox="([\d.\s-]+)"/i.exec(svg);
  if (vb) {
    const p = vb[1].trim().split(/[\s,]+/);
    if (p.length === 4) return { w: parseFloat(p[2]), h: parseFloat(p[3]) };
  }
  return null;
}

const PANELS = [
  { svg: 'Rectangle 73.svg', sizes: [480, 800, 1200] },
  { svg: 'Rectangle 74.svg', sizes: [480, 800, 1200] },
  { svg: 'Rectangle 75.svg', sizes: [480, 800, 1200] },
];

async function main() {
  for (const p of PANELS) {
    const svgPath = path.join(OUT, p.svg);
    const svg = fs.readFileSync(svgPath, 'utf8');
    const bufs = parseDataUri(svg);
    if (bufs.length === 0) {
      console.log('no embedded raster in', p.svg);
      continue;
    }
    const src = bufs[0];
    const meta = await sharp(src).metadata();
    const dims = intrinsic(svg);
    console.log(p.svg, 'raster', meta.width, 'x', meta.height, 'svg', dims?.w, 'x', dims?.h);

    const base = p.svg.replace(/\.svg$/, '');
    for (const w of p.sizes) {
      const buf = await sharp(src).resize(w, Math.round(meta.height * w / meta.width), { fit: 'inside' }).webp({ quality: 82, effort: 4 }).toBuffer();
      const out = path.join(OUT, base + '-' + w + '.webp');
      fs.writeFileSync(out, buf);
      console.log('  wrote', path.basename(out), Math.round(buf.length / 1024), 'KB');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });