import { useEffect, useRef } from 'react'
import { gallerySections, galleryImage, galleryAlt } from '../data/siteData'
import './Gallery.css'

const section = gallerySections.find((s) => s.id === 'wall-art')

export default function GalleryWallArt() {
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

  const [a, b, feature, c, d] = section.images.map(galleryImage)

  return (
    <section className="gal-section" ref={ref}>
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">{section.eyebrow}</span>
          <h2 className="gal-section-title">{section.title}</h2>
          <p className="gal-section-desc lead">{section.description}</p>
        </div>

        <div className="gal-grid gal-grid--wall reveal reveal-delay-1">
          <figure className="gal-tile gal-tile--a">
            <img src={a} alt={galleryAlt(section.images[0])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--b">
            <img src={b} alt={galleryAlt(section.images[1])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--c">
            <img src={c} alt={galleryAlt(section.images[3])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--d">
            <img src={d} alt={galleryAlt(section.images[4])} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--feature">
            <img src={feature} alt={galleryAlt(section.images[2])} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}