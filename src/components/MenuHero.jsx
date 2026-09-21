import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { srcSize } from '../data/siteData'
import './Menu.css'

export default function MenuHero() {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.08 })

  return (
    <section className="menu-hero" ref={ref}>
      <div className="menu-hero-media">
        <img
          src="/images/menu/hero.svg"
          alt="Warm Parisian café corner"
          className="menu-hero-img"
          {...srcSize('/images/menu/hero.svg')}
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
            offerings available at ParisBeans inside HAIR RAP BY YOYO.
          </p>
        </div>
      </div>
    </section>
  )
}