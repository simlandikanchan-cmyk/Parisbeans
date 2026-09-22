import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Preloader from './Preloader'
import SEO from '../ui/SEO'
import { routeByPath, routeJsonLd } from '../router'

const AiAssistant = lazy(() => import('./AiAssistant'))

export default function Layout() {
  const location = useLocation()
  const path = location.pathname
  const route = routeByPath(path)
  const jsonLd = routeJsonLd(route)
  const [aiReady, setAiReady] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path])

  useEffect(() => {
    const el = document.querySelector('[data-seo="jsonld"]')
    if (el) el.remove()
  }, [jsonLd])

  // Defer the AI widget until the browser is idle so its JS never
  // competes with first render.
  useEffect(() => {
    let t = 0
    const schedule = () =>
      window.requestIdleCallback
        ? window.requestIdleCallback(() => setAiReady(true), { timeout: 2000 })
        : setTimeout(() => setAiReady(true), 2000)
    t = schedule()
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(t)
      else clearTimeout(t)
    }
  }, [])

  return (
    <>
      <SEO route={route} jsonLd={jsonLd} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Preloader />
      <Header story={route === 'story'} route={route} />
      <Outlet />
      <Footer route={route} />
      {aiReady && (
        <Suspense fallback={null}>
          <AiAssistant />
        </Suspense>
      )}
    </>
  )
}
