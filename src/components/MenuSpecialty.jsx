import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import { srcSize } from '../data/siteData'
import './Menu.css'

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
            {category.heading} <span className="menu-special-size">{category.size}</span>
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
          <div className="menu-beans" aria-hidden="true">
            <svg className="menu-bean menu-bean--1" viewBox="0 0 48 48">
              <ellipse cx="24" cy="24" rx="13" ry="19" transform="rotate(-30 24 24)" fill="currentColor" opacity="0.5" />
              <path d="M24 6 C15 16, 15 32, 24 42" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
            </svg>
            <svg className="menu-bean menu-bean--2" viewBox="0 0 48 48">
              <ellipse cx="24" cy="24" rx="13" ry="19" transform="rotate(-30 24 24)" fill="currentColor" opacity="0.5" />
              <path d="M24 6 C15 16, 15 32, 24 42" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
            </svg>
            <svg className="menu-bean menu-bean--3" viewBox="0 0 48 48">
              <ellipse cx="24" cy="24" rx="13" ry="19" transform="rotate(-30 24 24)" fill="currentColor" opacity="0.5" />
              <path d="M24 6 C15 16, 15 32, 24 42" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
            </svg>
          </div>

          <div className="menu-cup-echo" aria-hidden="true">
            <img src={category.image} alt="" className="menu-echo-cup" aria-hidden="true" {...srcSize(category.image)} />
          </div>

          <img
            src={category.image}
            alt={category.imageAlt}
            className="menu-cup"
            {...srcSize(category.image)}
          />
        </div>
      </div>
    </section>
  )
}