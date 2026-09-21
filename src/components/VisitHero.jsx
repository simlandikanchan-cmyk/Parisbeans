import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { heroImage, srcSize } from '../data/siteData'
import './VisitContact.css'

export default function VisitHero() {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.12 })

  return (
    <section className="visit-hero" ref={ref}>
      <div className="visit-hero-media">
        <img src={heroImage} alt="Paris Beans salon interior" className="visit-hero-img" {...srcSize(heroImage)} />
        <div className="visit-hero-overlay" />
      </div>

      <span className="visit-hero-word" aria-hidden="true">
        PARIS
      </span>

      <div className="visit-hero-content container">
        <div className="visit-hero-copy reveal">
          <span className="eyebrow visit-hero-eyebrow">— VISIT PARIS BEANS</span>
          <h1 className="visit-hero-title">
            Find Your Little Corner of <em>Paris.</em>
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
