import { useRef } from 'react'
import { useReveal } from '@shared/hooks/useReveal'
import { srcSize } from '@shared/assets/srcSize'
import { storyImages } from '@shared/assets/images'
import StoryRing from './StoryRing'
import './OurStoryOrigin.css'

/* The photo's own silhouette, as a clip: photo.svg draws the photograph inside
   an arch — a circle of centre (331.693, 294.684) r 294.81 with the bottom-right
   quadrant squared off — and also draws the old ring text as outlined paths on
   top of it, at a radius of 314 to 333 against that circle's 294.81, so every
   stroke of it lies outside the photograph.

   Below 1024px the ring is replaced by live text (StoryRing.jsx), and this clip
   is what takes the old one out: nothing of the photograph is inside the cut,
   because the cut *is* the photograph's outline. It is expressed in
   objectBoundingBox units so it tracks the photo at every width, and the
   coordinates are the arch above divided by 624 and shifted by -0.002404 on x —
   that divisor and shift are what `object-fit: cover` on a square box does to a
   627x624 source: it scales by the height fit (624) and crops the 3-unit width
   overhang, centred. The photo's box is square at every width, so those
   coordinates are the same at 320px and at 1023px.

   Kept here rather than in photo.svg so the asset itself is untouched. */
const ARCH_CLIP =
  'M0.056701 0.47225C0.056701 0.211325 0.268215 -0.000202 0.529151 -0.000202' +
  'C0.790083 -0.000202 1.001607 0.211325 1.001607 0.47225V0.944704H0.529151' +
  'C0.268215 0.944704 0.056701 0.733176 0.056701 0.47225Z'

export default function OurStoryOrigin() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <section className="ostory-origin" ref={ref}>
      <svg className="pb-story-clips" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="pb-photo-arch" clipPathUnits="objectBoundingBox">
            <path d={ARCH_CLIP} />
          </clipPath>
        </defs>
      </svg>
      {/* Top cluster, phone only. Placed against the section's own box rather
          than the heading's, so its offsets are percentages of the section and
          not of a block whose height moves with the copy. Every tier above the
          phone hides this and shows the copy in the frame below. */}
      <img
        className="pb-story-deco pb-story-deco--top"
        src={storyImages.decoBeans}
        alt=""
        aria-hidden="true"
      />
      <div className="ostory-shell ostory-origin-grid">
        <div className="ostory-origin-copy reveal">
          <p className="eyebrow ostory-eyebrow">— From Paris to HAIR RAP BY YOYO</p>
          <div className="ostory-origin-heading">
            <h2 className="ostory-origin-title">
              From a <em>Parisian<br className="ostory-br-narrow" /> Feeling</em>
              <br className="ostory-br-tablet" /> to a Salon
              <br className="ostory-br-wide" /> <em>Experience.</em>
            </h2>
          </div>

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
          <div className="ostory-emblem-frame">
            <div className="ostory-emblem">
              <div className="ostory-emblem-photo">
                <img
                  src={storyImages.photo}
                  alt="Paris Beans environment"
                  {...srcSize(storyImages.photo)}
                />
              </div>
              {/* Live ring text, phone and tablet only. After the photograph so
                  it paints over it; the stylesheet hides it from 1024px up,
                  where the old outlined ring stays as it is. */}
              <StoryRing />
            </div>
            {/* Bottom-left art, below the photo. */}
            <img
              className="pb-story-deco pb-story-deco--bottom"
              src={storyImages.decoCupCroissant}
              alt=""
              aria-hidden="true"
            />
            {/* Second copy of the top cluster, for the laptop tier only. Below
                1024px the cluster hangs off the section and this one stays
                hidden; from 1024px up it hangs off the photo instead, and the
                section copy is hidden. They cannot be the same element because
                the two anchors are in different columns of the grid, so there is
                no parent they could share. */}
            <img
              className="pb-story-deco pb-story-deco--top-photo"
              src={storyImages.decoBeans}
              alt=""
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}