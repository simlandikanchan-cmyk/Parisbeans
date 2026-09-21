#!/usr/bin/env node
/**
 * Paris Beans - optimize story assets (WebM video + oversized PNG/WebP).
 *
 * logo.webm is a 2MB looping brand animation played on every page load.
 * We re-encode it to a much smaller WebM (VP9, 720p, ~24fps, ~250kbps).
 *
 * phonegallery.png (390x411, 189KB) and img.webp (1935x939, 150KB) are
 * also resized to match their rendered size.
 *
 * Writes go through a temp file + PowerShell `Copy-Item -Force` because
 * some Windows filesystems reject rename/copy over an open destination
 * from Node's fs module.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const STORY = path.join(ROOT, 'public', 'images', 'story');
const FFMPEG = require('ffmpeg-static');
const TMP = os.tmpdir();

function atomicWrite(dest, buf) {
  const tmp = path.join(TMP, 'pb-' + process.pid + '-' + Math.random().toString(36).slice(2) + path.extname(dest));
  fs.writeFileSync(tmp, buf);
  const r = spawnSync('powershell', ['-NoProfile', '-Command', 'Copy-Item -Force -LiteralPath "' + tmp + '" -Destination "' + dest + '"'], { stdio: 'pipe' });
  if (r.status !== 0) {
    fs.unlinkSync(tmp);
    throw new Error('copy failed: ' + (r.stderr || '').toString());
  }
  fs.unlinkSync(tmp);
}

function run(args) {
  const r = spawnSync(FFMPEG, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed (' + r.status + ')');
}

async function optimizeWebM() {
  const src = path.join(STORY, 'logo.webm');
  const tmp = path.join(TMP, 'logo.webm');
  const before = fs.statSync(src).size;

  // Re-encode: 720p cap, 24fps, ~250k video. VP9 is well supported in
  // modern browsers and compresses brand animations well. No audio track
  // needed for a silent logo loop.
  run([
    '-y', '-i', src,
    '-c:v', 'libvpx-vp9',
    '-b:v', '250k',
    '-maxrate', '300k',
    '-bufsize', '500k',
    '-pix_fmt', 'yuva420p',
    '-r', '24',
    '-s', '720x720',
    '-an',
    '-deadline', 'good',
    '-cpu-used', '4',
    tmp,
  ]);

  const after = fs.statSync(tmp).size;
  atomicWrite(src, fs.readFileSync(tmp));
  fs.unlinkSync(tmp);
  console.log('logo.webm: ' + Math.round(before / 1024) + ' KB -> ' + Math.round(after / 1024) + ' KB');
}

async function optimizePNG() {
  const src = path.join(STORY, 'phonegallery.png');
  const before = fs.statSync(src).size;
  const buf = await sharp(src).resize(390, 411, { fit: 'inside' }).png({ quality: 80 }).toBuffer();
  atomicWrite(src, buf);
  console.log('phonegallery.png: ' + Math.round(before / 1024) + ' KB -> ' + Math.round(buf.length / 1024) + ' KB');
}

async function optimizeWebP() {
  const src = path.join(STORY, 'img.webp');
  const before = fs.statSync(src).size;
  const buf = await sharp(src).resize(1200, 590, { fit: 'inside' }).webp({ quality: 80, effort: 4 }).toBuffer();
  atomicWrite(src, buf);
  console.log('img.webp: ' + Math.round(before / 1024) + ' KB -> ' + Math.round(buf.length / 1024) + ' KB');
}

async function main() {
  await optimizeWebM();
  await optimizePNG();
  await optimizeWebP();
}

main().catch((e) => { console.error(e); process.exit(1); });