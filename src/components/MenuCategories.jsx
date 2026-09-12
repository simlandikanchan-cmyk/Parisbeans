import { useEffect, useRef } from 'react'
import { menuCategories } from '../data/siteData'
import './Menu.css'

export default function MenuCategories({ activeId, onSelect }) {
  const ref = useRef(null)
  const navRef = useRef(null)

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

  const moveIndicator = () => {
    const nav = navRef.current
    if (!nav) return
    const btn = nav.querySelector('.menu-tab.is-active')
    const indicator = nav.querySelector('.menu-tab-indicator')
    if (!btn || !indicator) return
    indicator.style.left = `${btn.offsetLeft}px`
    indicator.style.width = `${btn.offsetWidth}px`
  }

  useEffect(() => {
    moveIndicator()
  }, [activeId])

  useEffect(() => {
    moveIndicator()
    window.addEventListener('resize', moveIndicator)
    return () => window.removeEventListener('resize', moveIndicator)
  }, [])

  return (
    <section className="menu-cats" ref={ref}>
      <div className="container menu-cats-inner reveal">
        <nav className="menu-cats-tabs" ref={navRef} aria-label="Menu categories">
          <span className="menu-tab-indicator" aria-hidden="true" />
          {menuCategories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className={`menu-tab${cat.id === activeId ? ' is-active' : ''}`}
              aria-current={cat.id === activeId ? 'true' : undefined}
              onClick={() => onSelect(cat.id)}
            >
              <img src={cat.image} alt="" className="menu-tab-thumb" />
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>
        <div className="menu-cats-divider" aria-hidden="true" />
      </div>
    </section>
  )
}