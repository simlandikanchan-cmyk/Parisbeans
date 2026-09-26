import { useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { galleryHeroImages } from '../../../../shared/assets/images'
import '../Gallery.css'

// Intrinsic dimensions of the source files (all 660px wide). Declaring them on
// the <img> lets CSS render every frame at its own natural aspect ratio.
const collageImages = [
  {
    src: galleryHeroImages[0],
    alt: 'Warm Parisian café corner at Paris Beans',
    width: 660,
    height: 684,
  },
  {
    src: galleryHeroImages[1],
    alt: 'Interior detail of the Paris inspired salon café',
    width: 660,
    height: 779,
  },
  {
    src: galleryHeroImages[2],
    alt: 'Espresso and pastry detail at the salon café',
    width: 660,
    height: 685,
  },
  {
    src: galleryHeroImages[3],
    alt: 'Styling session at HAIR RAP BY YOYO salon',
    width: 660,
    height: 780,
  },
  {
    src: galleryHeroImages[4],
    alt: 'Paris inspired decor inside the café corner',
    width: 660,
    height: 779,
  },
  {
    src: galleryHeroImages[5],
    alt: 'Coffee moment served in the salon café',
    width: 660,
    height: 779,
  },
  {
    src: galleryHeroImages[6],
    alt: 'Relaxed pause over coffee at Paris Beans',
    width: 660,
    height: 779,
  },
]

function renderSet(isPrimary) {
  return collageImages.map((img, i) => (
    <figure
      key={img.src}
      className={`gallery-image image-${i + 1}`}
      style={{ '--dl': `${i * 130}ms` }}
    >
      <img
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        loading={isPrimary && i === 0 ? 'eager' : 'lazy'}
        fetchPriority={isPrimary && i === 0 ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
      />
    </figure>
  ))
}

export default function GalleryHero() {
  const ref = useRef(null)
  // Only the copy is scroll-revealed. The collage frames deliberately carry no
  // `.reveal` class — see the entrance note in Gallery.css for why a
  // scroll-triggered transition cannot reach them.
  useReveal(ref, { threshold: 0.08 })

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
          <div className="gallery-set">{renderSet(true)}</div>
          {/* Second copy of the set: what makes the marquee loop seamlessly. */}
          <div className="gallery-set gallery-set--loop" aria-hidden="true">
            {renderSet(false)}
          </div>
        </div>
      </div>
    </section>
  )
}