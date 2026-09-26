import { useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { useCarousel } from '../../../../shared/hooks/useCarousel'
import { galleryImages, galleryAlt, galleryDims } from '../../../../shared/models/siteData'
import '../Gallery.css'

export default function GalleryGrid({
  eyebrow,
  title,
  description,
  gridClass,
  images,
  tiles,
  bookend = false,
}) {
  const ref = useRef(null)
  const dragRef = useRef({ x: 0, dragging: false })
  useReveal(ref, { threshold: 0.08 })

  const count = tiles.length
  const carousel = useCarousel({ itemCount: count, interval: 4000, autoPlay: false })

  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = e.clientX - dragRef.current.x
    if (Math.abs(dx) > 40) {
      const dir = dx < 0 ? 1 : -1
      // One tile fills the view on phones, so the last reachable index keeps the
      // final image flush to the right edge — no trailing gap.
      const maxIndex = Math.max(count - 1, 0)
      carousel.setActive((p) => Math.min(Math.max(p + dir, 0), maxIndex))
    }
    carousel.resume()
  }

  return (
    <section
      className={bookend ? 'gal-section gal-section--bookend' : 'gal-section'}
      ref={ref}
    >
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">{eyebrow}</span>
          <h2 className="gal-section-title">{title}</h2>
          <p className="gal-section-desc lead">{description}</p>
        </div>

        <div
          className={`gal-grid ${gridClass} reveal reveal-delay-1`}
          onMouseEnter={carousel.pause}
          onMouseLeave={carousel.resume}
          onFocus={carousel.pause}
          onBlur={carousel.resume}
          onPointerDown={(e) => {
            dragRef.current = { x: e.clientX, y: e.clientY, dragging: true }
            try {
              e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
              /* capture not available */
            }
            carousel.pause()
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="gal-track"
            style={{
              transform: `translateX(calc(var(--gal-slide-step) * -${carousel.active}))`,
            }}
          >
            {tiles.map(({ tile, image }, i) => {
              const key = images[image]
              const dims = galleryDims[key]
              return (
                <figure className={`gal-tile ${tile}`} key={i}>
                  <img
                    src={galleryImages[key]}
                    alt={galleryAlt(key)}
                    width={dims.width}
                    height={dims.height}
                    loading="lazy"
                    draggable={false}
                  />
                </figure>
              )
            })}
          </div>
        </div>

        {/* Kept outside .gal-grid: that element captures the pointer during a
            drag, which would retarget the click away from these buttons. */}
        <div
          className="gal-dots"
          role="group"
          aria-label={`${eyebrow.replace(/—\s*/, '')} slideshow`}
        >
          {tiles.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`gal-dot${i === carousel.active ? ' is-active' : ''}`}
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === carousel.active}
              onClick={() => carousel.setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
