import { useEffect, useRef } from 'react'
import './BenefitsSection.css'

const benefits = [
  {
    img: '/moment_pause.svg',
    title: 'A Moment to Pause',
    lines: ['Slow down. Settle in.', 'Enjoy the atmosphere.'],
  },
  {
    img: '/paris.svg',
    title: 'Parisian Atmosphere',
    lines: ['Inspired by the charm', 'of Parisian café culture.'],
  },
  {
    img: '/coffe.svg',
    title: 'Complimentary Coffee',
    lines: ['A little Parisian ritual', 'with your appointment.'],
  },
]

export default function BenefitsSection() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.2 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <section className="benefits" ref={ref}>
      <div className="container benefits-grid">
        {benefits.map((b, i) => {
          return (
            <div className="benefit reveal" style={{ '--i': i }} key={b.title}>
              <span className="benefit-icon" aria-hidden="true">
                <img src={b.img} alt={b.title} width={40} height={40} />
              </span>
              <h3 className="benefit-title">{b.title}</h3>
              <p className="benefit-text">
                {b.lines.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
