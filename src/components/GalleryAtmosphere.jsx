import { useEffect, useRef } from 'react'
import { gallerySections, galleryImage, galleryAlt } from '../data/siteData'
import './Gallery.css'

const section = gallerySections.find((s) => s.id === 'atmosphere')

export default function GalleryAtmosphere() {
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

  const [a, b, feature, wide] = section.images.map(galleryImage)

  return (
    <section className="gal-section" ref={ref}>
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">The ParisBeans Mood</span>
          <h2 className="gal-section-title">
            A Corner of <em>Paris,</em> Inside
            <br />
            <em>HAIR RAP BY YOYO.</em>
          </h2>
          <p className="gal-section-desc lead">
            Paris-inspired details, warm coffee, beautiful surroundings and the
            little moments that make your salon visit feel different.
          </p>
        </div>

        <div className="gal-grid gal-grid--atmosphere reveal reveal-delay-1">
          <figure className="gal-tile gal-tile--a">
            <img src={a} alt={galleryAlt(section.images[0])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--b">
            <img src={b} alt={galleryAlt(section.images[1])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--feature">
            <img src={feature} alt={galleryAlt(section.images[2])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--wide">
            <img src={wide} alt={galleryAlt(section.images[3])} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}