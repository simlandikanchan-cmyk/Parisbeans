import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { navLinks } from '../data/siteData'
import Button from './Button'
import './Header.css'

const routeHrefs = {
  home: '/',
  story: '/our-story',
  menu: '/menu',
  gallery: '/gallery',
  visit: '/visit-contact',
}

export default function Header({ story = false, route }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastFocus = useRef(null)
  const activeHref = routeHrefs[route]

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

      <div
        ref={drawerRef}
        className={`mobile-drawer ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="drawer-head">
          <a href="/" className="drawer-logo" onClick={() => setOpen(false)}>
            <img src="/logo (2).svg" alt="" className="logo-img" />
            <span className="logo-word">Paris Beans</span>
          </a>
          <button
            ref={closeBtnRef}
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
              className={`drawer-link${link.href === activeHref ? ' is-active' : ''}`}
              href={link.href}
              style={{ '--i': i }}
              aria-current={link.href === activeHref ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/visit-contact"
            className="btn btn--primary drawer-cta"
            style={{ '--i': navLinks.length }}
            onClick={() => setOpen(false)}
          >
            Book Appointment
          </a>
        </nav>
      </div>

      <div
        className={`drawer-backdrop ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
    </header>
  )
}
