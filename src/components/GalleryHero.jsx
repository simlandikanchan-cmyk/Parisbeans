import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { galleryImage, galleryAlt } from '../data/siteData'
import './Gallery.css'

const collage = ['g2', 'g7', 'g3', 'g4', 'g1']

function renderSet(duplicate) {
  return collage.map((key, i) => (
    <figure
      key={key}
      className={`gallery-image image-${i + 1}${duplicate ? '' : ' reveal'}`}
      style={{ '--dl': `${i * 130}ms` }}
    >
      <img
        src={galleryImage(key)}
        alt={galleryAlt(key)}
        loading={!duplicate && i === 0 ? 'eager' : 'lazy'}
        fetchPriority={!duplicate && i === 0 ? 'high' : 'auto'}
        draggable={false}
      />
    </figure>
  ))
}

export default function GalleryHero() {
  const ref = useRef(null)
  useReveal(ref, { selector: '.reveal', threshold: 0.08 })

  return (
    <section className="gal-hero" ref={ref}>
      <div className="container">
        <div className="gal-hero-copy reveal">
          <span className="eyebrow gal-hero-eyebrow">— THE PARIS BEANS EXPERIENCE</span>
          <h1 className="gal-hero-title">
            A Parisian Mood. A <em>Salon</em> Experience.
          </h1>
          <p className="gal-hero-desc lead">
            Step inside Paris Beans and discover the details, atmosphere and moments
            that make HAIR RAP BY YOYO feel different.
          </p>
        </div>
      </div>

      <div className="gal-hero-collage" role="region" aria-label="Gallery">
        <div className="gallery-track">
          <div className="gallery-set">{renderSet(false)}</div>
          <div className="gallery-set" aria-hidden="true">
            {renderSet(true)}
          </div>
        </div>
      </div>
    </section>
  )
}