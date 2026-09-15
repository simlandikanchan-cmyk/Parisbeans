import { useEffect, useRef } from 'react'
import Button from './Button'
import './StorySection.css'

export default function StorySection() {
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

  const storyImages = [
    '/images/story/Rectangle 71.svg',
    '/images/story/Rectangle 69.svg',
    '/images/story/Rectangle 72.svg',
  ]

  return (
    <section id="story" className="section story" ref={ref}>
      <div className="story-grid">
        {/* Left — text */}
        <div className="story-copy">
          <div className="pb-story-eyebrow eyebrow">OUR STORY</div>
          <h2 className="section-heading--large story-title">
            Inspired by Paris
            <br />
            <em>Streets.</em> Crafted for
            <br />
            Your <em>Salon Day.</em>
          </h2>
          <p className="lead story-paragraph">
            Born from a love for the café culture of Paris, Paris
            Beans brings the rhythm of a street-side coffee
            break into the heart of HAIR RAP BY YOYO.
          </p>
          <div className="reveal">
            <Button href="/story" variant="outline" arrow>
              Read Our Story
            </Button>
          </div>
        </div>

        {/* Right — animated image stack */}
        <div className="story-media" aria-label="Paris Beans story gallery">
          <div className="story-image-stack">
            {storyImages.map((src, i) => (
              <div
                key={src}
                className={`story-image-card story-image-card--${i + 1}`}
              >
                <img src={src} alt="Paris Beans salon" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}