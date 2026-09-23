import { useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { srcSize } from '../../../../shared/assets/srcSize'
import '../Menu.css'

export default function MenuSpecialty({ category }) {
  const ref = useRef(null)
  useReveal(ref, { threshold: 0.1 })

  return (
    <section className="menu-special" ref={ref}>
      <div className="container menu-special-grid">
        <div className="menu-special-list reveal">
          <div className="menu-special-ghost" aria-hidden="true">
            <img src={category.image} alt="" className="menu-special-ghost-cup" {...srcSize(category.image)} />
          </div>

          <h2 className="menu-special-title">
            {category.heading} {category.size && <span className="menu-special-size">{category.size}</span>}
          </h2>

          <ul className="menu-list">
            {category.items.map((item, i) => (
              <li className="menu-row" key={item.name} style={{ '--i': i }}>
                <div className="menu-row-top">
                  <span className="menu-item-name">{item.name}</span>
                  <span className="menu-item-leader" aria-hidden="true" />
                  <span className="menu-item-price">{item.price}</span>
                </div>
                <p className="menu-item-desc">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="menu-special-visual reveal reveal-delay-1">
          <div className="menu-glow" aria-hidden="true" />
          <div className="menu-ring" aria-hidden="true" />

          <div className="menu-cup-echo" aria-hidden="true">
            <img src={category.image} alt="" className="menu-echo-cup" aria-hidden="true" {...srcSize(category.image)} />
          </div>

          <div className="menu-cup-frame">
            <img
              src={category.image}
              alt={category.imageAlt}
              className="menu-cup"
              {...srcSize(category.image)}
            />
            <span className="menu-shine" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}