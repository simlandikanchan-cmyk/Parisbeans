import Button from './Button'
import './OurStoryCta.css'

export default function OurStoryCta() {
  return (
    <section className="ostory-cta">
      <div className="ostory-shell ostory-cta-inner">
        <p className="eyebrow ostory-eyebrow">
          <span className="ostory-dash" aria-hidden="true" />
          OUR STORY
        </p>
        <h2 className="ostory-cta-title">
          Inspired by Paris
          <br />
          <em>Streets.</em> Crafted for
          <br />
          Your <em>Salon Day.</em>
        </h2>
        <p className="ostory-cta-desc">
          Born from a love for the café culture of Paris, Paris
          Beans brings the rhythm of a street-side coffee
          break into the heart of HAIR RAP BY YOYO.
        </p>
        <Button href="/visit-contact" variant="primary" arrow className="ostory-cta-btn">
          Read Our Story
        </Button>
      </div>
    </section>
  )
}