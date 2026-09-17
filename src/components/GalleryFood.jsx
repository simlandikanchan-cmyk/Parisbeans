import { useEffect, useRef } from 'react'
import { gallerySections, galleryImage, galleryAlt } from '../data/siteData'
import './Gallery.css'

const section = gallerySections.find((s) => s.id === 'coffee-food')

export default function GalleryFood() {
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

  const [a, feature, b, c, d, e, g] = section.images.map(galleryImage)

  return (
    <section className="gal-section" ref={ref}>
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">From the Café</span>
          <h2 className="gal-section-title">
            Coffee,
            <br />
            <em>Breakfast</em> &amp;
            <br />
            Little
            <br />
            <em>Indulgences.</em>
          </h2>
          <p className="gal-section-desc lead">
            Discover a simple, satisfying café offering curated for the moments
            around your appointment.
          </p>
        </div>

        <div className="gal-grid gal-grid--food reveal reveal-delay-1">
          <figure className="gal-tile gal-tile--a">
            <img src={a} alt={galleryAlt(section.images[0])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--b">
            <img src={b} alt={galleryAlt(section.images[2])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--c">
            <img src={c} alt={galleryAlt(section.images[3])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--d">
            <img src={d} alt={galleryAlt(section.images[4])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--e">
            <img src={e} alt={galleryAlt(section.images[5])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--g">
            <img src={g} alt={galleryAlt(section.images[6])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--feature">
            <img src={feature} alt={galleryAlt(section.images[1])} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}