import { useEffect, useRef } from 'react'
import { gallerySections, galleryImage, galleryAlt, galleryDims } from '../data/siteData'
import './Gallery.css'

const section = gallerySections.find((s) => s.id === 'wall-art')

export default function GalleryWallArt() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible'))
      },
      { threshold: 0.08 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const [a, b, feature, c, d] = section.images.map(galleryImage)
  const dims = section.images.map((key) => galleryDims[key])

  return (
    <section className="gal-section" ref={ref}>
      <div className="container">
        <div className="gal-section-head reveal">
          <span className="eyebrow gal-section-eyebrow">Paris Wall Art</span>
          <h2 className="gal-section-title">
            A Corner of <em>Paris,</em> Inside
            <em>HAIR RAP BY YOYO.</em>
          </h2>
          <p className="gal-section-desc lead">
            Paris-inspired artwork brings the feeling of a Parisian street into the heart of HAIR RAP BY YOYO
          </p>
        </div>

        <div className="gal-grid gal-grid--wall reveal reveal-delay-1">
          <figure className="gal-tile gal-tile--a">
            <img src={a} alt={galleryAlt(section.images[0])} width={dims[0].width} height={dims[0].height} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--b">
            <img src={b} alt={galleryAlt(section.images[1])} width={dims[1].width} height={dims[1].height} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--c">
            <img src={c} alt={galleryAlt(section.images[3])} width={dims[3].width} height={dims[3].height} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--d">
            <img src={d} alt={galleryAlt(section.images[4])} width={dims[4].width} height={dims[4].height} loading="lazy" />
          </figure>
          <figure className="gal-tile gal-tile--feature">
            <img src={feature} alt={galleryAlt(section.images[2])} width={dims[2].width} height={dims[2].height} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}