import { useEffect, useRef } from 'react'
import Button from './Button'
import { MapPinIcon, PhoneIcon, MailIcon, InstagramIcon, YoutubeIcon, FacebookIcon } from './Icons'
import './VisitContact.css'

export default function ContactLocation() {
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
    <section className="visit-contact section" ref={ref}>
      <div className="visit-contact-grid">

        {/* Left — Contact form */}
        <div className="visit-card visit-form-card reveal">
          <h2 className="visit-card-title">Get in touch</h2>

          <form className="visit-form" onSubmit={(e) => e.preventDefault()}>
            <label className="visit-field">
              <span className="sr-only">Name</span>
              <input type="text" name="name" placeholder="Name" required autoComplete="name" />
            </label>
            <label className="visit-field">
              <span className="sr-only">Email</span>
              <input type="email" name="email" placeholder="Email" required autoComplete="email" />
            </label>
            <label className="visit-field">
              <span className="sr-only">Message</span>
              <textarea name="message" placeholder="Message" rows="4" required />
            </label>

              <label className="visit-field">
              <span className="sr-only">Message</span>
              <textarea name="message" placeholder="Comment Box" rows="4" required />
            </label>

            <label className="visit-checkbox">
              <input type="checkbox" name="newsletter" />
              <span className="visit-checkbox-box" aria-hidden="true" />
              <span>I would like to receive the newsletter.</span>
            </label>

            <Button as="button" type="submit" variant="primary" arrow className="visit-submit-btn">
              Submit
            </Button>
          </form>
        </div>

        {/* Right — Location / Info */}
        <div className="visit-card visit-info-card reveal reveal-delay-1">
          <p className="visit-info-intro">
            Paris Beans at HAIR RAP BY YOYO — a little Parisian escape, right
            inside your salon visit, made for moments that feel special.
          </p>

          <div className="visit-map-wrap">
            <div className="visit-map-card">
              <span className="visit-map-card-name">Paris Beans</span>
              <span className="visit-map-card-address">
                315 W 36th St.
                <br />
                NY 10018
              </span>
            </div>
            <iframe
              title="Paris Beans location"
              className="visit-map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-74.015,40.710,-73.990,40.725&layer=mapnik"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="visit-info-footer">
            <ul className="visit-info-list" aria-label="Contact information">
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <MapPinIcon size={18} />
                </span>
                <span className="visit-info-value">NYC, United States</span>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <PhoneIcon size={18} />
                </span>
                <span className="visit-info-value">000111222333</span>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <MailIcon size={18} />
                </span>
                <span className="visit-info-value">somebody@gmail.com</span>
              </li>
            </ul>

            <div className="visit-social" aria-label="Social media">
              <a href="#youtube" aria-label="YouTube" className="social-link">
                <YoutubeIcon size={22} />
              </a>
              <a href="#instagram" aria-label="Instagram" className="social-link">
                <InstagramIcon size={22} />
              </a>
              <a href="#facebook" aria-label="Facebook" className="social-link">
                <FacebookIcon size={22} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}