import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { navLinks, contact } from '@shared/models/siteData'
import { routePathsList } from '@app/router'
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  ClockIcon,
  PhoneIcon,
} from '@shared/components/Icons'
import Button from '@shared/components/Button'
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

// Staggered entrance for the eyebrow, links, and footer block. y + opacity
// only, so it stays on the compositor.
const revealVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

// 120ms head start, then 60ms per item. Under reduced motion there is no
// delay and no y offset — just an instant fade.
function staggerTransition(reduceMotion, index = 0) {
  if (reduceMotion) return { duration: 0.15 }
  return { duration: 0.32, delay: 0.12 + index * 0.06, ease: [0.22, 1, 0.36, 1] }
}

export default function Header({ story = false, route }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const closeBtnRef = useRef(null)
  const openBtnRef = useRef(null)
  const lastFocus = useRef(null)
  const reduceMotion = useReducedMotion()
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

  // Move focus into the drawer when opened, restore it on close. Prefers the
  // hamburger ref so focus lands back on the trigger itself.
  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement
      closeBtnRef.current?.focus()
    } else {
      const target = openBtnRef.current ?? lastFocus.current
      if (target && document.body.contains(target)) target.focus()
      lastFocus.current = null
    }
  }, [open])

  // Trap Tab focus inside the open drawer; allow Escape to close.
  // Bound to window (not the drawer) so Escape still works if focus ever
  // escapes, and the `contains` check pulls focus back in when it does.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusables = Array.from(
        drawer.querySelectorAll('a[href], button:not([disabled])')
      ).filter((el) => el.offsetParent !== null)
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !drawer.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !drawer.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
            ref={openBtnRef}
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

      <AnimatePresence>
        {open && (
          <motion.div
            ref={drawerRef}
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="pb-menu-drawer"
            // Slide in from the right; under reduced motion it only fades.
            initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0.18 }
                : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="pb-menu-head">
              <a href={routePathsList.home} className="pb-menu-logo" onClick={() => setOpen(false)} aria-label="Paris Beans — home">
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
                <motion.span
                  className="pb-menu-close-x"
                  aria-hidden="true"
                  // 90deg rotation on open, transform-only.
                  animate={{ rotate: 90 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                  }
                />
              </button>
            </div>

            <nav className="pb-menu-nav" aria-label="Mobile navigation">
              <motion.span
                className="pb-menu-eyebrow"
                variants={revealVariants}
                initial="hidden"
                animate="visible"
                transition={staggerTransition(reduceMotion)}
              >
                — Menu
              </motion.span>
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  className={`pb-menu-link${link.href === activeHref ? ' is-active' : ''}`}
                  href={link.href}
                  variants={revealVariants}
                  initial="hidden"
                  animate="visible"
                  transition={staggerTransition(reduceMotion, i)}
                  aria-current={link.href === activeHref ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="pb-menu-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="pb-menu-label">{link.label}</span>
                  <span className="pb-menu-arrow" aria-hidden="true">
                    →
                  </span>
                </motion.a>
              ))}
            </nav>

            <motion.div
              className="pb-menu-footer"
              variants={revealVariants}
              initial="hidden"
              animate="visible"
              transition={staggerTransition(reduceMotion, navLinks.length)}
            >
              {/* One cream block holding both contact lines — no per-row cards. */}
              <div className="pb-menu-meta">
                <a className="pb-menu-meta-row" href={`tel:${contact.phoneTel}`}>
                  <span className="pb-menu-meta-ic" aria-hidden="true">
                    <PhoneIcon size={16} />
                  </span>
                  <span className="pb-menu-meta-txt">
                    <span className="pb-menu-meta-label">Call us</span>
                    <span className="pb-menu-meta-value">{contact.phone}</span>
                  </span>
                </a>
                <span className="pb-menu-meta-row">
                  <span className="pb-menu-meta-ic" aria-hidden="true">
                    <ClockIcon size={16} />
                  </span>
                  <span className="pb-menu-meta-txt">
                    <span className="pb-menu-meta-label">Opening hours</span>
                    <span className="pb-menu-meta-value">{contact.hours.allWeek}</span>
                  </span>
                </span>
              </div>

              <a
                href={routePathsList.visit}
                className="btn btn--primary pb-menu-cta"
                onClick={() => setOpen(false)}
              >
                Book Appointment
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </a>

              <div className="pb-menu-social" aria-label="Follow Paris Beans">
                <span className="pb-menu-social-label">Follow us</span>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="pb-menu-backdrop"
            aria-hidden="true"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.3 }}
          />
        )}
      </AnimatePresence>
    </header>
  )
}