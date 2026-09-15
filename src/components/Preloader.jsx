import { useEffect, useState } from 'react'
import './Preloader.css'

export default function Preloader() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const hide = setTimeout(() => {
      setHidden(true)
      document.body.style.overflow = ''
    }, 2000)
    const remove = setTimeout(() => {
      const el = document.querySelector('[data-preloader]')
      if (el) el.remove()
    }, 2800)
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
        <img className="preloader-logo" src="/logo (2).svg" alt="" draggable={false} />
        <span className="preloader-name">Paris Beans</span>
      </div>
    </div>
  )
}