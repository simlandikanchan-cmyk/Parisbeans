import { useEffect, useRef, useState } from 'react'
import './OurStoryHero.css'

const IMAGES = [
  { src: '/images/hero/salon-interior.svg', pos: '50% 50%', alt: 'Paris Beans interior with wooden wall logo and café counter' },
  { src: '/images/story/Rectangle 75.svg', pos: '50% 25%', alt: 'Salon interior detail' },
  { src: '/images/story/Rectangle 74.svg', pos: '50% 60%', alt: 'Café corner detail' },
  // { src: '/images/story/Rectangle 60.svg', pos: '50% 40%', alt: 'Paris Beans interior detail' },
  { src: '/images/story/Rectangle 73.svg', pos: '50% 30%', alt: 'HAIR RAP BY YOYO environment' },
]

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function OurStoryHero() {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

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
    if (paused || reduceMotion) return
    const t = setInterval(() => setActive((a) => (a + 1) % IMAGES.length), 6000)
    return () => clearInterval(t)
  }, [paused, active])

  const main = IMAGES[active]
  const strip = [
    ...IMAGES.slice(active + 1),
    ...IMAGES.slice(0, active),
  ].slice(0, 4)

  return (
    <section className="ostory-hero" ref={ref}>
      <div className="ostory-hero-box">
        <p className="eyebrow ostory-eyebrow">
          <span className="ostory-dash" aria-hidden="true" />
          OUR STORY
        </p>
        <h1 className="ostory-title">
          A Little <em>Paris</em>, Created for Your Salon Day.
        </h1>
        <p className="ostory-desc">
          Paris Beans began with a simple idea — what if a salon appointment
          could feel more than an appointment?
        </p>

        <div
          className="ostory-gallery"
          role="region"
          aria-roledescription="carousel"
          aria-label="Paris Beans story gallery"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <figure className="ostory-gallery-main reveal" key={main.src}>
            <img src={main.src} style={{ objectPosition: main.pos }} alt={main.alt} />
            {!paused && <span className="ostory-progress" aria-hidden="true" />}
          </figure>
          <div className="ostory-gallery-strip reveal reveal-delay-1">
            {strip.map((p) => (
              <figure
                key={p.src}
                className="ostory-gallery-panel"
                onClick={() => setPaused(true)}
              >
                <img src={p.src} style={{ objectPosition: p.pos }} alt={p.alt} />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}