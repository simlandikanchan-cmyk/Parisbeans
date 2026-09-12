import Button from './Button'
import './OurStoryCta.css'

export default function OurStoryCta() {
  return (
    <section className="ostory-cta">
      <div className="ostory-shell ostory-cta-inner">
        <p className="eyebrow ostory-eyebrow">
          <span className="ostory-dash" aria-hidden="true" />
          THE PARISBEANS EXPERIENCE
        </p>
        <h2 className="ostory-cta-title">
          ParisBeans Is Not Just a Café Corner.
        </h2>
        <p className="ostory-cta-desc">
          It is a small Parisian ritual built into your Hair Rap by Yoyo
          experience.
        </p>
        <Button href="#book" variant="primary" arrow className="ostory-cta-btn">
          Book Your Salon Appointment
        </Button>
      </div>
    </section>
  )
}