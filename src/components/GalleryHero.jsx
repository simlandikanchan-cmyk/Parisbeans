import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Gallery.css'

const collageImages = [
  {
    src: '/images/gallery_hero/Photo rectangle.svg',
    alt: 'Warm Parisian café corner at Paris Beans',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (1).svg',
    alt: 'Interior detail of the Paris inspired salon café',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (2).svg',
    alt: 'Espresso and pastry detail at the salon café',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (3).svg',
    alt: 'Styling session at HAIR RAP BY YOYO salon',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (4).svg',
    alt: 'Paris inspired decor inside the café corner',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (5).svg',
    alt: 'Coffee moment served in the salon café',
  },
  {
    src: '/images/gallery_hero/Photo rectangle (6).svg',
    alt: 'Relaxed pause over coffee at Paris Beans',
  },
]

function renderSet(duplicate) {
  return collageImages.map((img, i) => (
    <figure
      key={img.src}
      className={`gallery-image image-${i + 1}${duplicate ? '' : ' reveal'}`}
      style={{ '--dl': `${i * 130}ms` }}
    >
      <img
        src={img.src}
        alt={img.alt}
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
            Step inside Paris Beans and discover the details, atmosphere and moments that make HAIR RAP BY YOYO feel different.
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