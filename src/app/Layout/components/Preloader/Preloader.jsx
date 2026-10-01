import { useCallback, useEffect, useRef, useState } from 'react'
import Emblem from './Emblem.jsx'
import useReadiness from './useReadiness.js'
import {
  alreadyPlayed,
  markPlayed,
  BRAND_MOMENT_MS,
  EXIT_MS,
  HOLD_MS,
  LAST_RESORT_MS,
  READOUT_RAMP_MS,
} from './config.js'
import './Preloader.css'

const WORDMARK = ['P', 'a', 'r', 'i', 's', ' ', 'B', 'e', 'a', 'n', 's']

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function Preloader() {
  const [status, setStatus] = useState('loading')
  const reducedMotion = prefersReducedMotion()
  /* Read once per mount, in a lazy initialiser, so the answer cannot change
     between renders. Reading it on every render would let StrictMode's second
     pass disagree with the first. */
  const [skipped] = useState(alreadyPlayed)

  const { progress: target, ready } = useReadiness({ enabled: !skipped })

  const counterRef = useRef(null)
  const railRef = useRef(null)
  const curtainRef = useRef(null)
  const shownRef = useRef(0)
  const targetRef = useRef(0)
  const sealedRef = useRef(false)
  const beginExitRef = useRef(null)
  const exitStartedRef = useRef(false)

  /* Mirrored into a ref so the readout's rAF loop can read the current value
     without being torn down and restarted on every readiness milestone. */
  useEffect(() => {
    targetRef.current = target
  }, [target])

  /* Readouts are written straight to the DOM. React re-renders only on the
     four state transitions, so a 60fps readout costs nothing in reconciliation.
     Once sealed, paint becomes a no-op and the readout is frozen at 100 for the
     rest of the intro. */
  const paint = useCallback((value) => {
    if (sealedRef.current) return
    const counter = counterRef.current
    const rail = railRef.current
    if (counter) {
      /* 99 is the ceiling while loading. 100 is written only by seal(), once
         readiness is confirmed, so the number can never outrun the page. */
      counter.textContent = String(
        Math.min(99, Math.round(value * 100))
      ).padStart(3, '0')
    }
    if (rail) rail.style.setProperty('--pb-progress', String(Math.min(1, value)))
  }, [])

  const seal = useCallback(() => {
    sealedRef.current = true
    shownRef.current = 1
    const counter = counterRef.current
    const rail = railRef.current
    if (counter) counter.textContent = '100'
    if (rail) rail.style.setProperty('--pb-progress', '1')
  }, [])

  /* One continuous loop for the whole intro, rather than a short rAF chain per
     readiness milestone. Two reasons:

     1. A warm cache resolves readiness in ~10ms. Per-milestone chains meant the
        readout was still at 000 when readiness landed, so it teleported 000 to
        100 in a single frame — a bar that jumps is indistinguishable from a
        fake one, whatever the underlying signals are.
     2. The loop can hold the readout to the brand moment's own clock:

          goal = min(realReadiness, elapsed / READOUT_RAMP_MS)

        The first term means the number can never lead the page. The second
        means it always travels at a pace the eye can follow. Clamping rather
        than adding is what keeps this honest: the readout may lag reality, but
        it can never claim to be further along than the page actually is. */
  useEffect(() => {
    if (skipped) return undefined
    if (reducedMotion) {
      paint(targetRef.current)
      return undefined
    }

    const startedAt = performance.now()
    let raf = requestAnimationFrame(function step() {
      if (sealedRef.current) return
      const elapsed = performance.now() - startedAt
      const ramp = Math.min(1, elapsed / READOUT_RAMP_MS)
      const goal = Math.min(targetRef.current, ramp)
      const gap = goal - shownRef.current
      shownRef.current = gap < 0.0015 ? goal : shownRef.current + gap * 0.16
      paint(shownRef.current)
      /* 100 is written by the loop, not by the readiness callback. Readiness
         typically lands in a few milliseconds on a warm cache, and sealing
         there rewrote the readout 000 -> 100 inside a single frame — the ramp
         never got a chance to show. Sealing once the ramp is also complete
         means the number always arrives at 100 by travelling there. */
      if (goal >= 1) seal()
      else raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, skipped, paint, seal])

  /* The scroll lock and the hero handoff are both driven off this attribute,
     and it is owned by `status` rather than by imperative calls scattered
     through the timers. That matters: once the curtain finishes it renders
     null, but the component itself stays mounted by Layout, so an effect
     cleanup alone would never run and the page would be left unscrollable.

     The `skipped` guard is load-bearing. A skipped intro renders null and never
     advances `status` past 'loading', so without it this effect would set
     data-preloader="active" — locking scroll on <html> and <body> — and no
     timer would ever run to remove it. The page would be permanently
     unscrollable from the second visit onward. */
  useEffect(() => {
    if (skipped) {
      delete document.documentElement.dataset.preloader
      return
    }
    const root = document.documentElement
    if (status === 'complete') {
      delete root.dataset.preloader
      return
    }
    root.dataset.preloader = status === 'exiting' ? 'exiting' : 'active'
  }, [status, skipped])

  /* Spend the one allowed play as soon as the intro genuinely runs, so a
     refresh during the sequence is already treated as a repeat visit. */
  useEffect(() => {
    if (!skipped) markPlayed()
  }, [skipped])

  /* The lifecycle. Mounted once, so arming the curtain and releasing it are
     never interleaved with a readiness re-render. */
  useEffect(() => {
    if (skipped) return undefined

    const startedAt = performance.now()
    const timers = []

    beginExitRef.current = () => {
      if (exitStartedRef.current) return
      exitStartedRef.current = true

      setStatus('ready')

      const wait = reducedMotion
        ? HOLD_MS
        : Math.max(0, BRAND_MOMENT_MS - (performance.now() - startedAt)) + HOLD_MS

      timers.push(
        setTimeout(() => {
          /* The ramp window and the brand moment are the same length, so by now
             the readout has sealed itself at 100. The one case that can reach
             here without it is the last-resort path, where readiness never
             landed at all and nothing would otherwise close the sequence. */
          seal()
          setStatus('exiting')

          /* Read off the ref, not document.querySelector: the scroll-lock
             attribute lives on <html>, so a [data-preloader] query matches the
             documentElement first and would leave this listening on the wrong
             element for the whole exit. */
          const curtain = curtainRef.current
          let done = false

          /* Only the curtain's own clip-path may end the exit. The children's
             opacity transition also fires transitionend and it bubbles, so
             without the target and property checks the reveal would be cut off
             at 0.3s and the curtain would vanish mid-retract. */
          const onEnd = (event) => {
            if (done) return
            if (event.target !== curtain || event.propertyName !== 'clip-path') return
            done = true
            curtain.removeEventListener('transitionend', onEnd)
            setStatus('complete')
          }

          if (curtain) curtain.addEventListener('transitionend', onEnd)
          /* transitionend is the fast path; this is the guarantee. A
             reduced-motion transition can finish without ever firing it. */
          timers.push(
            setTimeout(() => {
              if (done) return
              done = true
              curtain?.removeEventListener('transitionend', onEnd)
              setStatus('complete')
            }, reducedMotion ? 120 : EXIT_MS + 280)
          )
        }, wait)
      )
    }

    /* Belt and braces: if readiness somehow never lands, go anyway. */
    timers.push(
      setTimeout(() => beginExitRef.current?.(), LAST_RESORT_MS)
    )

    return () => {
      timers.forEach(clearTimeout)
      beginExitRef.current = null
    }
  }, [seal, reducedMotion, skipped])

  useEffect(() => {
    if (ready) beginExitRef.current?.()
  }, [ready])

  if (skipped || status === 'complete') return null

  return (
    <div
      ref={curtainRef}
      data-preloader
      className={`preloader is-${status}`}
      role="status"
      aria-live="polite"
      inert={status === 'loading' ? undefined : true}
    >
      <span className="sr-only">Loading Paris Beans</span>

      <div className="preloader-inner">
        <Emblem />

        <span className="preloader-wordmark" aria-hidden="true">
          {WORDMARK.map((ch, i) =>
            ch === ' ' ? (
              <span key={i} className="preloader-letter preloader-letter--space" />
            ) : (
              <span key={i} className="preloader-letter" style={{ '--i': i }}>
                {ch}
              </span>
            )
          )}
        </span>

        <span className="preloader-line" aria-hidden="true" />

        <p className="preloader-tagline" aria-hidden="true">
          a parisian café experience
        </p>
      </div>

      <div className="preloader-meta" aria-hidden="true">
        <span className="preloader-counter" ref={counterRef}>
          000
        </span>
        <span className="preloader-rail" ref={railRef}>
          <span className="preloader-rail-fill" />
        </span>
      </div>
    </div>
  )
}
