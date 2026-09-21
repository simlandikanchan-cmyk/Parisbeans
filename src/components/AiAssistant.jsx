import { useEffect, useRef, useState } from 'react'
import { cafeCardPrices, contact } from '../data/siteData'
import './AiAssistant.css'

const SUGGESTIONS = [
  {
    label: 'Opening hours',
    answer:
      `We\u2019re open **${contact.hours.days}** \u2014 **${contact.hours.allWeek}**.\n\nCome on in any day of the week!`,
  },
  {
    label: 'Menu highlights',
    answer:
      'Here\u2019s a taste of the menu \u2014\n\n' +
      Object.entries(cafeCardPrices)
        .map(([name, price]) => `- **${name}** \u2014 ${price}`)
        .join('\n') +
      '\n\nYou can explore the full list under Menu on our site.',
  },
  {
    label: 'Find us',
    answer:
      `**${contact.location}**\n\n${contact.address}\n\n**Phone:** ${contact.phone}\n**Email:** ${contact.email}`,
  },
]

const GREETING = {
  role: 'assistant',
  content:
    'Bonjour! I\u2019m the Paris Beans concierge \u2014 an AI that knows the café, the salon and the menu. Ask me about opening hours, what to try, or how to find us.',
}

function AiAvatar() {
  return (
    <span className="ai-msg-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z"
          fill="currentColor"
        />
        <path d="M18.5 14l.85 2.15L21.5 17l-2.15.85L18.5 20l-.85-2.15L15.5 17l2.15-.85L18.5 14z" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  )
}

function AiContent({ text }) {
  const inline = (value) =>
    value.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    )

  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim())
    if (lines.length > 1 && lines.every((l) => /^[-•*]\s/.test(l.trim()))) {
      return (
        <ul key={i}>
          {lines.map((l, j) => (
            <li key={j}>{inline(l.trim().replace(/^[-•*]\s/, ''))}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={i}>
        {lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </span>
        ))}
      </p>
    )
  })
}

export default function AiAssistant() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([GREETING])
  const [busy, setBusy] = useState(false)

  const listRef = useRef(null)
  const inputRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    const entrance = setTimeout(() => {
      setMounted(true)
    }, 2400)
    return () => clearTimeout(entrance)
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  useEffect(() => {
    if (!open) return
    const focus = setTimeout(() => inputRef.current?.focus(), 350)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        openerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focus)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const send = async (raw) => {
    const text = (raw ?? input).trim()
    if (!text || busy) return
    setInput('')
    const history = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setBusy(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Service unavailable')
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            'Sorry, I couldn\u2019t reach my assistant brain right now. Check that the AI endpoint is configured in .env, then try again.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const askLocal = (chip) => {
    if (busy) return
    setMessages((m) => [
      ...m,
      { role: 'user', content: chip.label },
      { role: 'assistant', content: chip.answer },
    ])
  }

  const reset = () => {
    setMessages([GREETING])
    inputRef.current?.focus()
  }

  return (
    <div
      className={`ai-widget${mounted ? ' is-visible' : ''}${open ? ' is-open' : ''}`}
    >
      <section
        className="ai-panel"
        role="dialog"
        aria-label="Paris Beans AI concierge chat"
        aria-hidden={!open}
      >
        <header className="ai-head">
          <span className="ai-head-avatar" aria-hidden="true">
            <img src="/images/logo.svg" alt="" width={113} height={112} className="ai-head-logo" />
          </span>
          <div className="ai-head-meta">
            <p className="ai-head-title">Paris Beans Concierge</p>
            <p className="ai-head-status">
              <span className="ai-head-dot" aria-hidden="true" />
              Online
            </p>
          </div>
          <div className="ai-head-actions">
            <button
              type="button"
              className="ai-head-btn ai-head-btn--reset"
              aria-label="Reset conversation"
              title="Reset conversation"
              onClick={reset}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4.5 7.5A8 8 0 1 1 4 16m.5-8.5H2m2.5-3.5V8"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="ai-head-btn"
              aria-label="Close chat"
              title="Close chat"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="ai-list" ref={listRef} role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div className={`ai-msg ai-msg--${m.role}`} key={i}>
              {m.role === 'assistant' && <AiAvatar />}
              <div className="ai-msg-body">
                <AiContent text={m.content} />
              </div>
            </div>
          ))}
          {busy && (
            <div className="ai-msg ai-msg--assistant">
              <AiAvatar />
              <span className="ai-dots" aria-label="Assistant is typing">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>

        {messages.length <= 1 && !busy && (
          <div className="ai-suggest">
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s.label} onClick={() => askLocal(s)}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        <form
          className="ai-form"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <textarea
            ref={inputRef}
            className="ai-input"
            rows={1}
            placeholder="Ask about the menu, hours, location\u2026"
            aria-label="Message the AI concierge"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="submit"
            className="ai-send"
            aria-label="Send message"
            disabled={busy || !input.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </section>

      <button
        ref={openerRef}
        type="button"
        className="ai-float"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close AI assistant' : 'Open the Paris Beans AI assistant'}
        title="Paris Beans AI assistant"
      >
        <span className="ai-float-pulse" aria-hidden="true" />
        {open ? (
          <svg className="ai-float-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="ai-float-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 15.8l-1.8-4.6L6 9.4l4.2-1.8L12 3z"
              stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"
            />
            <path
              d="M18.5 14.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  )
}