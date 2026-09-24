import { useRef } from 'react'
import { useReveal } from '../../../../shared/hooks/useReveal'
import { srcSize } from '../../../../shared/assets/srcSize'
import { storyImages } from '../../../../shared/assets/images'
import './OurStoryOrigin.css'

export default function OurStoryOrigin() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <section className="ostory-origin" ref={ref}>
      <div className="ostory-shell ostory-origin-grid">
        <div className="ostory-origin-copy reveal">
          <p className="eyebrow ostory-eyebrow">From Paris to HAIR RAP BY YOYO</p>
          <h2 className="ostory-origin-title">
            From a <em>Parisian <br />Feeling</em> to a Salon 
            <br />
            <em>Experience.</em>
          </h2>
          <p className="ostory-origin-text">
            ParisBeans was created inside HAIR RAP BY YOYO as a café corner
            where guests can enjoy coffee surrounded by Paris-inspired wall
            art and atmosphere.
          </p>
          <p className="ostory-origin-text">
            It became more than a waiting space. It became part of the
            experience — a place to pause before an appointment, enjoy a
            coffee during your visit, or simply take in the surroundings.
          </p>
          <p className="ostory-origin-text">
            Inspired by the cafés of Paris, it is a small pause with character —
            somewhere to settle in before your appointment, stay for another cup,
            and take a little of the atmosphere home with you.
          </p>
        </div>

        <div className="ostory-emblem-wrap reveal reveal-delay-1">
          <div className="ostory-emblem">
            <div className="ostory-emblem-photo">
              <img
                src={storyImages.photo}
                alt="Paris Beans environment"
                {...srcSize(storyImages.photo)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}