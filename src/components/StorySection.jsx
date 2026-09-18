import { useRef, useState, useEffect } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'
import './StorySection.css'

const storyImages = [
  '/images/story/Rectangle 71.svg',
  '/images/story/Rectangle 69.svg',
  '/images/story/Rectangle 72.svg',
]

export default function StorySection() {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useReveal(ref)

  // Slideshow loop: the story images appear one by one, over and over
  useEffect(() => {
    if (paused || typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const t = setInterval(() => setActive((p) => (p + 1) % storyImages.length), 3000)
    return () => clearInterval(t)
  }, [paused, active])

  return (
    <section id="story" className="section story" ref={ref}>
      <div className="story-grid">
        {/* Left — text */}
        <div className="story-copy">
          <div className="pb-story-eyebrow eyebrow reveal">OUR STORY</div>
          <h2 className="story-title reveal reveal-delay-1">
            Inspired by Paris
            <br />
            <em>Streets.</em> Crafted for
            <br />
            Your <em>Salon Day.</em>
          </h2>
          <p className="lead story-paragraph reveal reveal-delay-2">
            Born from a love for the café culture of Paris, Paris
            Beans brings the rhythm of a street-side coffee
            break into the heart of HAIR RAP BY YOYO.
          </p>
          <div className="reveal reveal-delay-3">
            <Button href="/story" variant="outline" arrow>
              Read Our Story
            </Button>
          </div>
        </div>

        {/* Right — animated image slideshow */}
        <div
          className="story-media reveal reveal-delay-1"
          aria-label="Paris Beans story gallery"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="story-image-stack">
            {storyImages.map((src, i) => (
              <div
                key={src}
                className={`story-image-card story-image-card--${i + 1}${
                  i === active ? ' is-active' : ''
                }`}
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