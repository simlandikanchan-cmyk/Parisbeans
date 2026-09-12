import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [])

  // Auto-advance: 5s interval, restarts on active change, respects reduced-motion
  useEffect(() => {
    if (paused || reduceMotion.current) return
    const t = setInterval(() => setActive((p) => (p + 1) % n), 5000)
    return () => clearInterval(t)
  }, [paused, active])

  // Pause while the tab is hidden, resume on return
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility, { passive: true })
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const go = (dir) => setActive((p) => (p + dir + n) % n)

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
  }

  return (
    <section className="gal-hero" ref={ref} onKeyDown={handleKey}>
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
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* Previous */}
        <button
          type="button"
          className="gal-arrow gal-arrow--prev"
          aria-label="Previous slide"
          onClick={() => go(-1)}
        >
          <ChevronLeft />
        </button>

        {/* Slides */}
        <div aria-live="polite" className="gal-slides">
          {collage.map((key, i) => {
            const d = offset(i, active)
            const state = stateClass(d)
            const isCenter = d === 0
            return (
              <button
                type="button"
                key={key}
                className={`gal-card ${state}`}
                onClick={() => setActive(i)}
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

        {/* Next */}
        <button
          type="button"
          className="gal-arrow gal-arrow--next"
          aria-label="Next slide"
          onClick={() => go(1)}
        >
          <ChevronRight />
        </button>

        {/* Dots */}
        <div className="gal-dots" role="tablist" aria-label="Slides">
          {collage.map((key, i) => (
            <button
              type="button"
              key={key}
              className={`gal-dot${i === active ? ' is-active' : ''}`}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
