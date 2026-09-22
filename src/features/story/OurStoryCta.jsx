import Button from '../../ui/Button'
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
          ParisBeans Is Not Just a <em>Café Corner.</em>
        </h2>
        <p className="ostory-cta-desc">
          It is a small Parisian ritual built into your HAIR RAP BY YOYO experience.
        </p>
        <Button href="/visit-contact" variant="primary" arrow className="ostory-cta-btn">
          Read Our Story
        </Button>
      </div>
    </section>
  )
}