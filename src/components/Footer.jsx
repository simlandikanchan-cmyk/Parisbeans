import { useEffect, useRef } from 'react'
import { exploreLinks, contact } from '../data/siteData'
import { InstagramIcon, YoutubeIcon, FacebookIcon, MapPinIcon, ClockIcon, PhoneIcon } from './Icons'
import './Footer.css'

export default function Footer({ route }) {
  const ref = useRef(null)
  const activeHref = {
    home: '/',
    story: '/our-story',
    menu: '/menu',
    gallery: '/gallery',
    visit: '/visit-contact',
  }[route]

  useEffect(() => {
    const footer = ref.current
    if (!footer) return

    // Fade columns in when the footer enters the viewport
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            footer.classList.add('revealed')
            io.disconnect()
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(footer)
    return () => io.disconnect()
  }, [])

  return (
    <footer id="footer" className="footer" ref={ref}>
      <div className="container footer-grid">
        {/* Brand */}
        <div className="footer-brand footer-reveal footer-reveal--0">
          <span className="footer-logo">
            <img src="/images/logo.svg" alt="Paris Beans logo" className="logo-img" />
          </span>
          <span className="footer-brand-name">Paris Beans</span>
          <p className="footer-desc">
            A Paris-inspired café experience inside HAIR RAP BY YOYO. A space
            to pause, enjoy good coffee, and experience the charm of Paris in a
            contemporary salon setting.
          </p>
          <div className="footer-social" aria-label="Social media">
            <a href={contact.social.instagram} aria-label="Instagram" className="social-link" target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
            </a>
            <a href={contact.social.youtube} aria-label="YouTube" className="social-link" target="_blank" rel="noopener noreferrer">
              <YoutubeIcon />
            </a>
            <a href={contact.social.facebook} aria-label="Facebook" className="social-link" target="_blank" rel="noopener noreferrer">
              <FacebookIcon />
            </a>
          </div>
        </div>

        {/* Explore */}
        <div className="footer-col footer-reveal footer-reveal--1">
          <h4 className="footer-heading">Explore</h4>
          <ul className="footer-links">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={`footer-link${link.href === activeHref ? ' is-active' : ''}`}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Visit & Contact */}
        <div className="footer-col footer-col--contact footer-reveal footer-reveal--2">
          <h4 className="footer-heading">Visit &amp; Contact</h4>
          <ul className="footer-contact">
            <li className="contact-item">
              <MapPinIcon />
              <a
                className="contact-body"
                href={contact.mapLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-label">{contact.location}</span>
                <span className="contact-sub">{contact.address}</span>
              </a>
            </li>
            <li className="contact-item">
              <ClockIcon />
              <div className="contact-body">
                <span className="contact-label">Opening Hours</span>
                <span className="contact-sub">{contact.hours.days}</span>
                <span className="contact-sub">{contact.hours.allWeek}</span>
              </div>
            </li>
            <li className="contact-item">
              <PhoneIcon />
              <a className="contact-body" href={`tel:${contact.phoneTel}`}>
                <span className="contact-label">Phone</span>
                <span className="contact-sub">{contact.phone}</span>
              </a>
            </li>
            </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-bottom-brand">
            Paris Beans · <span>HAIR RAP BY YOYO</span>
          </p>
          <p className="footer-tagline">Pause. Sip. Enjoy.</p>
          <div className="footer-legal">
            <span>© 2026 Paris Beans. All rights reserved.</span>
            <span className="legal-links">
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms-and-conditions">Terms &amp; Conditions</a>
            </span>
          </div>
          <a
            href="#"
            className="back-to-top"
            aria-label="Back to top"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            }}
          >
            Back to top
          </a>
        </div>
      </div>
    </footer>
  )
}