import { useRef } from 'react'
import { useReveal } from '../../shared/hooks/useReveal'
import Button from '../../shared/components/Button'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <>
      <span className="nf-word" aria-hidden="true">
        PARIS
      </span>

      <div className="nf-inner" ref={ref}>
        <p className="eyebrow nf-eyebrow reveal">— Page Not Found</p>
        <span className="nf-code reveal reveal-delay-1" aria-hidden="true">
          404
        </span>
        <h1 className="nf-title reveal reveal-delay-2">
          This Corner of <em>Paris</em> Doesn&apos;t Exist.
        </h1>
        <p className="lead nf-desc reveal reveal-delay-2">
          The page you&apos;re looking for has moved on, or never found its way
          into our little café. Let&apos;s get you back to something delicious.
        </p>
        <div className="nf-actions reveal reveal-delay-3">
          <Button href="/" variant="primary" arrow>
            Back Home
          </Button>
          <Button href="/menu" variant="outline">
            Explore the Menu
          </Button>
        </div>
      </div>
    </>
  )
}