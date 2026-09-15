import { useEffect, useRef, useState } from 'react'
import { gallery, galleryImage } from '../data/siteData'
import Button from './Button'
import './GalleryMood.css'

export default function GalleryMood() {
  const ref = useRef(null)
  const stageRef = useRef(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragRef = useRef({ x: 0, dragging: false, moved: false })
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
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  // Auto-advance: loops forever, restarts whenever the slide or pause state changes
  useEffect(() => {
    if (paused || reduceMotion.current) return
    const t = setInterval(() => setActive((p) => (p + 1) % gallery.length), 3100)
    return () => clearInterval(t)
  }, [paused, active])

  const n = gallery.length
  const half = Math.floor(n / 2)

  // Wrapped signed distance from the active slide (centre), in -half..half
  const offset = (i) => {
    let d = i - active
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

  const advance = (dir) => setActive((p) => (p + dir + n) % n)

  // --- lightweight drag / swipe (secondary; autoplay stays primary) ---
  const onPointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, dragging: true, moved: false }
    setPaused(true)
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
    setPaused(false)
  }

  return (
    <section id="gallery" className="gallery" ref={ref}>
      <div className="container">
        <div className="section-header--center gallery-head reveal">
          <p className="eyebrow">The ParisBeans Mood</p>
          <h2 className="gallery-title">
            A Corner of <em>Paris,</em> Inside
            <br />
            <em>Hair Rap by Yoyo.</em>
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
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          dragRef.current.dragging = false
          dragRef.current.moved = false
          setPaused(false)
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="carousel">
          {gallery.map((img, i) => {
            const state = stateClass(offset(i))
            return (
              <figure
                key={img.key}
                className={`carousel-item ${state}`}
                onClick={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false
                    return
                  }
                  setActive(i)
                }}
                aria-label={img.alt}
              >
                <div className="polaroid">
                  <div className="polaroid-photo">
                    <img
                      src={galleryImage(img.key)}
                      alt={img.alt}
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

      <div className="gallery-cta reveal reveal-delay-2">
        <Button href="/gallery" variant="outline" arrow>
          See the Gallery
        </Button>
      </div>
    </section>
  )
}