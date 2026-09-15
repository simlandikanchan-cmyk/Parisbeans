import { useEffect, useRef } from 'react'
import { menuItems } from '../data/siteData'
import Button from './Button'
import './CafeMenu.css'

export default function CafeMenu() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <section id="menu" className="cafe" ref={ref}>
      <div className="container cafe-grid">
        {/* Left — text */}
        <div className="cafe-copy">
          <p className="eyebrow reveal">From the Café</p>
          <h2 className="cafe-title reveal reveal-delay-1">
            Coffee,
            <br />
            <em>Breakfast</em> &amp;
            <br />
            Little
            <br />
            <em>Indulgences.</em>
          </h2>
          <p className="lead cafe-paragraph reveal reveal-delay-2">
            Discover a simple, satisfying café offering curated for the moments
            around your appointment.
          </p>
          <div className="reveal reveal-delay-3">
            <Button href="/menu" variant="primary" arrow>
              View the Menu
            </Button>
          </div>
        </div>

        {/* Right — menu image grid */}
        <div className="cafe-grid-right">
          <div className="menu-grid">
            {menuItems.map((item, i) => (
              <figure className="menu-item reveal" style={{ '--i': i }} key={item.title}>
                <span className="menu-accent" aria-hidden="true" />
                <div className="menu-thumb">
                  <img src={item.image} alt={item.title} loading="lazy" />
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
    </section>
  )
}
