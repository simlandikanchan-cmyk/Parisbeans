import { useEffect, useRef } from 'react'
import './OurStoryOrigin.css'

export default function OurStoryOrigin() {
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
    <section className="ostory-origin" ref={ref}>
      <div className="ostory-shell ostory-origin-grid">
        <div className="ostory-origin-copy reveal">
          <p className="eyebrow ostory-eyebrow">FROM PARIS TO HAIR RAP BY YOYO</p>
          <h2 className="ostory-origin-title">
            From a Parisian
            <br />
            Feeling to a Salon
            <br />
            <em>Experience.</em>
          </h2>
          <p className="ostory-origin-text">
            ParisBeans was created inside Hair Rap by Yoyo as a café corner
            where guests can enjoy coffee surrounded by Paris-inspired wall
            art and atmosphere.
          </p>
          <p className="ostory-origin-text">
            It became more than a waiting space. It became part of the
            experience — a place to pause before an appointment, enjoy a
            coffee during your visit, or simply take in the surroundings.
          </p>
        </div>

        <div className="ostory-emblem-wrap reveal reveal-delay-1">
          <div className="ostory-emblem">
            <div className="ostory-emblem-photo">
              <img src="/images/story/photo.svg" alt="Paris Beans environment" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}