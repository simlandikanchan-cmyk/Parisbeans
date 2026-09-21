import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { useCarousel } from '../hooks/useCarousel'
import { gallery, galleryImage, galleryDims } from '../data/siteData'
import Button from './Button'
import './GalleryMood.css'

export default function GalleryMood() {
  const ref = useRef(null)
  const stageRef = useRef(null)
  const dragRef = useRef({ x: 0, dragging: false, moved: false })
  useReveal(ref, { selector: '.reveal', threshold: 0.08 })
  const carousel = useCarousel({ itemCount: gallery.length, interval: 4500 })

  const n = gallery.length
  const half = Math.floor(n / 2)

  const offset = (i) => {
    let d = i - carousel.active
    if (d > half) d -= n
    if (d < -half) d += n
    return d
  }

  const stateClass = (d) => {
    if (d === 0) return 'center'
    if (d === 1) return 'right'
    if (d === -1) return 'left'
    if (d === 2) return 'mid-right'
    if (d === -2) return 'mid-left'
    if (d === 3) return 'far-right'
    if (d === -3) return 'far-left'
    return d > 0 ? 'hidden-right' : 'hidden-left'
  }

  const advance = (dir) => carousel.go(dir)

  const onPointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, dragging: true, moved: false }
    carousel.pause()
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d.dragging) return
    if (Math.abs(e.clientX - d.x) > 8) d.moved = true
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    if (!d.dragging) return
    d.dragging = false
    const dx = e.clientX - d.x
    if (d.moved && Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1)
    carousel.resume()
  }

  return (
    <section id="gallery" className="gallery" ref={ref}>
      <div className="container">
        <div className="section-header--center gallery-head reveal">
          <p className="eyebrow">The ParisBeans Mood</p>
          <h2 className="gallery-title">
            A Corner of <em>Paris,</em> Inside
            <br />
            <em>HAIR RAP BY YOYO.</em>
          </h2>
          <p className="lead gallery-desc">
            Paris-inspired details, warm coffee, beautiful surroundings and the
            little moments that make your salon visit feel different.
          </p>
        </div>
      </div>

      {/* Auto carousel — Polaroid slides travel an arc through the centre */}
      <div
        className="gallery-stage reveal reveal-delay-1"
        ref={stageRef}
        onMouseEnter={carousel.pause}
        onMouseLeave={() => {
          dragRef.current.dragging = false
          dragRef.current.moved = false
          carousel.resume()
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="carousel">
          {gallery.map((img, i) => {
            const state = stateClass(offset(i))
            const dims = galleryDims[img.key]
            return (
              <figure
                key={img.key}
                className={`carousel-item ${state}`}
                onClick={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false
                    return
                  }
                  carousel.setActive(i)
                }}
                aria-label={img.alt}
              >
                <div className="polaroid">
                  <div className="polaroid-photo">
                    <img
                      src={galleryImage(img.key)}
                      alt={img.alt}
                      width={dims.width}
                      height={dims.height}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </div>
              </figure>
            )
          })}
        </div>
      </div>

      <div className="gallery-meta reveal reveal-delay-2">
        <p className="gallery-caption" key={gallery[carousel.active].key}>
          {gallery[carousel.active].alt}
        </p>
        <div className="gallery-dots" role="group" aria-label="Gallery slideshow">
          {gallery.map((img, i) => (
            <button
              key={img.key}
              type="button"
              className={`gallery-dot${i === carousel.active ? ' is-active' : ''}`}
              aria-label={`Go to slide: ${img.alt}`}
              aria-current={i === carousel.active}
              onClick={() => {
                carousel.setActive(i)
                carousel.resume()
              }}
            />
          ))}
        </div>
      </div>

      <div className="gallery-cta reveal reveal-delay-2">
        <Button href="/gallery" variant="outline" arrow>
          See the Gallery
        </Button>
      </div>
    </section>
  )
}
