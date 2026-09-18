import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import emailjs from '@emailjs/browser'
import Button from './Button'
import { contact } from '../data/siteData'
import { MapPinIcon, PhoneIcon, MailIcon, InstagramIcon, YoutubeIcon, FacebookIcon } from './Icons'
import './VisitContact.css'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export default function ContactLocation() {
  const ref = useRef(null)
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle')
  useReveal(ref, { threshold: 0.12 })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target, { publicKey: PUBLIC_KEY })
      setStatus('sent')
      e.target.reset()
    } catch {
      setStatus('error')
    }
  }

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${contact.mapBbox}&layer=mapnik`

  return (
    <section id="visit-contact" className="visit-contact section" ref={ref}>
      <div className="visit-contact-grid">

        {/* Left — Contact form */}
        <div className="visit-card visit-form-card reveal">
          <h2 className="visit-card-title">Get in touch</h2>

          <form className="visit-form" ref={formRef} onSubmit={handleSubmit}>
            <label className="visit-field">
              <span className="sr-only">Name</span>
              <input type="text" name="from_name" placeholder="Name" required autoComplete="name" />
            </label>
            <label className="visit-field">
              <span className="sr-only">Email</span>
              <input type="email" name="reply_to" placeholder="Email" required autoComplete="email" />
            </label>
            <label className="visit-field">
              <span className="sr-only">Message</span>
              <textarea name="message" placeholder="Message" rows="4" required />
            </label>

            <label className="visit-checkbox">
              <input type="checkbox" name="newsletter" value="yes" />
              <span className="visit-checkbox-box" aria-hidden="true" />
              <span>I would like to receive the newsletter.</span>
            </label>

            <Button as="button" type="submit" variant="primary" arrow className="visit-submit-btn">
              {status === 'sending' ? 'Sending…' : 'Submit'}
            </Button>

            {status === 'sent' && (
              <p className="visit-status visit-status--success" role="status">
                Thank you — your message has been sent.
              </p>
            )}
            {status === 'error' && (
              <p className="visit-status visit-status--error" role="alert">
                Something went wrong. Please try again.
              </p>
            )}
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
              <span className="visit-map-card-name">{contact.location}</span>
              <span className="visit-map-card-address">
                {contact.address}
              </span>
            </div>
            <iframe
              title="Paris Beans location"
              className="visit-map"
              src={mapSrc}
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
                <span className="visit-info-value">{contact.city}</span>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <PhoneIcon size={18} />
                </span>
                <span className="visit-info-value">{contact.phone}</span>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <MailIcon size={18} />
                </span>
                <span className="visit-info-value">{contact.email}</span>
              </li>
            </ul>

            <div className="visit-social" aria-label="Social media">
              <a href={contact.social.youtube} aria-label="YouTube" className="social-link" target="_blank" rel="noopener noreferrer">
                <YoutubeIcon size={22} />
              </a>
              <a href={contact.social.instagram} aria-label="Instagram" className="social-link" target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={22} />
              </a>
              <a href={contact.social.facebook} aria-label="Facebook" className="social-link" target="_blank" rel="noopener noreferrer">
                <FacebookIcon size={22} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}