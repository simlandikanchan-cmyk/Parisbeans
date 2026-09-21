#!/usr/bin/env node
/**
 * Paris Beans - optimize embedded raster inside exported SVGs.
 *
 * Design tool exports (Figma -> SVG) embed the original 4096x2731 WebP
 * raster inside every <image> tag, then scale it down with a transform
 * matrix. Browsers decode the full 4K raster regardless of the rendered
 * size, so a 282x333px photo on screen costs ~500KB on the wire.
 *
 * This script:
 *   1. Finds every SVG in public/images that contains an embedded raster.
 *   2. Decodes the base64 WebP, resizes it to the SVG's intrinsic
 *      width/height (capped at 1600px on the long edge for hero images),
 *      re-encodes as WebP at q=80.
 *   3. Rewrites the SVG with the smaller data URI.
 *
 * Safe to run repeatedly; it only touches SVGs that contain embedded rasters.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const MAX_LONG_EDGE = 1600;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && /\.svg$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function parseDataUri(svg) {
  const re = /<image[^>]*xlink:href="data:image\/(webp|jpeg|png);base64,([^"]*)"/gi;
  const out = [];
  let m;
  while ((m = re.exec(svg)) !== null) {
    out.push({
      format: m[1],
      buffer: Buffer.from(m[2], 'base64'),
      raw: m[0],
    });
  }
  return out;
}

function findIntrinsicSize(svg) {
  const m = /<svg[^>]*\bwidth="([\d.]+)"\b[^>]*\bheight="([\d.]+)"/i.exec(svg);
  if (m) return { width: parseFloat(m[1]), height: parseFloat(m[2]) };
  const vb = /<svg[^>]*\bviewBox="([\d.\s-]+)"/i.exec(svg);
  if (vb) {
    const parts = vb[1].trim().split(/[\s,]+/);
    if (parts.length === 4) {
      return { width: parseFloat(parts[2]), height: parseFloat(parts[3]) };
    }
  }
  return null;
}

async function optimizeFile(file) {
  const svg = fs.readFileSync(file, 'utf8');
  const images = parseDataUri(svg);
  if (images.length === 0) return null;

  const intrinsic = findIntrinsicSize(svg) || { width: 1600, height: 1600 };
  const targetW = Math.min(intrinsic.width, MAX_LONG_EDGE);
  const targetH = Math.min(intrinsic.height, MAX_LONG_EDGE);
  const scale = Math.min(targetW / intrinsic.width, targetH / intrinsic.height, 1);
  const w = Math.max(1, Math.round(intrinsic.width * scale));
  const h = Math.max(1, Math.round(intrinsic.height * scale));

  let out = svg;
  let saved = 0;
  for (const img of images) {
    const before = img.buffer.length;
    let pipeline = sharp(img.buffer).resize(w, h, { fit: 'inside', withoutEnlargement: true });
    if (img.format === 'webp') {
      pipeline = pipeline.webp({ quality: 80, effort: 4 });
    } else if (img.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: 80 });
    } else {
      pipeline = pipeline.png({ quality: 80 });
    }
    const buf = await pipeline.toBuffer();
    const b64 = buf.toString('base64');
    const dataUri = 'data:image/webp;base64,' + b64;
    const replacement = img.raw.replace(/xlink:href="data:image\/[a-z]+;base64,[^"]*"/, 'xlink:href="' + dataUri + '"');
    out = out.replace(img.raw, replacement);
    saved += before - buf.length;
  }

  if (out !== svg) {
    fs.writeFileSync(file, out);
    return { file: path.relative(ROOT, file), saved };
  }
  return null;
}

async function main() {
  const files = walk(IMAGES_DIR);
  let totalSaved = 0;
  let count = 0;
  for (const file of files) {
    const r = await optimizeFile(file);
    if (r) {
      count++;
      totalSaved += r.saved;
      console.log(r.file + ': saved ' + Math.round(r.saved / 1024) + ' KB');
    }
  }
  console.log('\nOptimized ' + count + ' SVGs, total saved ' + Math.round(totalSaved / 1024) + ' KB');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});