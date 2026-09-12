import { useEffect, useRef } from 'react'
import { heroImage } from '../data/siteData'
import './VisitContact.css'

export default function VisitHero() {
  const ref = useRef(null)

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

  return (
    <section className="visit-hero" ref={ref}>
      <div className="visit-hero-media">
        <img src={heroImage} alt="Paris Beans salon interior" className="visit-hero-img" />
        <div className="visit-hero-overlay" />
      </div>

      <span className="visit-hero-word" aria-hidden="true">
        PARIS
      </span>

      <div className="visit-hero-content container">
        <div className="visit-hero-copy reveal">
          <span className="eyebrow visit-hero-eyebrow">— VISIT PARIS BEANS</span>
          <h1 className="visit-hero-title">
            Find Your Little<br />
            Corner of <em>Paris.</em>
          </h1>
          <p className="visit-hero-desc">
            Paris Beans is located inside HAIR RAP BY YOYO, bringing a
            Paris-inspired café experience directly into your salon visit.
          </p>
        </div>
      </div>
    </section>
  )
}
