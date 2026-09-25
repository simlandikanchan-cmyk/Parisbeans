import { useRef } from 'react'
import { menuItems } from '../../../../shared/models/siteData'
import { srcSize } from '../../../../shared/assets/srcSize'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { useCarousel } from '../../../../shared/hooks/useCarousel'
import Button from '../../../../shared/components/Button'
import './CafeMenu.css'

export default function CafeMenu() {
  const ref = useRef(null)
  const dragRef = useRef({ x: 0, dragging: false })
  useReveal(ref, { threshold: 0.08 })

  const carousel = useCarousel({ itemCount: menuItems.length, interval: 4000, autoPlay: false })

  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = e.clientX - dragRef.current.x
    if (Math.abs(dx) > 40) {
      const dir = dx < 0 ? 1 : -1
      const maxIndex = Math.max(menuItems.length - 2, 0)
      carousel.setActive((p) => Math.min(Math.max(p + dir, 0), maxIndex))
    }
    carousel.resume()
  }

  return (
    <section id="menu" className="cafe" ref={ref}>
      <div className="container">
        <div className="cafe-grid">
          {/* Left — text */}
          <div className="cafe-copy">
            <div className="cafe-copy-inner">
              <p className="eyebrow reveal">— From the Café</p>
              <h2 className="cafe-title reveal reveal-delay-1">
                Coffee,
                <br className="cafe-br-desktop" />
                <em>Breakfast</em> &amp;
                <br className="cafe-br-mobile" />
                Little
                <br className="cafe-br-desktop" />
                <em>Indulgences.</em>
              </h2>
              <p className="lead cafe-paragraph reveal reveal-delay-2">
                Discover a simple, satisfying café offering curated for the moments
                around your appointment.
              </p>
            </div>
            <div className="cafe-cta reveal reveal-delay-3">
              <Button href="/menu" variant="primary" arrow>
                Visit the Menu
              </Button>
            </div>
          </div>

          {/* Right — menu image grid / carousel on mobile */}
          <div className="cafe-grid-right">
            <div
              className="menu-grid"
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
                className="cafe-slider-track"
                style={{
                  transform: `translateX(calc(var(--cafe-slide-step) * -${carousel.active}))`,
                }}
              >
                {menuItems.map((item, i) => (
                  <figure className="menu-item reveal" style={{ '--i': i }} key={item.title}>
                    <span className="menu-accent" aria-hidden="true" />
                    <div className="menu-thumb">
                      <img src={item.image} alt={item.title} loading="lazy" {...srcSize(item.image)} />
                    </div>
                    <figcaption className="menu-caption">
                      <span className="menu-dot" aria-hidden="true" />
                      {item.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
