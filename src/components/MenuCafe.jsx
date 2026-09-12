import { useEffect, useRef } from 'react'
import { menuItems, cafeCardTitles } from '../data/siteData'
import './Menu.css'

export default function MenuCafe() {
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
    <section className="menu-cafe" ref={ref}>
      <div className="container">
        <p className="eyebrow menu-cafe-eyebrow reveal">— From the Café</p>
        <h2 className="menu-cafe-title reveal reveal-delay-1">
          A Few Things Worth Staying For.
        </h2>
        <p className="menu-cafe-desc reveal reveal-delay-2">
          Discover a simple, satisfying café offering curated for the moments
          around your appointment.
        </p>

        <div className="menu-cards reveal reveal-delay-2">
          {cafeCardTitles.map((title) => {
            const item = menuItems.find((i) => i.title === title)
            if (!item) return null
            return (
              <figure className="menu-card" key={item.title}>
                <span className="menu-card-accent" aria-hidden="true" />
                <div className="menu-card-thumb">
                  <img src={item.image} alt={item.title} loading="lazy" />
                </div>
                <figcaption className="menu-card-caption">{item.title}</figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}