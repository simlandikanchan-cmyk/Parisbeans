import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'
import './VisitContact.css'

export default function VisitCTA() {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.12 })

  return (
    <section className="visit-cta section" ref={ref}>
      <div className="visit-cta-stripes" aria-hidden="true" />
      <div className="visit-cta-content container reveal">
        <span className="eyebrow">The Paris Beans Experience</span>
        <h2 className="visit-cta-title section-heading">
          More Than a Coffee. <em>Part of Your Appointment.</em>
        </h2>
        <p className="visit-cta-desc">
          Whether you arrive early, take a break during your service, or simply
          want to enjoy the atmosphere, ParisBeans adds a warm café moment to
          your Hair Rap by Yoyo experience.
        </p>
        <Button href="#visit-contact" variant="primary" arrow>
          Reserve Your Spot
        </Button>
      </div>
    </section>
  )
}