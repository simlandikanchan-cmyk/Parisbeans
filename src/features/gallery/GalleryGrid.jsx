import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { galleryImage, galleryAlt, galleryDims } from '../../data/siteData'
import './Gallery.css'

export default function GalleryGrid({
  eyebrow,
  title,
  description,
  gridClass,
  images,
  tiles,
  bookend = false,
}) {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.08 })

  return (
    <section
      className={bookend ? 'gal-section gal-section--bookend' : 'gal-section'}
      ref={ref}
    >
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">{eyebrow}</span>
          <h2 className="gal-section-title">{title}</h2>
          <p className="gal-section-desc lead">{description}</p>
        </div>

        <div className={`gal-grid ${gridClass} reveal reveal-delay-1`}>
          {tiles.map(({ tile, image }, i) => {
            const key = images[image]
            const dims = galleryDims[key]
            return (
              <figure className={`gal-tile ${tile}`} key={i}>
                <img
                  src={galleryImage(key)}
                  alt={galleryAlt(key)}
                  width={dims.width}
                  height={dims.height}
                  loading="lazy"
                />
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}