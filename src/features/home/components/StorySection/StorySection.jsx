import { useRef, useState, useEffect } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { srcSize } from '../../../../shared/assets/srcSize'
import Button from '../../../../shared/components/Button'
import { storyImages } from '../../../../shared/assets/images'
import './StorySection.css'

const storySlides = [
  storyImages.rectangle71,
  storyImages.rectangle69,
  storyImages.rectangle72,
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
    const t = setInterval(() => setActive((p) => (p + 1) % storySlides.length), 6000)
    return () => clearInterval(t)
  }, [paused, active])

  return (
    <section id="story" className="section story" ref={ref}>
      <div className="story-grid">
        {/* Left — text */}
        <div className="story-copy">
          <div className="pb-story-eyebrow eyebrow reveal">— OUR STORY</div>
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
          <div className="story-cta reveal reveal-delay-3">
            <Button href="/story" variant="primary" arrow>
              Read Our Story
            </Button>
          </div>
        </div>

        {/* Right — layered editorial image with cycling main photo */}
        <div
          className="story-media reveal reveal-delay-1"
          aria-label="Paris Beans story gallery"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="story-image-stack">
            {/* Back — three cards that cycle through the story images */}
            <div className="story-image-back story-image-back--far" aria-hidden="true">
              {storySlides.map((src, i) => (
                <div
                  key={src}
                  className={`story-image-card${i === active ? ' is-active' : ''}`}
                >
                  <img src={src} alt="" {...srcSize(src)} />
                </div>
              ))}
            </div>
            <div className="story-image-back story-image-back--alt" aria-hidden="true">
              {storySlides.map((src, i) => (
                <div
                  key={src}
                  className={`story-image-card${i === active ? ' is-active' : ''}`}
                >
                  <img src={src} alt="" {...srcSize(src)} />
                </div>
              ))}
            </div>
            <div className="story-image-back" aria-hidden="true">
              {storySlides.map((src, i) => (
                <div
                  key={src}
                  className={`story-image-card${i === active ? ' is-active' : ''}`}
                >
                  <img src={src} alt="" {...srcSize(src)} />
                </div>
              ))}
            </div>

            {/* Front — main image, cycles through the story images */}
            <div className="story-image-main">
              {storySlides.map((src, i) => (
                <div
                  key={src}
                  className={`story-image-card${i === active ? ' is-active' : ''}`}
                >
                  <img src={src} alt="Paris Beans salon" {...srcSize(src)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}