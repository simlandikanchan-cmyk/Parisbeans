import { useEffect, useState } from 'react'
import './Preloader.css'

const WORDMARK = ['P', 'a', 'r', 'i', 's', ' ', 'B', 'e', 'a', 'n', 's']

const PRELOADER_KEY = 'parisbeans:preloader-played'

let playedThisSession = false
try {
  playedThisSession = sessionStorage.getItem(PRELOADER_KEY) === '1'
  if (!playedThisSession) sessionStorage.setItem(PRELOADER_KEY, '1')
} catch {
  playedThisSession = false
}

export default function Preloader() {
  const [visible] = useState(!playedThisSession)
  const [hidden, setHidden] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (!visible) return
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
  }, [visible])

  if (!visible) return null

  return (
    <div
      data-preloader
      className={`preloader${hidden ? ' is-hidden' : ''}`}
      aria-hidden={hidden}
    >
      <div className="preloader-inner">
        <div className="preloader-emblem">
          {logoError ? (
            <img
              className="preloader-logo"
              src="/images/story/parisbeans.gif"
              alt=""
              width={720}
              height={720}
              aria-hidden="true"
            />
          ) : (
            <video
              className="preloader-logo"
              src="/images/story/logo.webm"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden="true"
              onError={() => setLogoError(true)}
            />
          )}
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