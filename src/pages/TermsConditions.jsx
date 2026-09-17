import { useEffect, useRef, useState } from 'react'
import './Legal.css'

const sections = [
  { id: 'terms-acceptance', num: '01', title: 'Acceptance of Terms' },
  { id: 'terms-services', num: '02', title: 'Our Services' },
  { id: 'terms-payment', num: '03', title: 'Ordering & Payment' },
  { id: 'terms-allergies', num: '04', title: 'Allergies & Dietary Needs' },
  { id: 'terms-etiquette', num: '05', title: 'Café & Salon Etiquette' },
  { id: 'terms-gifts', num: '06', title: 'Gift Cards & Promotions' },
  { id: 'terms-liability', num: '07', title: 'Liability' },
  { id: 'terms-ip', num: '08', title: 'Intellectual Property' },
  { id: 'terms-changes', num: '09', title: 'Changes to These Terms' },
]

const contact = {
  email: 'hello@parisbeans.com',
  phone: '+91 98765 43210',
  phoneTel: '+919876543210',
}

export default function TermsConditions() {
  const pageRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState(sections[0].id)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0)

      const page = pageRef.current
      if (page) {
        const rect = page.getBoundingClientRect()
        const span = rect.height - window.innerHeight
        const frac = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1
        page.style.setProperty('--toc-progress', `${frac * 100}%`)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            setActiveId(e.target.id)
          }
        })
      },
      { rootMargin: '-25% 0px -60% 0px' }
    )
    page.querySelectorAll('.legal-section').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <main id="main" className="legal-page" ref={pageRef}>
      <div className="legal-progress" aria-hidden="true">
        <span className="legal-progress-bar" style={{ width: `${progress}%` }} />
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
            <span className="legal-eyebrow">Terms &amp; Conditions</span>
            <h1 className="legal-title">
              The Fine Print, <em>Made Friendly.</em>
            </h1>
            <p className="legal-lede">
              These terms outline the simple ground rules for enjoying Paris Beans
              — online and in person, inside Hair Rap by Yoyo. By visiting or
              ordering from us, you agree to them.
            </p>
            <p className="legal-meta">
              Last updated <span>January 2026</span>
            </p>
          </header>

          <section id="terms-acceptance" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">01</span>
              <h2 className="legal-h2">Acceptance of Terms</h2>
            </div>
            <p>
              By accessing the Paris Beans website or visiting our café corner at
              Hair Rap by Yoyo, you agree to be bound by these Terms &amp;
              Conditions. If you do not agree with any part of them, please do
              not use our services.
            </p>
          </section>

          <section id="terms-services" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">02</span>
              <h2 className="legal-h2">Our Services</h2>
            </div>
            <p>
              Paris Beans offers a curated café experience — specialty coffees,
              light bites and refreshments — designed to complement your salon
              visit. We may change, pause or withdraw services from time to time
              as our offer evolves.
            </p>
          </section>

          <section id="terms-payment" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">03</span>
              <h2 className="legal-h2">Ordering &amp; Payment</h2>
            </div>
            <p>
              All prices are listed in Indian Rupees (₹) and include applicable
              taxes. Payment is expected at the time of ordering. We reserve the
              right to decline or refund an order in the rare case of a pricing
              error.
            </p>
          </section>

          <section id="terms-allergies" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">04</span>
              <h2 className="legal-h2">Allergies &amp; Dietary Needs</h2>
            </div>
            <p>
              Please tell our team about any allergies or dietary requirements
              before ordering. While we take care to prepare items correctly, we
              cannot guarantee that any menu item is free from allergens.
            </p>
          </section>

          <section id="terms-etiquette" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">05</span>
              <h2 className="legal-h2">Café &amp; Salon Etiquette</h2>
            </div>
            <p>
              We want every visit to feel calming and special — for everyone.
              Kindly respect the space, its guests and the team:
            </p>
            <ul className="legal-list">
              <li>Please be mindful of other guests&apos; space and conversations.</li>
              <li>Children are welcome, with supervision.</li>
              <li>Photography is encouraged — just be considerate during busy moments.</li>
              <li>Please dispose of your coffee cups and wrappers thoughtfully.</li>
            </ul>
          </section>

          <section id="terms-gifts" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">06</span>
              <h2 className="legal-h2">Gift Cards &amp; Promotions</h2>
            </div>
            <p>
              Gift cards and promotional offers are valid for the period stated
              on the card or offer. They are non-refundable, cannot be exchanged
              for cash, and remain the sole responsibility of the holder.
            </p>
          </section>

          <section id="terms-liability" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">07</span>
              <h2 className="legal-h2">Liability</h2>
            </div>
            <p>
              To the fullest extent permitted by law, Paris Beans and Hair Rap by
              Yoyo shall not be held liable for any indirect, incidental or
              consequential loss arising from use of our website or services.
              Consuming beverages served hot is at your own risk — please take
              care.
            </p>
          </section>

          <section id="terms-ip" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">08</span>
              <h2 className="legal-h2">Intellectual Property</h2>
            </div>
            <p>
              All content on this site — including the Paris Beans name, logo,
              images and copy — belongs to Paris Beans. You may not reproduce,
              distribute or use it commercially without our written permission.
            </p>
          </section>

          <section id="terms-changes" className="legal-section">
            <div className="legal-section-top">
              <span className="legal-num">09</span>
              <h2 className="legal-h2">Changes to These Terms</h2>
            </div>
            <p>
              We may update these Terms &amp; Conditions from time to time. Any
              changes will be posted on this page with an updated date, and your
              continued use of our services means you accept the revised terms.
            </p>
          </section>

          <div className="legal-contact">
            <h3>Still curious?</h3>
            <p>
              Reach out to the Paris Beans team at{' '}
              <strong>{contact.email}</strong> or by phone at{' '}
              <strong>{contact.phone}</strong>. We&apos;ll be happy to answer.
            </p>
            <div className="legal-contact-actions">
              <a className="btn btn--primary" href={`mailto:${contact.email}`}>
                Email the team
              </a>
              <a className="btn btn--outline" href={`tel:${contact.phoneTel}`}>
                Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}