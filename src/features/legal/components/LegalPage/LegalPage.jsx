import { useRef, useState } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { useScroll } from '../../../../shared/hooks/useScroll'
import { contact as siteContact } from '../../../../shared/models/siteData'
import './Legal.css'

export default function LegalPage({ title, eyebrow, lede, sections, children }) {
  const pageRef = useRef(null)
  const [activeId, setActiveId] = useState(sections[0].id)

  useScroll(() => {
    const page = pageRef.current
    if (!page) return
    const doc = document.documentElement
    const total = doc.scrollHeight - window.innerHeight
    const progress = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0
    page.style.setProperty('--legal-progress', `${progress}%`)

    const rect = page.getBoundingClientRect()
    const span = rect.height - window.innerHeight
    const frac = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1
    page.style.setProperty('--toc-progress', `${frac * 100}%`)
  })

  useReveal(pageRef, {
    selector: '.legal-section',
    rootMargin: '-25% 0px -60% 0px',
    onReveal: (el) => setActiveId(el.id),
  })

  return (
    <main id="main" className="legal-page" ref={pageRef}>
      <div className="legal-progress" aria-hidden="true">
        <span className="legal-progress-bar" />
      </div>

      <div className="legal-wrap">
        <aside className="legal-aside">
          <nav className="legal-toc" aria-label="On this page">
            <span className="legal-toc-label">On this page</span>
            <ul className="legal-toc-list">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`legal-toc-link${activeId === s.id ? ' is-active' : ''}`}
                  >
                    <span className="legal-toc-num">{s.num}</span>
                    <span className="legal-toc-name">{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="legal-shell">
          <header className="legal-hero">
            <span className="legal-eyebrow">{eyebrow}</span>
            <h1 className="legal-title">{title}</h1>
            <p className="legal-lede">{lede}</p>
            <p className="legal-meta">
              Last updated <span>January 2026</span>
            </p>
          </header>

          {children}

          <div className="legal-contact">
            <h3>Questions? We&apos;re here.</h3>
            <p>
              Contact the Paris Beans team at{' '}
              <strong>{siteContact.email}</strong> or by phone at{' '}
              <strong>{siteContact.phone}</strong>. We&apos;ll be happy to help.
            </p>
            <div className="legal-contact-actions">
              <a className="btn btn--primary" href={`mailto:${siteContact.email}`}>
                Email the team
              </a>
              <a className="btn btn--outline" href={`tel:${siteContact.phoneTel}`}>
                Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}