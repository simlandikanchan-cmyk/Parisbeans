import { useEffect, useRef } from 'react'
import { menuCategories } from '../../../../shared/models/siteData'
import { srcSize } from '../../../../shared/assets/srcSize'
import { useReveal } from '../../../../shared/hooks/useReveal'
import '../Menu.css'

export default function MenuCategories({ activeId, onSelect }) {
  const ref = useRef(null)
  const navRef = useRef(null)
  const resizeObserverRef = useRef(null)

  useReveal(ref, { threshold: 0.08 })

  const activeCategory =
    menuCategories.find((cat) => cat.id === activeId) ?? menuCategories[0]

  const moveIndicator = () => {
    const nav = navRef.current
    if (!nav) return
    const btn = nav.querySelector('.menu-tab.is-active')
    const indicator = nav.querySelector('.menu-tab-indicator')
    if (!btn || !indicator) return
    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    indicator.style.setProperty('--ind-x', `${btnRect.left - navRect.left}px`)
    indicator.style.setProperty('--ind-w', `${btnRect.width}px`)
  }

  useEffect(() => {
    moveIndicator()
    const nav = navRef.current
    if (!nav) return
    // Use ResizeObserver to handle layout changes (font load, resize, etc.)
    const ro = new ResizeObserver(moveIndicator)
    ro.observe(nav)
    resizeObserverRef.current = ro
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    moveIndicator()
  }, [activeId])

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
              <img src={cat.image} alt="" className="menu-tab-thumb" {...srcSize(cat.image)} />
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile: category dropdown (shown ≤560px, tabs hidden) */}
        <div className="menu-cats-dropdown">
          <label className="sr-only" htmlFor="menu-category-select">
            Select menu category
          </label>
          <div className="menu-select-wrap">
            <img
              src={activeCategory.image}
              alt=""
              className="menu-select-thumb"
              {...srcSize(activeCategory.image)}
            />
            <select
              id="menu-category-select"
              className="menu-select"
              value={activeId}
              onChange={(e) => onSelect(e.target.value)}
            >
              {menuCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="menu-select-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="menu-cats-divider" aria-hidden="true" />
      </div>
    </section>
  )
}