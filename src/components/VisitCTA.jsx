import { useEffect, useRef } from 'react'
import Button from './Button'
import './VisitContact.css'

export default function VisitCTA() {
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
    <section className="visit-cta section" ref={ref}>
      <div className="visit-cta-stripes" aria-hidden="true" />
      <div className="visit-cta-content container reveal">
        <span className="eyebrow">— PARIS BEANS</span>
        <h2 className="visit-cta-title section-heading">
          Make Your Next Visit a Little More <em>Parisian.</em>
        </h2>
        <p className="visit-cta-desc">
          Book your Hair Rap by Yoyo appointment and enjoy your complimentary
          coffee at Paris Beans.
        </p>
        <Button href="#visit-contact" variant="primary" arrow>
          Book Your Salon Appointment
        </Button>
      </div>
    </section>
  )
}