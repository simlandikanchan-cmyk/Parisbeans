import { useEffect, useRef } from 'react'

export function useScroll(callback) {
  const callbackRef = useRef(callback)
  const rafRef = useRef(0)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handler = (...args) => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        callbackRef.current(...args)
      })
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => {
      window.removeEventListener('scroll', handler)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])
}
