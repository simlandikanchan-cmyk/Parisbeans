import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Gallery.css'

const collageImages = [
  {
    src: '/images/gallery_hero/Photo rectangle.svg',
    alt: 'Warm Parisian café corner at Paris Beans',
    width: 274,
    height: 284,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (1).svg',
    alt: 'Interior detail of the Paris inspired salon café',
    width: 282,
    height: 333,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (2).svg',
    alt: 'Espresso and pastry detail at the salon café',
    width: 209,
    height: 217,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (3).svg',
    alt: 'Styling session at HAIR RAP BY YOYO salon',
    width: 330,
    height: 390,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (4).svg',
    alt: 'Paris inspired decor inside the café corner',
    width: 282,
    height: 333,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (5).svg',
    alt: 'Coffee moment served in the salon café',
    width: 282,
    height: 333,
  },
  {
    src: '/images/gallery_hero/Photo rectangle (6).svg',
    alt: 'Relaxed pause over coffee at Paris Beans',
    width: 197,
    height: 333,
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
        width={img.width}
        height={img.height}
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