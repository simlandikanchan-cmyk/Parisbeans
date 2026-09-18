import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'
import './Menu.css'

export default function MenuCTA() {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.08 })

  return (
    <section className="menu-cta" ref={ref}>
      <div className="menu-cta-stripes" aria-hidden="true" />
      <div className="container menu-cta-content reveal">
        <p className="eyebrow">The Paris Beans Experience</p>
        <h2 className="menu-cta-title">
          More Than a Coffee. <em>Part of Your Appointment.</em>
        </h2>
        <p className="menu-cta-desc">
          Whether you arrive early, take a break during your service, or simply
          want to enjoy the atmosphere, ParisBeans adds a warm café moment to
          your Hair Rap by Yoyo experience.
        </p>
        <Button href="/visit-contact" variant="primary" size="small" arrow>
          Reserve Your Spot
        </Button>
      </div>
    </section>
  )
}