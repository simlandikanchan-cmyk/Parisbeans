import { useEffect, useState } from 'react'
import './FloatingWhatsApp.css'

const WHATSAPP_NUMBER = '919876543210'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi Paris Beans! I would like to know more.'
)}`

export default function FloatingWhatsApp() {
  const [mounted, setMounted] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [tipDismissed, setTipDismissed] = useState(false)

  useEffect(() => {
    const entrance = setTimeout(() => {
      setMounted(true)
      const tip = setTimeout(() => setShowTip(true), 650)
      const autoHide = setTimeout(() => setShowTip(false), 9000)
      return () => {
        clearTimeout(tip)
        clearTimeout(autoHide)
      }
    }, 2400)
    return () => clearTimeout(entrance)
  }, [])

  const hasTip = showTip && !tipDismissed

  return (
    <div className={`wa-widget${mounted ? ' is-visible' : ''}${hasTip ? ' has-tip' : ''}`}>
      <div className="wa-tip" role="status" aria-live="polite">
        <button
          type="button"
          className="wa-tip-close"
          aria-label="Dismiss message"
          onClick={() => setTipDismissed(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className="wa-tip-title">Paris Beans</p>
        <p className="wa-tip-text">Hello! Want to chat about your visit?</p>
        <span className="wa-tip-arrow" aria-hidden="true" />
      </div>

      <a
        className="wa-float"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <span className="wa-float-pulse" aria-hidden="true" />
        <svg className="wa-float-icon" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16 2.5A13.5 13.5 0 0 0 4.1 21.9L2.5 29.5l7.8-2A13.5 13.5 0 1 0 16 2.5zm0 24.4c-2 0-3.9-.55-5.5-1.5l-.4-.24-4.63 1.19 1.24-4.52-.26-.43A11.3 11.3 0 1 1 16 26.9zm6.24-8.56c-.34-.17-2-.99-2.31-1.1-.31-.12-.54-.17-.76.17-.23.35-.88 1.1-1.08 1.33-.2.23-.4.26-.74.09-.34-.17-1.43-.53-2.72-1.68a10.2 10.2 0 0 1-1.88-2.34c-.2-.35-.02-.54.15-.71.15-.16.34-.4.51-.6.17-.2.23-.35.34-.58.11-.23.06-.43-.03-.6-.09-.17-.76-1.83-1.04-2.51-.28-.67-.56-.58-.76-.59l-.65-.01c-.23 0-.6.09-.91.43-.31.35-1.2 1.17-1.2 2.85 0 1.68 1.23 3.3 1.4 3.53.17.23 2.41 3.69 5.85 5.17.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.03-.83 2.31-1.63.29-.8.29-1.49.2-1.63-.08-.14-.3-.23-.64-.4z" />
        </svg>
      </a>
    </div>
  )
}