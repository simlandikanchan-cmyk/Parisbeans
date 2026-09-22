import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { menuItems, cafeCardTitles } from '../../data/siteData'
import { srcSize } from '../../utils/srcSize'
import './Menu.css'

export default function MenuCafe() {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.08 })

  return (
    <section className="menu-cafe" ref={ref}>
      <div className="container">
        <p className="eyebrow menu-cafe-eyebrow reveal">From the Café</p>
        <h2 className="menu-cafe-title reveal reveal-delay-1">
          A Few Things Worth
          <br />
          <em>Staying For.</em>
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
                  <img src={item.image} alt={item.title} loading="lazy" {...srcSize(item.image)} />
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