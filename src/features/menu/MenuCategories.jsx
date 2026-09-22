import { useEffect, useRef } from 'react'
import { menuCategories } from '../../data/siteData'
import { srcSize } from '../../utils/srcSize'
import { useReveal } from '../../hooks/useReveal'
import './Menu.css'

export default function MenuCategories({ activeId, onSelect }) {
  const ref = useRef(null)
  const navRef = useRef(null)
  const resizeObserverRef = useRef(null)

  useReveal(ref, { threshold: 0.08 })

  const moveIndicator = () => {
    const nav = navRef.current
    if (!nav) return
    const btn = nav.querySelector('.menu-tab.is-active')
    const indicator = nav.querySelector('.menu-tab-indicator')
    if (!btn || !indicator) return
    const baseX = Number(indicator.dataset.baseX)
    const baseW = Number(indicator.dataset.baseW)
    if (!Number.isFinite(baseX) || !Number.isFinite(baseW)) {
      indicator.style.setProperty('--ind-base-w', `${btn.offsetWidth}px`)
      indicator.dataset.baseX = String(btn.offsetLeft)
      indicator.dataset.baseW = String(btn.offsetWidth)
      return
    }
    indicator.style.setProperty('--ind-x', `${btn.offsetLeft - baseX}px`)
    indicator.style.setProperty('--ind-s', btn.offsetWidth / baseW)
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
        <div className="menu-cats-divider" aria-hidden="true" />
      </div>
    </section>
  )
}