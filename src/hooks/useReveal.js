import { useEffect, useRef } from 'react'

export function useReveal(ref, options = {}) {
  const { selector = '.reveal', threshold = 0.12, rootMargin, onReveal } = options
  const callbackRef = useRef(onReveal)

  useEffect(() => {
    callbackRef.current = onReveal
  }, [onReveal])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ioOptions = { threshold }
    if (rootMargin) ioOptions.rootMargin = rootMargin

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            callbackRef.current?.(entry.target)
          }
        })
      },
      ioOptions
    )

    el.querySelectorAll(selector).forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [selector, threshold, rootMargin, ref])
}
