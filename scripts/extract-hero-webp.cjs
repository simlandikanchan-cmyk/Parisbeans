#!/usr/bin/env node
/**
 * Paris Beans - extract embedded WebP from hero SVGs and emit
 * responsive srcset variants.
 *
 * The hero images (salon-interior.svg) are rendered at up to 1920px
 * wide on desktop but collapse to ~375px on mobile. Serving the same
 * 1600px file to a phone wastes ~80KB per load. We extract the WebP
 * raster and emit 480/800/1200/1600px variants so <picture srcset>
 * can pick the right one.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'images', 'hero');

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

async function main() {
  const svgPath = path.join(ROOT, 'public', 'images', 'hero', 'salon-interior.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');
  const bufs = parseDataUri(svg);
  if (bufs.length === 0) {
    console.log('no embedded raster in', svgPath);
    return;
  }
  const src = bufs[0];
  const dims = intrinsic(svg);
  console.log('source raster:', src.length, 'bytes, svg intrinsic', dims?.w, 'x', dims?.h);

  const base = sharp(src);
  const meta = await base.metadata();
  console.log('raster actual:', meta.width, 'x', meta.height);

  const sizes = [480, 800, 1200, 1600];
  for (const w of sizes) {
    const buf = await sharp(src).resize(w, Math.round(meta.height * w / meta.width), { fit: 'inside' }).webp({ quality: 82, effort: 4 }).toBuffer();
    const out = path.join(OUT, 'salon-interior-' + w + '.webp');
    fs.writeFileSync(out, buf);
    console.log('  wrote', path.basename(out), Math.round(buf.length / 1024), 'KB');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });