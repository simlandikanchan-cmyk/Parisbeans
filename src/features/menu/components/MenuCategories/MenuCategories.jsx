import { useEffect, useRef, useState } from 'react'
import { menuCategories } from '../../../../shared/models/siteData'
import { srcSize } from '../../../../shared/assets/srcSize'
import { useReveal } from '../../../../shared/hooks/useReveal'
import '../Menu.css'

export default function MenuCategories({ activeId, onSelect }) {
  const ref = useRef(null)
  const navRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)

  useReveal(ref, { threshold: 0.08 })

  const activeCategory =
    menuCategories.find((cat) => cat.id === activeId) ?? menuCategories[0]
  const optionId = (id) => `menu-option-${id}`

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

  // Close the mobile dropdown on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openList = () => {
    const i = menuCategories.findIndex((cat) => cat.id === activeId)
    setFocusIndex(i < 0 ? 0 : i)
    setOpen(true)
  }

  const selectCategory = (id) => {
    onSelect(id)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e) => {
    const last = menuCategories.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openList()
        else setFocusIndex((i) => Math.min(i + 1, last))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openList()
        else setFocusIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setFocusIndex(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setFocusIndex(last)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) selectCategory(menuCategories[focusIndex].id)
        else openList()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

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
        <div className="menu-cats-dropdown" ref={dropdownRef}>
          <span className="sr-only" id="menu-category-label">
            Select menu category
          </span>
          <button
            type="button"
            ref={triggerRef}
            className={`menu-select-trigger${open ? ' is-open' : ''}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls="menu-category-list"
            aria-labelledby="menu-category-label menu-category-value"
            aria-activedescendant={
              open ? optionId(menuCategories[focusIndex].id) : undefined
            }
            onClick={() => (open ? setOpen(false) : openList())}
            onKeyDown={onTriggerKeyDown}
          >
            <img
              src={activeCategory.image}
              alt=""
              className="menu-select-thumb"
              {...srcSize(activeCategory.image)}
            />
            <span className="menu-select-value" id="menu-category-value">
              {activeCategory.label}
            </span>
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
          </button>

          {open && (
            <ul
              className="menu-select-list"
              id="menu-category-list"
              role="listbox"
              aria-labelledby="menu-category-label"
            >
              {menuCategories.map((cat, i) => {
                const selected = cat.id === activeId
                return (
                  <li
                    key={cat.id}
                    id={optionId(cat.id)}
                    role="option"
                    aria-selected={selected}
                    className={`menu-select-option${selected ? ' is-selected' : ''}${
                      i === focusIndex ? ' is-focused' : ''
                    }`}
                    onMouseEnter={() => setFocusIndex(i)}
                    onClick={() => selectCategory(cat.id)}
                  >
                    <img
                      src={cat.image}
                      alt=""
                      className="menu-select-option-thumb"
                      {...srcSize(cat.image)}
                    />
                    <span>{cat.label}</span>
                    {selected && (
                      <span className="menu-select-check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="menu-cats-divider" aria-hidden="true" />
      </div>
    </section>
  )
}