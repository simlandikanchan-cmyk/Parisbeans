import { useEffect, useRef } from 'react'
import Button from './Button'
import './Menu.css'

export default function MenuCTA() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <section className="menu-cta" ref={ref}>
      <div className="menu-cta-stripes" aria-hidden="true" />
      <div className="container menu-cta-content reveal">
        <p className="eyebrow">— Paris Beans</p>
        <h2 className="menu-cta-title">Your Table Is Waiting.</h2>
        <p className="menu-cta-desc">
          Take a pause, enjoy your favourite from the menu, and soak in the
          Paris-inspired atmosphere at ParisBeans.
        </p>
        <Button href="/visit-contact" variant="primary" size="small" arrow>
          Visit ParisBeans
        </Button>
      </div>
    </section>
  )
}