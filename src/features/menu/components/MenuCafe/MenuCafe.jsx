import { useMemo, useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { useCarousel } from '../../../../shared/hooks/useCarousel'
import { menuItems, cafeCardTitles } from '../../../../shared/models/siteData'
import { srcSize } from '../../../../shared/assets/srcSize'
import '../Menu.css'

export default function MenuCafe() {
  const ref = useRef(null)
  const dragRef = useRef({ x: 0, dragging: false })
  useReveal(ref, { threshold: 0.08 })

  const cards = useMemo(
    () => cafeCardTitles.map((title) => menuItems.find((i) => i.title === title)).filter(Boolean),
    []
  )
  const count = cards.length

  const carousel = useCarousel({ itemCount: count, interval: 4000, autoPlay: false })

  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = e.clientX - dragRef.current.x
    if (Math.abs(dx) > 40) {
      const dir = dx < 0 ? 1 : -1
      // Two cards are in view on phones, so the last reachable index keeps the
      // final card flush to the right edge — no trailing gap.
      const maxIndex = Math.max(count - 2, 0)
      carousel.setActive((p) => Math.min(Math.max(p + dir, 0), maxIndex))
    }
    carousel.resume()
  }

  return (
    <section className="menu-cafe" ref={ref}>
      <div className="container">
        <p className="eyebrow menu-cafe-eyebrow reveal">— From the Café</p>
        <h2 className="menu-cafe-title reveal reveal-delay-1">
          A Few Things Worth
          <br />
          <em>Staying For.</em>
        </h2>
        <p className="menu-cafe-desc reveal reveal-delay-2">
          Discover a simple, satisfying café offering curated for the moments
          around your appointment.
        </p>

        <div
          className="menu-cards reveal reveal-delay-2"
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
            className="menu-slider-track"
            style={{
              transform: `translateX(calc(var(--menu-slide-step) * -${carousel.active}))`,
            }}
          >
            {cards.map((item) => (
              <figure className="menu-card" key={item.title}>
                <span className="menu-card-accent" aria-hidden="true" />
                <div className="menu-card-thumb">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    draggable={false}
                    {...srcSize(item.image)}
                  />
                </div>
                <figcaption className="menu-card-caption">{item.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
