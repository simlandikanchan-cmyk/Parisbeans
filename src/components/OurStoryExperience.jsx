import { useEffect, useRef } from 'react'
import './OurStoryExperience.css'

export default function OurStoryExperience() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.12 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <section className="ostory-experience" ref={ref}>
      <div className="ostory-exp-bg" aria-hidden="true" />

      <div className="ostory-exp-stage">
        <div className="ostory-cup-wrap">
          <img
            className="ostory-splash"
            src="/Frame 48096320.svg"
            alt=""
            aria-hidden="true"
          />
          <div className="ostory-cup">
            <svg
              viewBox="0 0 220 300"
              className="ostory-cup-svg"
              role="img"
              aria-label="Paris Beans takeaway coffee cup"
            >
              <title>Paris Beans takeaway coffee cup</title>
              <path
                d="M92 46 C88 62 102 66 97 82"
                fill="none"
                stroke="#C18A5B"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.45"
              />
              <path
                d="M124 42 C120 58 134 62 129 78"
                fill="none"
                stroke="#C18A5B"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.45"
              />
              <ellipse cx="110" cy="112" rx="66" ry="16" fill="#432719" />
              <ellipse cx="110" cy="108.5" rx="52" ry="11.5" fill="#351D13" />
              <ellipse cx="110" cy="104.5" rx="42" ry="8.5" fill="#432719" />
              <circle cx="110" cy="104.5" r="6" fill="#2C170E" />
              <path
                d="M48 112 L172 112 L161 270 Q159 288 140 288 L80 288 Q61 288 59 270 Z"
                fill="#FBF7F1"
                stroke="#432719"
                strokeWidth="2.5"
              />
              <path
                d="M70 140 L68 244"
                stroke="#FFFFFF"
                strokeWidth="7"
                opacity="0.5"
                strokeLinecap="round"
              />
              <path
                d="M50 196 L170 196 L166 272 Q164 288 146 288 L74 288 Q56 288 54 272 Z"
                fill="#432719"
              />
              <path d="M50 196 L170 196" stroke="#351D13" strokeWidth="2.5" />
              <text
                x="110"
                y="238"
                textAnchor="middle"
                letterSpacing="3"
                fontSize="14"
                fill="#F7F3EB"
                style={{ fontFamily: "'Fraunces', serif" }}
                opacity="0.94"
              >
                PARIS BEANS
              </text>
              <text
                x="110"
                y="258"
                textAnchor="middle"
                letterSpacing="1.5"
                fontSize="5"
                fill="#C18A5B"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                HAIR RAP BY YOYO
              </text>
            </svg>
          </div>
        </div>

        <article className="ostory-callout ostory-callout--tl reveal">
          <span className="ostory-callout-title">Pause</span>
          <p className="ostory-callout-text">
            Take a moment away from the rush.
          </p>
          <span className="ostory-callout-line" aria-hidden="true" />
        </article>

        <article className="ostory-callout ostory-callout--tr reveal reveal-delay-1">
          <span className="ostory-callout-title">Sip</span>
          <p className="ostory-callout-text">
            Enjoy thoughtfully crafted coffee and café favourites.
          </p>
          <span className="ostory-callout-line" aria-hidden="true" />
        </article>

        <article className="ostory-callout ostory-callout--bl reveal reveal-delay-2">
          <span className="ostory-callout-title">Connect</span>
          <p className="ostory-callout-text">
            Share a conversation, a coffee, or simply a moment.
          </p>
          <span className="ostory-callout-line" aria-hidden="true" />
        </article>

        <article className="ostory-callout ostory-callout--br reveal reveal-delay-3">
          <span className="ostory-callout-title">Experience</span>
          <p className="ostory-callout-text">
            Let the Parisian atmosphere become part of your visit.
          </p>
          <span className="ostory-callout-line" aria-hidden="true" />
        </article>
      </div>
    </section>
  )
}