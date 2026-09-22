import { useRef } from 'react'
import { useReveal } from '../../hooks/useReveal'
import './BenefitsSection.css'

const benefits = [
  {
    img: '/images/icons/moment_pause.svg',
    title: 'A Moment to Pause',
    lines: ['Slow down. Settle in.', 'Enjoy the atmosphere.'],
  },
  {
    img: '/images/icons/paris.svg',
    title: 'Parisian Atmosphere',
    lines: ['Inspired by the charm', 'of Parisian café culture.'],
  },
  {
    img: '/images/icons/coffe.svg',
    title: 'Complimentary Coffee',
    lines: ['A little Parisian ritual', 'with your appointment.'],
  },
]

export default function BenefitsSection() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <section className="benefits" ref={ref}>
      <div className="container benefits-grid">
        {benefits.map((b, i) => {
          return (
            <div className="benefit reveal" style={{ '--i': i }} key={b.title}>
              <span className="benefit-icon" aria-hidden="true">
                <img src={b.img} alt="" width={40} height={40} />
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
