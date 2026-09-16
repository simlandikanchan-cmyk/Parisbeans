import { useEffect, useRef } from 'react'
import { exploreLinks } from '../data/siteData'
import { InstagramIcon, YoutubeIcon, FacebookIcon, MapPinIcon, ClockIcon, PhoneIcon, WhatsAppIcon } from './Icons'
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

    // Animate watermark drift on scroll
    const onScroll = () => {
      const r = footer.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      footer.style.setProperty(
        '--watermark-drift',
        `${Math.max(0, Math.min(40, (1 - r.top / window.innerHeight) * 40))}px`
      )
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <footer id="visit" className="footer" ref={ref}>
      {/* Oversized editorial watermark */}
      <span className="footer-watermark" aria-hidden="true">
        Paris Beans
      </span>

      <div className="container footer-grid">
        {/* Brand */}
        <div className="footer-brand footer-reveal footer-reveal--0">
          <span className="footer-logo">
            <img src="/logo (2).svg" alt="Paris Beans logo" className="logo-img" />
          </span>
          <span className="footer-brand-name">Paris Beans</span>
          <p className="footer-desc">
            A Paris-inspired café experience inside Hair Rap by Yoyo. A space
            to pause, enjoy good coffee, and experience the charm of Paris in a
            contemporary salon setting.
          </p>
          <div className="footer-social" aria-label="Social media">
            <a href="https://instagram.com/parisbeans" aria-label="Instagram" className="social-link" target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
            </a>
            <a href="https://www.youtube.com/@parisbeans" aria-label="YouTube" className="social-link" target="_blank" rel="noopener noreferrer">
              <YoutubeIcon />
            </a>
            <a href="https://www.facebook.com/parisbeans" aria-label="Facebook" className="social-link" target="_blank" rel="noopener noreferrer">
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
              <div className="contact-body">
                <span className="contact-label">Paris Beans at Hair Rap by Yoyo</span>
                <span className="contact-sub">12 Rue du Salon, Mumbai, India</span>
              </div>
            </li>
            <li className="contact-item">
              <ClockIcon />
              <div className="contact-body">
                <span className="contact-label">Opening Hours</span>
                <span className="contact-sub">Mon – Sat: 10:00 AM – 8:00 PM</span>
                <span className="contact-sub">Sunday: 11:00 AM – 5:00 PM</span>
              </div>
            </li>
            <li className="contact-item">
              <PhoneIcon />
              <a className="contact-body" href="tel:+919876543210">
                <span className="contact-label">Phone</span>
                <span className="contact-sub">+91 98765 43210</span>
              </a>
            </li>
            <li className="contact-item">
              <WhatsAppIcon />
              <a
                className="contact-body"
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-label">WhatsApp</span>
                <span className="contact-sub">+91 98765 43210</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-bottom-brand">
            Paris Beans · <span>Hair Rap by Yoyo</span>
          </p>
          <p className="footer-tagline">Pause. Sip. Enjoy.</p>
          <div className="footer-legal">
            <span>© 2026 Paris Beans. All rights reserved.</span>
            <span className="legal-links">
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms-and-conditions">Terms &amp; Conditions</a>
            </span>
          </div>
          <a href="/" className="back-to-top" aria-label="Back to top">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  )
}