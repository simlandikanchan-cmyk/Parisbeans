import { useEffect, useMemo, useRef, useState } from 'react'
import './OurStoryHero.css'

const PANELS = [
  {
    src: '/images/hero/salon-interior.svg',
    pos: '50% 50%',
    alt: 'Paris Beans interior with wooden wall logo and café counter',
  },
  {
    src: '/images/story/Rectangle 73.svg',
    pos: '50% 30%',
    alt: 'HAIR RAP BY YOYO environment',
  },
  {
    src: '/images/story/Rectangle 75.svg',
    pos: '50% 25%',
    alt: 'Salon interior detail',
  },
  {
    src: '/images/story/Rectangle 74.svg',
    pos: '50% 60%',
    alt: 'Café corner detail',
  },
]

const CYCLE_INTERVAL_MS = 2600
const MOBILE_BREAKPOINT = 768
const DESKTOP_SLIDE_COUNT = 4
const MOBILE_SLIDE_COUNT = 3

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OurStoryHero() {
  const ref = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.12 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  const visible = useMemo(
    () =>
      isMobile
        ? PANELS.slice(0, MOBILE_SLIDE_COUNT)
        : PANELS.slice(0, DESKTOP_SLIDE_COUNT),
    [isMobile]
  )

  const safeIndex = activeIndex >= visible.length ? 0 : activeIndex

  useEffect(() => {
    if (activeIndex < visible.length) return
    setActiveIndex(0)
  }, [activeIndex, visible.length])

  useEffect(() => {
    if (visible.length === 0 || isHovering || reduceMotion) return
    const t = setInterval(
      () => setActiveIndex((p) => (p + 1) % visible.length),
      CYCLE_INTERVAL_MS
    )
    return () => clearInterval(t)
  }, [visible.length, isHovering])

  return (
    <section className="ostory-hero" ref={ref}>
      <div className="ostory-hero-box">
        <p className="eyebrow ostory-eyebrow reveal">
          <span className="ostory-dash" aria-hidden="true" />
          OUR STORY
        </p>
        <h1 className="ostory-title reveal reveal-delay-1">
          A Little <em>Paris</em>, Created for Your Salon Day.
        </h1>
        <p className="ostory-desc reveal reveal-delay-2">
          Paris Beans began with a simple idea — what if a salon appointment
          could feel more than an appointment?
        </p>

        <div
          className="ostory-gallery reveal reveal-delay-3"
          role="region"
          aria-roledescription="carousel"
          aria-label="Paris Beans story gallery"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {visible.map((panel, index) => {
            const isActive = index === safeIndex
            return (
              <button
                key={panel.src}
                type="button"
                className={`ostory-panel${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                aria-label={panel.alt}
                style={{
                  flex: isActive ? '4 1 0%' : '0.3 1 0%',
                  transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <img
                  src={panel.src}
                  style={{ objectPosition: panel.pos }}
                  alt={panel.alt}
                  draggable={false}
                />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}