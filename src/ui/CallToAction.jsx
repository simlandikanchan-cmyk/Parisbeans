import { useRef } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './Button'

export default function CallToAction({
  baseClass,
  sectionClass = '',
  titleClass = '',
  eyebrow,
  title,
  description,
  href,
  label,
  eyebrowAs: EyebrowTag = 'p',
  buttonSize,
  staggered = false,
  threshold = 0.12,
}) {
  const ref = useRef(null)
  useReveal(ref, { threshold })

  const sectionClassList = sectionClass ? ` ${sectionClass}` : ''
  const titleClassList = titleClass ? ` ${titleClass}` : ''
  const staggedClasses = staggered ? ' reveal reveal-delay-1' : ''
  const eyebrowClasses = staggered ? 'eyebrow reveal' : 'eyebrow'
  const descClasses = staggered ? ' reveal reveal-delay-2' : ''
  const contentClasses = staggered
    ? `${baseClass}-content container`
    : `container ${baseClass}-content reveal`

  return (
    <section className={`${baseClass}${sectionClassList}`} ref={ref}>
      <div className={`${baseClass}-stripes`} aria-hidden="true" />
      <div className={contentClasses}>
        <EyebrowTag className={eyebrowClasses}>{eyebrow}</EyebrowTag>
        <h2 className={`${baseClass}-title${staggedClasses}${titleClassList}`}>
          {title}
        </h2>
        <p className={`${baseClass}-desc${descClasses}`}>{description}</p>
        {staggered ? (
          <div className="reveal reveal-delay-3">
            <Button href={href} variant="primary" arrow>
              {label}
            </Button>
          </div>
        ) : (
          <Button href={href} variant="primary" size={buttonSize} arrow>
            {label}
          </Button>
        )}
      </div>
    </section>
  )
}