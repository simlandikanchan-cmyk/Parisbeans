import { useLayoutEffect, useRef, useState } from 'react'

/* The ring, redrawn as live text for the phone and tablet tiers.

   It used to be outlined paths baked into photo.svg, drawn at 1.11x the photo's
   own radius inside that file's 627-unit canvas — which meant it could not be
   sized, restyled or re-flowed at all, and it scaled with the photo rather than
   with the type. It is clipped away at 1023px and below (see
   `.ostory-emblem-photo img` in the stylesheet) and replaced by this.

   Geometry: the arc's centre is the photo's centre and the baseline circle is
   1.12x the photo radius, so the letters' centre line lands there — the glyph
   tops point inward, toward the photo, which means the baseline has to sit half
   a cap height further out than the centre line (`dy` below). The arc runs
   counter-clockwise from 35 degrees (about 11 o'clock) to 176 (just before 6),
   which is 141 degrees of arc; `textLength` with `lengthAdjust="spacing"` then
   opens the tracking up to fill exactly that run, rather than trusting the
   fallback font's metrics to land on it.

   The viewBox is set to the measured box in CSS px, so one user unit is one CSS
   px and the font-size below is a real 11px/15px that no scaling distorts. The
   svg's own box is only as big as the photo, and the ring hangs outside it, so
   the overflowing text paints without widening the element or the page. */
const START_DEG = 35
const END_DEG = 176
const RADIUS_FACTOR = 1.12
const CAP_CENTRE_OFFSET = 0.35
const LABEL = 'Where Every Salon Visit Finds Its Parisian Moment.'

const rad = (deg) => (deg * Math.PI) / 180

export default function StoryRing() {
  const hostRef = useRef(null)
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return undefined

    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      setBox((prev) =>
        prev && Math.abs(prev.w - rect.width) < 0.5 && Math.abs(prev.h - rect.height) < 0.5
          ? prev
          : { w: rect.width, h: rect.height }
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  let ring = null
  if (box) {
    const { w, h } = box
    const cx = w / 2
    const cy = h / 2
    const radius = (RADIUS_FACTOR * Math.min(w, h)) / 2
    const startX = cx - radius * Math.sin(rad(START_DEG))
    const startY = cy - radius * Math.cos(rad(START_DEG))
    const endX = cx - radius * Math.sin(rad(END_DEG))
    const endY = cy - radius * Math.cos(rad(END_DEG))
    const arcLength = radius * rad(END_DEG - START_DEG)

    ring = (
      <svg
        className="pb-story-ring__svg"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        role="img"
        aria-label={LABEL}
      >
        <defs>
          <path
            id="pb-story-ring-arc"
            d={`M${startX} ${startY} A${radius} ${radius} 0 0 0 ${endX} ${endY}`}
          />
        </defs>
        <text className="pb-story-ring__text" dy={`${CAP_CENTRE_OFFSET}em`}>
          <textPath
            href="#pb-story-ring-arc"
            startOffset="0"
            textLength={arcLength}
            lengthAdjust="spacing"
          >
            {LABEL}
          </textPath>
        </text>
      </svg>
    )
  }

  return (
    <div className="pb-story-ring" ref={hostRef}>
      {ring}
    </div>
  )
}