import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'
import './ExperienceStrip.css'

export default function ExperienceStrip() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <section className="experience" ref={ref}>
      <div className="experience-stripes" aria-hidden="true" />
      <div className="experience-content container">
        <p className="eyebrow reveal">The Paris Beans Experience</p>
        <h2 className="experience-title reveal reveal-delay-1">
          More Than a Coffee. <em>Part of Your Appointment.</em>
        </h2>
        <p className="experience-desc reveal reveal-delay-2">
          Whether you arrive early, take a break during your service, or simply
          want to enjoy the atmosphere, ParisBeans adds a warm café moment to
          your Hair Rap by Yoyo experience.
        </p>
        <div className="reveal reveal-delay-3">
          <Button href="/visit-contact" variant="primary" arrow>
            Reserve Your Spot
          </Button>
        </div>
      </div>
    </section>
  )
}
