import { useEffect, useRef } from 'react'
import { heroImage } from '../data/siteData'
import Button from './Button'
import './Hero.css'

export default function Hero() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [])

  return (
    <section id="home" className="hero" ref={ref}>
      <div className="hero-media">
        <img
          src={heroImage}
          alt="Hair Rap by Yoyo salon interior with a warm Parisian café corner"
          className="hero-image"
        />
      </div>

      <div className="hero-overlay" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-content container">
        <div className="hero-copy">
          <div className="hero-eyebrow-wrap reveal">
            <span className="hero-eyebrow-dot" aria-hidden="true" />
            <p className="eyebrow hero-eyebrow">Paris Beans · Hair Rap by Yoyo</p>
          </div>

          <h1 className="hero-title reveal reveal-delay-1">
            Your Salon 
            <br />Appointment,
            With a <br />
            <em>Taste of Paris.</em>
          </h1>

          <div className="hero-divider reveal reveal-delay-2" aria-hidden="true" />

          <p className="hero-desc reveal reveal-delay-2">
            Step into Hair Rap by Yoyo and discover Paris Beans — a Paris
            inspired café corner where every salon visit comes with a
            complimentary coffee and a little time to pause.
          </p>

          <div className="hero-actions reveal reveal-delay-3">
            <Button href="#book" variant="primary" arrow>
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
