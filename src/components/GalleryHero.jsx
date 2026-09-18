import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { useCarousel } from '../hooks/useCarousel'
import { galleryImage, galleryAlt } from '../data/siteData'
import './Gallery.css'

const collage = ['g2', 'g7', 'g3', 'g1', 'g4']

const n = collage.length
const half = Math.floor(n / 2)

const offset = (i, active) => {
  let d = i - active
  if (d > half) d -= n
  if (d < -half) d += n
  return d
}

const stateClass = (d) => {
  if (d === 0) return 'center'
  if (d === 1) return 'right'
  if (d === -1) return 'left'
  if (d === 2) return 'far-right'
  if (d === -2) return 'far-left'
  return d > 0 ? 'hidden-right' : 'hidden-left'
}

export default function GalleryHero() {
  const ref = useRef(null)
  useReveal(ref, { selector: '.reveal', threshold: 0.08 })
  const carousel = useCarousel({ itemCount: n, interval: 5000 })

  const go = (dir) => carousel.go(dir)

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
  }

  return (
    <section className="gal-hero" ref={ref} onKeyDown={handleKey} tabIndex={-1}>
      <div className="container">
        <div className="gal-hero-copy reveal">
          <span className="eyebrow gal-hero-eyebrow">— THE PARIS BEANS EXPERIENCE</span>
          <h1 className="gal-hero-title">
            A Parisian Mood. A <em>Salon</em> Experience.
          </h1>
          <p className="gal-hero-desc lead">
            Step inside Paris Beans and discover the details, atmosphere and moments
            that make Hair Rap by Yoyo feel different.
          </p>
        </div>
      </div>

      <div
        className="gal-stage reveal reveal-delay-1"
        role="region"
        aria-roledescription="carousel"
        aria-label="Gallery"
        onMouseEnter={carousel.pause}
        onMouseLeave={carousel.resume}
        onFocus={carousel.pause}
        onBlur={carousel.resume}
      >
        {/* Slides */}
        <div aria-live="polite" className="gal-slides">
          {collage.map((key, i) => {
            const d = offset(i, carousel.active)
            const state = stateClass(d)
            const isCenter = d === 0
            return (
              <button
                type="button"
                key={key}
                className={`gal-card ${state}`}
                onClick={() => carousel.setActive(i)}
                aria-label={galleryAlt(key)}
                aria-current={isCenter}
                style={{ '--i': i }}
              >
                <div className="gal-card-media">
                  <img
                    src={galleryImage(key)}
                    alt={galleryAlt(key)}
                    loading={isCenter ? 'eager' : 'lazy'}
                    fetchPriority={isCenter ? 'high' : 'auto'}
                    draggable={false}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
