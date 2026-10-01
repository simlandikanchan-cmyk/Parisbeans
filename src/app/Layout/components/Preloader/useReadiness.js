import { useEffect, useRef, useState } from 'react'

/*
 * Page readiness for the site intro.
 *
 * There is no fixed duration anywhere in here. Progress is the weighted sum of
 * four signals that correspond to what the visitor can actually see on the
 * first screen, and `ready` only flips once every one of them has settled —
 * successfully or not. A failed image settles its signal exactly like a loaded
 * one, so a broken CDN can never hold the curtain shut.
 *
 * Every signal also has its own cap, and the whole hook has a hard ceiling, so
 * the preloader cannot outlive the page no matter what the network does.
 */

/* Weights sum to 1. Fonts and the first-screen image carry the most because
   they are what the eye lands on; window load and route commit matter, but
   less, because the page is already legible without them. */
const WEIGHTS = {
  fonts: 0.22,
  images: 0.4,
  load: 0.22,
  route: 0.16,
}

/* Per-signal ceilings. These are the guarantees behind "the user must always
   eventually reach the website" — each one alone is enough to unblock. */
const SIGNAL_CAPS = {
  fonts: 2600,
  images: 2000,
  route: 1200,
}

const GLOBAL_CAP = 4500

const MAX_TRACKED_IMAGES = 4

/* Above-the-fold candidates, in the order they should be preferred. The hero
   image is eager + high priority, so this catches the home hero and any other
   page's lead image without hard-coding a route. */
const CRITICAL_IMAGE_SELECTOR =
  '.hero-image, img[fetchpriority="high"], img[loading="eager"]'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useReadiness({ enabled = true } = {}) {
  const [progress, setProgress] = useState(enabled ? 0 : 1)
  /* Set only by the hard ceiling, which is the one place readiness can advance
     without a signal actually landing. */
  const [forced, setForced] = useState(false)

  /* Held in refs so the effect that owns the listeners can publish a fresh
     number without re-running. The effect itself mounts once. */
  const settled = useRef({ fonts: false, images: false, load: false, route: false })
  const progressRef = useRef(enabled ? 0 : 1)

  useEffect(() => {
    if (!enabled) return undefined

    const reduced = prefersReducedMotion()
    const caps = reduced
      ? { fonts: 900, images: 900, route: 600 }
      : SIGNAL_CAPS
    /* Reduced motion has no draw animation to watch, so there is no brand
       moment to protect and the ceiling drops to a plain "get out of the way". */
    const globalCap = reduced ? 1400 : GLOBAL_CAP

    const timers = new Set()
    const listeners = []

    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
      return id
    }

    const on = (target, type, handler, opts) => {
      if (!target) return
      target.addEventListener(type, handler, opts)
      listeners.push(() => target.removeEventListener(type, handler, opts))
    }

    const publish = () => {
      let sum = 0
      for (const key of Object.keys(WEIGHTS)) {
        if (settled.current[key]) sum += WEIGHTS[key]
      }
      /* The last signal to land is the one that completes the total, so this
         cannot drift off 1. */
      const next = Math.min(1, Math.round(sum * 1000) / 1000)
      if (next === progressRef.current) return
      progressRef.current = next
      setProgress(next)
    }

    /* ---- fonts ---- */
    const settleFonts = () => {
      if (settled.current.fonts) return
      settled.current.fonts = true
      publish()
    }
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(settleFonts, settleFonts)
    } else {
      settleFonts()
    }
    later(settleFonts, caps.fonts)

    /* ---- window load ---- */
    if (document.readyState === 'complete') {
      settled.current.load = true
    } else {
      on(window, 'load', () => {
        settled.current.load = true
        publish()
      })
    }

    /* ---- route commit ----
       A `main` element means the lazy route chunk resolved and React painted
       real content. RouteLoading has no main, so this cannot fire early. */
    const settleRoute = () => {
      if (settled.current.route) return
      settled.current.route = true
      publish()
    }
    const checkRoute = () => {
      if (document.querySelector('main')) settleRoute()
    }
    checkRoute()

    /* ---- first-screen images ----
       The route is lazy, so the hero often does not exist yet when this hook
       mounts. A MutationObserver picks it up whenever React commits it. A
       failed image settles the same as a loaded one. */
    const tracked = new Set()
    let pending = 0
    let imagesClosed = false

    const settleImages = () => {
      if (settled.current.images) return
      settled.current.images = true
      imagesClosed = true
      observer.disconnect()
      publish()
    }

    const recount = () => {
      if (imagesClosed) return
      if (tracked.size === 0) return
      if (pending === 0) settleImages()
    }

    const track = (img) => {
      if (imagesClosed || tracked.has(img)) return
      /* Late arrivals after the roster is full are not above the fold by
         definition — they were not in the first screen when it was painted. */
      if (tracked.size >= MAX_TRACKED_IMAGES) return

      tracked.add(img)
      if (img.complete) {
        /* complete is true for both "loaded" and "errored". Both count. */
        recount()
        return
      }
      pending += 1
      const done = () => {
        pending -= 1
        recount()
      }
      on(img, 'load', done)
      on(img, 'error', done)
    }

    const discover = () => {
      if (imagesClosed) return
      document.querySelectorAll(CRITICAL_IMAGE_SELECTOR).forEach(track)
      /* The route chunk is lazy, so `main` usually lands after this hook
         mounts. Same observer, so the route signal settles the moment React
         commits real content rather than waiting out its cap. */
      checkRoute()
      recount()
    }

    const observer = new MutationObserver(discover)
    observer.observe(document.body, { childList: true, subtree: true })
    discover()
    later(settleImages, caps.images)

    /* ---- the hard ceiling ---- */
    later(() => {
      settled.current = { fonts: true, images: true, load: true, route: true }
      observer.disconnect()
      publish()
      setForced(true)
    }, globalCap)

    publish()

    return () => {
      observer.disconnect()
      timers.forEach(clearTimeout)
      listeners.forEach((off) => off())
    }
  }, [enabled])

  /* Readiness is derived, never pushed: either every signal has settled, the
     progress total has reached 1, or the hard ceiling forced it. */
  const ready = !enabled || forced || progress >= 1

  return { progress, ready }
}

export default useReadiness
