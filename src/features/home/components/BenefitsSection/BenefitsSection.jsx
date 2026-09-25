import { useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { icons } from '../../../../shared/assets/icons'
import './BenefitsSection.css'

const benefits = [
  {
    img: icons.momentPause,
    title: 'A Moment to Pause',
    lines: ['Slow down. Settle in.', 'Enjoy the atmosphere.'],
  },
  {
    img: icons.paris,
    title: 'Parisian Atmosphere',
    lines: ['Inspired by the charm', 'of Parisian café culture.'],
  },
  {
    img: icons.coffe,
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
              <img className="benefit-icon" src={b.img} alt="" width={44} height={44} />
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
