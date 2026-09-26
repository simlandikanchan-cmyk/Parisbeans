import { useState, useEffect, useRef } from 'react'

export function useCarousel({ itemCount, interval = 3000, autoPlay = true, initialIndex = 0 } = {}) {
  const [active, setActive] = useState(initialIndex)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (!autoPlay || paused || reduceMotion.current || !itemCount) return
    const t = setInterval(() => setActive((p) => (p + 1) % itemCount), interval)
    return () => clearInterval(t)
  }, [paused, itemCount, interval, autoPlay])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility, { passive: true })
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const go = (dir) => {
    if (!itemCount) return
    setActive((p) => (p + dir + itemCount) % itemCount)
  }

  const pause = () => setPaused(true)
  const resume = () => setPaused(false)

  return { active, paused, reduceMotion, go, pause, resume, setActive }
}
