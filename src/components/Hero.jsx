import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'
import './Hero.css'

export default function Hero() {
  const ref = useRef(null)
  useReveal(ref, { selector: '.reveal, .hero-title', threshold: 0.08 })

  return (
    <section id="home" className="hero" ref={ref}>
      <div className="hero-media">
        <img
          src="/images/hero/salon-interior.svg"
          alt="HAIR RAP BY YOYO salon interior with a warm Parisian café corner"
          className="hero-image"
          loading="eager"
          fetchPriority="high"
          width={1920}
          height={1280}
        />
      </div>

      <div className="hero-overlay" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-content container">
        <div className="hero-copy">
          <div className="hero-eyebrow-wrap reveal">
            <span className="hero-eyebrow-dot" aria-hidden="true" />
            <p className="eyebrow hero-eyebrow">Paris Beans · HAIR RAP BY YOYO</p>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">
              <span className="hero-title-line-inner">Your Salon</span>
            </span>
            <span className="hero-title-line">
              <span className="hero-title-line-inner">Appointment, With a</span>
            </span>
            <span className="hero-title-line">
              <span className="hero-title-line-inner">
                <em className="hero-title-accent">Taste of Paris.</em>
              </span>
            </span>
          </h1>

          <div className="hero-divider reveal reveal-delay-2" aria-hidden="true" />

          <p className="hero-desc reveal reveal-delay-2">
            Step into HAIR RAP BY YOYO and discover Paris Beans — a Paris
            inspired café corner where every salon visit comes with a
            complimentary coffee and a little time to pause.
          </p>

          <div className="hero-actions reveal reveal-delay-3">
            <Button href="/visit-contact" variant="primary" arrow>
              Book Your Salon Appointment
            </Button>
            <Button href="/menu" variant="ghost">
              Explore ParisBeans
            </Button>
          </div>
        </div>
      </div>

      <div className="hero-scroll reveal reveal-delay-3" aria-hidden="true">
        <span className="hero-scroll-text">Scroll</span>
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}
