import { useEffect, useRef } from 'react'

// A phone has no hover, so a pointermove handler there would burn battery on an
// effect nobody can see. The tilt is a fine-pointer enhancement only.
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const STILL_FRAME = '(prefers-reduced-motion: reduce)'

// Publishes normalised pointer position (-1..1 on both axes) onto the element as
// CSS custom properties, so the visual can be layered in depth from CSS alone:
//   --tilt-x / --tilt-y  rotation, in degrees
//   --shift-x / --shift-y translation, in px
// Work is coalesced into one rAF, and the bounding rect is cached and only
// re-measured when it can have gone stale (scroll/resize) — reading
// getBoundingClientRect() on every move would force layout on each event.
export function useParallaxTilt(ref, { tilt = 6, shiftX = 12, shiftY = 9 } = {}) {
  const frameRef = useRef(0)
  const stateRef = useRef({ x: 0, y: 0, rect: null, dirty: true })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia(FINE_POINTER).matches) return
    if (window.matchMedia(STILL_FRAME).matches) return

    const state = stateRef.current

    const paint = () => {
      frameRef.current = 0
      const { x, y } = state
      el.style.setProperty('--tilt-x', (x * tilt).toFixed(3))
      el.style.setProperty('--tilt-y', (y * tilt * -0.75).toFixed(3))
      el.style.setProperty('--shift-x', `${(x * shiftX).toFixed(2)}px`)
      el.style.setProperty('--shift-y', `${(y * shiftY).toFixed(2)}px`)
    }

    const schedule = () => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(paint)
    }

    const onMove = (e) => {
      if (state.dirty || !state.rect) {
        state.rect = el.getBoundingClientRect()
        state.dirty = false
      }
      const r = state.rect
      if (!r.width || !r.height) return
      state.x = ((e.clientX - r.left) / r.width) * 2 - 1
      state.y = ((e.clientY - r.top) / r.height) * 2 - 1
      schedule()
    }

    const onLeave = () => {
      state.x = 0
      state.y = 0
      schedule()
    }

    const onInvalidate = () => {
      state.dirty = true
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onInvalidate, { passive: true })
    window.addEventListener('resize', onInvalidate)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onInvalidate)
      window.removeEventListener('resize', onInvalidate)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [ref, tilt, shiftX, shiftY])
}
