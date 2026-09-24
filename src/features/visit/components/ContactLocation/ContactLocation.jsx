import { useRef, useState } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { sendContactMessage } from '../../api/contactApi'
import Button from '../../../../shared/components/Button'
import { contact } from '../../../../shared/models/siteData'
import { MapPinIcon, PhoneIcon, MailIcon, InstagramIcon, YoutubeIcon, FacebookIcon } from '../../../../shared/components/Icons'
import '../VisitContact.css'

export default function ContactLocation() {
  const ref = useRef(null)
  const submittingRef = useRef(false)
  const [status, setStatus] = useState('idle')
  useReveal(ref, { threshold: 0.12 })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return

    submittingRef.current = true
    setStatus('sending')
    try {
      await sendContactMessage(e.target)
      setStatus('sent')
    } catch {
      setStatus('error')
    } finally {
      submittingRef.current = false
    }
  }

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${contact.mapBbox}&layer=mapnik`

  return (
    <section id="visit-contact" className="visit-contact section" ref={ref}>
      <div className="visit-contact-grid">

        {/* Left — Contact form */}
        <div className="visit-card visit-form-card reveal">
          <h2 className="visit-card-title">Get in touch</h2>

          <form className="visit-form" onSubmit={handleSubmit}>
            <input type="hidden" name="to_email" value={contact.email} />
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
  <textarea name="message" placeholder="Message" rows="4" required enterKeyHint="send" />
</label>

            <label className="visit-checkbox">
              <input type="checkbox" name="newsletter" value="yes" />
              <span className="visit-checkbox-box" aria-hidden="true" />
              <span>I would like to receive the newsletter.</span>
            </label>

            <Button as="button" type="submit" variant="primary" arrow className="visit-submit-btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Submit'}
            </Button>

            {status === 'sent' && (
              <p className="visit-status visit-status--success" role="status">
                Thank you — your message has been sent.
              </p>
            )}
            {status === 'error' && (
              <p className="visit-status visit-status--error" role="alert">
                Something went wrong and your message didn&apos;t send. Please try
                again, or email us directly at{' '}
                <a className="visit-status-link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
                .
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
            <a
              className="visit-map-open"
              href={contact.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open location in Google Maps"
              tabIndex={-1}
            />
            <a
              className="visit-map-card"
              href={contact.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open location in Google Maps"
            >
              <span className="visit-map-card-name">{contact.location}</span>
              <span className="visit-map-card-address">
                {contact.address}
              </span>
              <span className="visit-map-card-link">Open in Google Maps →</span>
            </a>
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
                <a
                  className="visit-info-link"
                  href={contact.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contact.city}
                </a>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <PhoneIcon size={18} />
                </span>
                <a className="visit-info-link" href={`tel:${contact.phoneTel}`}>
                  {contact.phone}
                </a>
              </li>
              <li className="visit-info-item">
                <span className="visit-info-icon" aria-hidden="true">
                  <MailIcon size={18} />
                </span>
                <a className="visit-info-link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
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