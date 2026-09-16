import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { navLinks } from '../data/siteData'
import Button from './Button'
import './Header.css'

export default function Header({ story = false }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${story ? 'is-story' : ''}`}>
      <div className="header-inner">
        <nav className="nav-left" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a key={link.label} className="nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a href="/" className="header-logo" aria-label="Paris Beans — home">
          <img src="/logo (2).svg" alt="" className="logo-img" />
        </a>

        <div className="header-right">
          <Button href="/visit-contact" variant="dark" size="small" className="header-cta">
            Book Appointment
          </Button>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </div>

      <div className={`mobile-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <a href="/" className="drawer-logo" onClick={() => setOpen(false)}>
            <img src="/logo (2).svg" alt="" className="logo-img" />
            <span className="logo-word">Paris Beans</span>
          </a>
          <button
            type="button"
            className="menu-toggle close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <nav className="drawer-nav" aria-label="Mobile navigation">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              className="drawer-link"
              href={link.href}
              style={{ '--i': i }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="/visit-contact" className="btn btn--primary drawer-cta" onClick={() => setOpen(false)}>
            Book Appointment
          </a>
        </nav>
      </div>

      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} />}
    </header>
  )
}
