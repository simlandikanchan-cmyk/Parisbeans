import { useEffect, useRef, useState } from 'react'
import { navLinks, contact } from '../../../../shared/models/siteData'
import { routePathsList } from '../../../router'
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  ClockIcon,
  PhoneIcon,
} from '../../../../shared/components/Icons'
import Button from '../../../../shared/components/Button'
import './Header.css'

function Hamburger({ open = false }) {
  return (
    <span className={`hamburger-box${open ? ' is-open' : ''}`} aria-hidden="true">
      <span className="hamburger-line" />
      <span className="hamburger-line" />
      <span className="hamburger-line" />
    </span>
  )
}

export default function Header({ story = false, route }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastFocus = useRef(null)
  const activeHref = routePathsList[route]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    document.body.classList.toggle('drawer-open', open)
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('drawer-open')
    }
  }, [open])

  // Move focus into the drawer when opened, restore it on close
  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement
      closeBtnRef.current?.focus()
    } else if (lastFocus.current && document.body.contains(lastFocus.current)) {
      lastFocus.current.focus()
      lastFocus.current = null
    }
  }, [open])

  // Trap Tab focus inside the open drawer; allow Escape to close
  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer || !open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const focusables = drawer.querySelectorAll('a[href], button:not([disabled])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    drawer.addEventListener('keydown', onKey)
    return () => drawer.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${story ? 'is-story' : ''}`}>
      <div className="header-inner">
        <nav className="nav-left" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              className={`nav-link${link.href === activeHref ? ' is-active' : ''}`}
              href={link.href}
              aria-current={link.href === activeHref ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href={routePathsList.home} className="header-logo" aria-label="Paris Beans — home">
          <img src="/images/logo.svg" alt="Paris Beans" width={113} height={112} className="logo-img" />
        </a>

        <div className="header-right">
          <Button href={routePathsList.visit} variant="dark" size="small" className="header-cta">
            Book Appointment
          </Button>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen(true)}
          >
            <Hamburger open={open} />
          </button>
        </div>
      </div>

      <div
        ref={drawerRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`mobile-drawer ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="drawer-head">
          <a href={routePathsList.home} className="drawer-logo" onClick={() => setOpen(false)} aria-label="Paris Beans — home">
            <img src="/images/logo.svg" alt="" width={113} height={112} className="logo-img" />
            <span className="logo-word">Paris Beans</span>
          </a>
          <button
            ref={closeBtnRef}
            type="button"
            className="menu-toggle close"
            aria-label="Close menu"
            aria-controls="mobile-drawer"
            onClick={() => setOpen(false)}
          >
            <span className="drawer-close-x" aria-hidden="true" />
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Mobile navigation">
          <span className="drawer-eyebrow">— Menu</span>
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              className={`drawer-link${link.href === activeHref ? ' is-active' : ''}`}
              href={link.href}
              style={{ '--i': i }}
              aria-current={link.href === activeHref ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="drawer-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="drawer-label">{link.label}</span>
              <span className="drawer-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </nav>

        <div className="drawer-footer">
          <div className="drawer-meta">
            <a href={`tel:${contact.phoneTel}`}>
              <PhoneIcon size={16} />
              <span>{contact.phone}</span>
            </a>
            <span className="drawer-meta-sep" aria-hidden="true">
              ·
            </span>
            <span className="drawer-meta-icon">
              <ClockIcon size={16} />
              <span>{contact.hours.allWeek}</span>
            </span>
          </div>

          <a
            href={routePathsList.visit}
            className="btn btn--primary drawer-cta"
            onClick={() => setOpen(false)}
          >
            Book Appointment
            <span className="btn-arrow" aria-hidden="true">
              →
            </span>
          </a>

          <div className="drawer-social" aria-label="Follow Paris Beans">
            <span className="drawer-social-label">Follow us</span>
            <a
              href={contact.social.instagram}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={contact.social.youtube}
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
            >
              <YoutubeIcon size={18} />
            </a>
            <a
              href={contact.social.facebook}
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookIcon size={18} />
            </a>
          </div>
        </div>
      </div>

      <div
        className={`drawer-backdrop ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
    </header>
  )
}