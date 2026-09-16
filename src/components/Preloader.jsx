import { useEffect, useState } from 'react'
import './Preloader.css'

const WORDMARK = ['P', 'a', 'r', 'i', 's', ' ', 'B', 'e', 'a', 'n', 's']

export default function Preloader() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const hide = setTimeout(() => {
      setHidden(true)
      document.body.style.overflow = ''
    }, 2300)
    const remove = setTimeout(() => {
      const el = document.querySelector('[data-preloader]')
      if (el) el.remove()
    }, 3450)
    return () => {
      clearTimeout(hide)
      clearTimeout(remove)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      data-preloader
      className={`preloader${hidden ? ' is-hidden' : ''}`}
      aria-hidden={hidden}
    >
      <div className="preloader-inner">
        <div className="preloader-emblem">
          <img className="preloader-logo" src="/logo (2).svg" alt="" draggable={false} />
        </div>

        <h1 className="preloader-wordmark" aria-label="Paris Beans">
          <span aria-hidden="true">
            {WORDMARK.map((ch, i) =>
              ch === ' ' ? (
                <span key={i} className="preloader-letter preloader-letter--space" />
              ) : (
                <span
                  key={i}
                  className="preloader-letter"
                  style={{ animationDelay: `${0.55 + i * 0.055}s` }}
                >
                  {ch}
                </span>
              )
            )}
          </span>
        </h1>

        <span className="preloader-line" aria-hidden="true" />

        <p className="preloader-tagline">a parisian café experience</p>
      </div>
    </div>
  )
}