import { useEffect, useRef } from 'react'
import './Menu.css'

export default function MenuHero() {
  const ref = useRef(null)

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

  return (
    <section className="menu-hero" ref={ref}>
      <div className="menu-hero-media">
        <img
          src="/images/menu/hero.svg"
          alt="Warm Parisian café corner"
          className="menu-hero-img"
        />
      </div>
      <div className="menu-hero-overlay" aria-hidden="true" />
      <span className="menu-hero-word" aria-hidden="true">
        PARIS
      </span>

      <div className="menu-hero-content container">
        <div className="menu-hero-copy reveal">
          <p className="eyebrow menu-hero-eyebrow">— ParisBeans Menu</p>
          <h1 className="menu-hero-title">
            Something Good, Before{' '}
            <br />
            or After Your Appointment.
          </h1>
          <p className="menu-hero-desc">
            From comforting coffee to simple café favourites, discover the
            offerings available at ParisBeans inside Hair Rap by Yoyo.
          </p>
        </div>
      </div>
    </section>
  )
}