import puppeteer from 'file:///C:/Users/stdlocal/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo'
const GOLD = [0xc7, 0xa4, 0x5a]
const WIDTHS = [320, 375, 600, 744, 1023, 1024, 1100, 1440]
const DIFF_WIDTHS = new Set([375, 600, 744, 1023])

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 300000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--font-render-hinting=none',
    '--disable-partial-raster',
    '--disable-checker-imaging',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
  ],
})

const report = []
const say = (s) => {
  console.log(s)
  report.push(s)
}

for (const w of WIDTHS) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 1200, deviceScaleFactor: 1 })
  await page.goto('http://localhost:5173/our-story', { waitUntil: 'networkidle0', timeout: 60000 })
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}html{scroll-behavior:auto!important}`,
  })
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null)))
    scrollTo(0, document.querySelector('.ostory-origin').getBoundingClientRect().top + scrollY - 16)
    document.getAnimations().forEach((a) => {
      try {
        a.finish()
      } catch {
        try {
          a.pause()
        } catch {
          /* static */
        }
      }
    })
  })
  await new Promise((r) => setTimeout(r, 1500))

  const g = await page.evaluate(() => {
    const n = (x) => Math.round(x * 100) / 100
    const sec = document.querySelector('.ostory-origin')
    const img = sec.querySelector('.ostory-emblem-photo img')
    const photoEl = sec.querySelector('.ostory-emblem-photo')
    const photo = photoEl.getBoundingClientRect()
    const ring = sec.querySelector('.pb-story-ring')
    const svgEl = sec.querySelector('.pb-story-ring__svg')
    const tp = sec.querySelector('textPath')
    const txt = sec.querySelector('.pb-story-ring__text')

    let arc = null
    const p = document.querySelector('#pb-story-ring-arc')
    if (p && svgEl) {
      const vb = svgEl.viewBox.baseVal
      const cx = vb.width / 2
      const cy = vb.height / 2
      const total = p.getTotalLength()
      const a = p.getPointAtLength(0)
      const b = p.getPointAtLength(total)
      const deg = (q) => (((Math.atan2(cx - q.x, cy - q.y) * 180) / Math.PI) + 360) % 360
      const rr = Math.hypot(a.x - cx, a.y - cy)
      const tcs = getComputedStyle(txt)
      const fs = parseFloat(tcs.fontSize)
      const cctx = document.createElement('canvas').getContext('2d')
      cctx.font = `${tcs.fontStyle} ${tcs.fontWeight} ${fs}px ${tcs.fontFamily}`
      const m = cctx.measureText('H')
      const capEm = fs ? m.actualBoundingBoxAscent / fs : 0
      arc = {
        vb: `${vb.width}x${vb.height}`,
        startDeg: n(deg(a)),
        endDeg: n(deg(b)),
        runDeg: n((((deg(b) - deg(a)) % 360) + 360) % 360),
        r: n(rr),
        rOverPhotoR: n(rr / (vb.width / 2)),
        len: n(total),
        textLength: n(parseFloat(tp.getAttribute('textLength'))),
        startOffset: tp.getAttribute('startOffset'),
        lengthAdjust: tp.getAttribute('lengthAdjust'),
        dy: txt.getAttribute('dy'),
        role: svgEl.getAttribute('role'),
        label: svgEl.getAttribute('aria-label'),
        body: tp.textContent,
        capEm: n(capEm),
        baselineR: n(rr + 0.35 * fs),
        centreLineR: n(rr + 0.35 * fs - (0.35 * fs)),
        bandInnerR: n(rr + 0.35 * fs - capEm * fs),
        bandOuterR: n(rr + 0.35 * fs),
      }
    }
    const tcs = txt ? getComputedStyle(txt) : null
    const svgCs = svgEl ? getComputedStyle(svgEl) : null

    // leftmost glyph box on the ring (deterministic; no pixels involved)
    let leftmost = null
    if (tp) {
      const r = document.createRange()
      r.selectNodeContents(tp)
      const rects = [...r.getClientRects()].filter((x) => x.width > 0.4 && x.height > 0.4)
      if (rects.length) {
        leftmost = {
          l: n(Math.min(...rects.map((x) => x.left))),
          r: n(Math.max(...rects.map((x) => x.right))),
          t: n(Math.min(...rects.map((x) => x.top))),
          b: n(Math.max(...rects.map((x) => x.bottom))),
          boxes: rects.length,
        }
      }
    }

    const h2 = sec.querySelector('.ostory-origin-title')
    const hs = getComputedStyle(h2)
    const tw = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT)
    const chars = []
    for (let nd = tw.nextNode(); nd; nd = tw.nextNode())
      for (let i = 0; i < nd.length; i++) chars.push([nd, i])
    const one = document.createRange()
    one.setStart(chars[0][0], 0)
    one.setEnd(chars[0][0], 1)
    const top0 = one.getBoundingClientRect().top
    let k = 0
    for (; k < chars.length; k++) {
      one.setStart(chars[k][0], chars[k][1])
      one.setEnd(chars[k][0], chars[k][1] + 1)
      if (one.getBoundingClientRect().top > top0 + 2) break
    }
    const en = chars[Math.max(0, k - 1)]
    const l1 = document.createRange()
    l1.setStart(chars[0][0], 0)
    l1.setEnd(en[0], en[1] + 1)
    const l1r = l1.getBoundingClientRect()
    let l1txt = ''
    for (let i = 0; i < k; i++) l1txt += chars[i][0].data[chars[i][1]]
    const allr = document.createRange()
    allr.selectNodeContents(h2)
    const tops = new Set([...allr.getClientRects()].map((r) => Math.round(r.top)))

    const eb = sec.querySelector('.ostory-origin .ostory-eyebrow')
    const ebs = getComputedStyle(eb)
    const r3 = document.createRange()
    r3.selectNodeContents(eb)
    const er = [...r3.getClientRects()].filter((x) => x.width > 0.2)
    const ebL = Math.min(...er.map((x) => x.left))
    const ebR = Math.max(...er.map((x) => x.right))

    return {
      vw: innerWidth,
      scrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      photo: { l: n(photo.left), t: n(photo.top), w: n(photo.width), h: n(photo.height) },
      photoR: n(photo.width / 2),
      borderRadius: getComputedStyle(photoEl).borderRadius,
      imgClip: getComputedStyle(img).clipPath,
      ringDisplay: getComputedStyle(ring).display,
      ringPointer: getComputedStyle(ring).pointerEvents,
      svgOverflow: svgCs ? svgCs.overflow : 'n/a',
      svgPosition: svgCs ? svgCs.position : 'n/a',
      fontSize: tcs ? tcs.fontSize : 'n/a',
      fontStyle: tcs ? tcs.fontStyle : 'n/a',
      fontWeight: tcs ? tcs.fontWeight : 'n/a',
      fontFamily: tcs ? tcs.fontFamily.split(',')[0] : 'n/a',
      letterSpacing: tcs ? tcs.letterSpacing : 'n/a',
      fill: tcs ? tcs.fill : 'n/a',
      arc,
      leftmost,
      h2: {
        fontSize: hs.fontSize,
        lineBoxes: tops.size,
        line1Text: l1txt.trim(),
        line1Rendered: n(l1r.width),
        line1Left: n(l1r.left),
        line1Right: n(l1r.right),
      },
      eb: {
        fontSize: ebs.fontSize,
        ls: ebs.letterSpacing,
        inkW: n(ebR - ebL),
        inkNoTrail: n(ebR - ebL - parseFloat(ebs.letterSpacing || 0)),
      },
    }
  })

  let pxLine = null
  if (DIFF_WIDTHS.has(w)) {
    // The old baked ring lives entirely inside the photo's own box, and the clip
    // can only ever remove pixels from there, so the diff runs over that box.
    const clip = {
      x: Math.floor(g.photo.l),
      y: Math.floor(g.photo.t),
      width: Math.ceil(g.photo.w),
      height: Math.ceil(g.photo.h),
    }

    // A clipped page.screenshot() can hand back half-rastered tiles that read as
    // pure white and are byte-identical across retries, which silently corrupts
    // every count below. Full-viewport captures plus --disable-partial-raster
    // force the whole surface, and unrasteredWhite is asserted to be 0 so a bad
    // capture can never masquerade as a clean pass.
    const stable = async (mutate) => {
      if (mutate) await page.evaluate(mutate)
      await new Promise((r) => setTimeout(r, 400))
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      )
      let prev = await page.screenshot({ encoding: 'base64' })
      let same = 0
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 250))
        const next = await page.screenshot({ encoding: 'base64' })
        if (next === prev) same++
        else {
          prev = next
          same = 0
        }
      }
      return { png: prev, tries: 6, stable: same >= 3 }
    }

    const sA = await stable(null)
    const sB = await stable(() =>
      document.querySelector('.pb-story-ring').style.setProperty('display', 'none')
    )
    const sC = await stable(() => {
      document.querySelector('.ostory-emblem-photo img').style.clipPath = 'none'
    })
    writeFileSync(`${OUT}\\rv-${w}.png`, Buffer.from(sA.png, 'base64'))

    // ── the diff, in node: sharp decodes the three PNGs and the loop runs over
    // raw buffers. Doing this in the page meant shipping three base64 frames
    // over CDP and looping 350k pixels inside a page that also has to keep
    // painting, which blew the protocol timeout at 744px and up.
    const raw = async (b64) => {
      const { data, info } = await sharp(Buffer.from(b64, 'base64'))
        .extract({ left: clip.x, top: clip.y, width: clip.width, height: clip.height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      return { d: data, w: info.width, h: info.height }
    }
    const [A2, B2, C2] = await Promise.all([raw(sA.png), raw(sB.png), raw(sC.png)])

    // ARCH_CLIP, straight off the JSX, in objectBoundingBox units
    const CX = 0.529151
    const CY = 0.47225
    const RR = 0.472451 * 0.472451
    const [gr, gg, gb] = GOLD
    const T = 12
    const GT = 24
    const pl = g.photo.l
    const pt = g.photo.t
    const pw = g.photo.w
    const ph = g.photo.h
    const px0 = clip.x
    const py0 = clip.y
    const W = A2.w
    const H = A2.h

    let photoChangedInside = 0
    let goldOutsideB = 0
    let goldOutsideC = 0
    let oldRingRemovedOutside = 0
    let oldRingGoldOutside = 0
    let unrasteredWhite = 0
    let underlineB = 0
    let underlineC = 0
    let gL = Infinity
    let gR = -Infinity
    let gT = Infinity
    let gB = -Infinity
    for (let y = 0; y < H; y++) {
      const vy = y + py0
      const fy = (vy - pt) / ph
      const row = y * W * 4
      // photo.svg draws its gold underline at y=620.364, i.e. below the arch
      // (arch floor y=589.495), so the clip takes it with the ring
      const onUnderline = Math.abs(fy - 620.364 / 624) * ph <= 2.5
      for (let x = 0; x < W; x++) {
        const vx = x + px0
        const fx = (vx - pl) / pw
        const i = row + x * 4
        const b0 = B2.d[i]
        const b1 = B2.d[i + 1]
        const b2 = B2.d[i + 2]
        const c0 = C2.d[i]
        const c1 = C2.d[i + 1]
        const c2 = C2.d[i + 2]
        if (b0 === 255 && b1 === 255 && b2 === 255 && B2.d[i + 3] === 255) unrasteredWhite++
        let ins
        if (fx < 0 || fy < 0 || fx > 1 || fy > 1) {
          ins = false
        } else {
          const dx = fx - CX
          const dy = fy - CY
          ins = dx * dx + dy * dy <= RR || (fx >= CX && fy >= CY && fx <= 1.001607 && fy <= 0.944704)
        }
        if (!ins) {
          if (Math.abs(b0 - gr) <= GT && Math.abs(b1 - gg) <= GT && Math.abs(b2 - gb) <= GT) {
            goldOutsideB++
            if (onUnderline) underlineB++
            if (vx < gL) gL = vx
            if (vx > gR) gR = vx
            if (vy < gT) gT = vy
            if (vy > gB) gB = vy
          }
          if (Math.abs(c0 - gr) <= GT && Math.abs(c1 - gg) <= GT && Math.abs(c2 - gb) <= GT) {
            goldOutsideC++
            if (onUnderline) underlineC++
          }
        }
        if (Math.abs(b0 - c0) + Math.abs(b1 - c1) + Math.abs(b2 - c2) > T) {
          if (ins) photoChangedInside++
          else {
            oldRingRemovedOutside++
            if (Math.abs(c0 - gr) <= GT && Math.abs(c1 - gg) <= GT && Math.abs(c2 - gb) <= GT)
              oldRingGoldOutside++
          }
        }
      }
    }

    // does the new live ring ever paint over the photograph itself?
    let ringInBox = 0
    let ringOverPhoto = 0
    for (let y = 0; y < H; y++) {
      const vy = y + py0
      const fy = (vy - pt) / ph
      const row = y * W * 4
      for (let x = 0; x < W; x++) {
        const vx = x + px0
        const fx = (vx - pl) / pw
        const i = row + x * 4
        if (
          Math.abs(A2.d[i] - B2.d[i]) +
            Math.abs(A2.d[i + 1] - B2.d[i + 1]) +
            Math.abs(A2.d[i + 2] - B2.d[i + 2]) <=
          T
        )
          continue
        ringInBox++
        if (fx < 0 || fy < 0 || fx > 1 || fy > 1) continue
        const dx = fx - CX
        const dy = fy - CY
        if (dx * dx + dy * dy <= RR || (fx >= CX && fy >= CY && fx <= 1.001607 && fy <= 0.944704))
          ringOverPhoto++
      }
    }

    const n1 = (v) => (v === null ? null : Math.round(v * 10) / 10)
    const px = {
      photoChangedInside,
      goldOutsideB,
      goldOutsideC,
      goldBoxB: gL === Infinity ? null : { l: n1(gL), r: n1(gR), t: n1(gT), b: n1(gB) },
      oldRingRemovedOutside,
      oldRingGoldOutside,
      unrasteredWhite,
      underlineB,
      underlineC,
      ringInBox,
      ringOverPhoto,
    }
    pxLine = `      (full-viewport captures, 3x byte-identical: A ${sA.stable ? 'yes' : 'NO'}, B ${sB.stable ? 'yes' : 'NO'}, C ${sC.stable ? 'yes' : 'NO'}; unrastered-white pixels=${px.unrasteredWhite})`
    say(pxLine.trim())
    say(
      `      OLD baked ring left outside the silhouette, inside the photo's box = ${px.goldOutsideB}  (required 0)  |  with the clip disabled it was ${px.goldOutsideC}, so the clip removes ${px.oldRingGoldOutside} gold px`
    )
    say(
      `      photo pixels changed inside the silhouette (clip on vs off) = ${px.photoChangedInside}  (required 0)`
    )
    say(
      `      gold underline (svg y=620.364): clip on=${px.underlineB}px  clip off=${px.underlineC}px  -> the clip removes it too`
    )
    say(
      `      new live ring inside the photo's box = ${px.ringInBox}px, of which painted over the photograph = ${px.ringOverPhoto}`
    )  }

  say(`=== ${w}px ===`)
  say(
    `  horizontal scroll: scrollWidth ${g.scrollW} vs viewport ${g.vw} -> ${g.scrollW > g.vw ? '*** YES ***' : 'none'} (body ${g.bodyScrollW})`
  )
  say(
    `  photo: ${g.photo.w}x${g.photo.h} at left ${g.photo.l}, top ${g.photo.t}, radius ${g.photoR} -> gutters L ${g.photo.l} / R ${(w - g.photo.l - g.photo.w).toFixed(1)}, border-radius ${g.borderRadius}`
  )
  say(`  img clip-path: ${g.imgClip}`)
  say(
    `  live ring: display=${g.ringDisplay} pointer-events=${g.ringPointer} svg position=${g.svgPosition} svg overflow=${g.svgOverflow}`
  )
  if (g.arc) {
    say(
      `  RING leftmost letter: x=${g.leftmost.l} (${g.leftmost.l}px from the ${w}px screen edge) | rightmost ${g.leftmost.r} | top ${g.leftmost.t} | bottom ${g.leftmost.b} | ${g.leftmost.boxes} glyph boxes`
    )
    say(
      `  RING type: ${g.fontSize} ${g.fontStyle} ${g.fontWeight} ${g.fontFamily} | letter-spacing ${g.letterSpacing} | fill ${g.fill}`
    )
    say(
      `  RING arc: start ${g.arc.startDeg}deg, end ${g.arc.endDeg}deg CCW from 12 o'clock (run ${g.arc.runDeg}deg) | path radius ${g.arc.r}px = ${g.arc.rOverPhotoR} x photo radius | arc length ${g.arc.len}px`
    )
    say(
      `  RING fill: startOffset=${g.arc.startOffset} textLength=${g.arc.textLength}px lengthAdjust=${g.arc.lengthAdjust} dy=${g.arc.dy} -> fills the arc exactly: ${Math.abs(g.arc.textLength - g.arc.len) < 0.05}`
    )
    say(
      `  RING cap height ${g.arc.capEm}em -> predicted ink band r ${g.arc.bandInnerR}..${g.arc.bandOuterR}px, letters' centre line r ${g.arc.centreLineR}px vs 1.12 x photo radius ${(1.12 * g.photoR).toFixed(1)}px`
    )
    say(`  RING a11y: role="${g.arc.role}" aria-label="${g.arc.label}"`)
    say(`  RING text: "${g.arc.body}" (${g.arc.body.length} chars)`)
  } else {
    say('  RING: not in the DOM (correct at 1024px and up)')
  }
  say(
    `  heading: ${g.h2.fontSize}, ${g.h2.lineBoxes} line boxes | line 1 "${g.h2.line1Text}" = ${g.h2.line1Rendered}px wide (x ${g.h2.line1Left} -> ${g.h2.line1Right})`
  )
  say(
    `  eyebrow: ${g.eb.fontSize}, letter-spacing ${g.eb.ls} -> ${g.eb.inkW}px of ink (${g.eb.inkNoTrail}px without the trailing letter-space)`
  )
  say('')
  await page.close()
}

say('DONE')
writeFileSync(`${OUT}\\ring-verify.txt`, report.join('\n'))
await browser.close()
