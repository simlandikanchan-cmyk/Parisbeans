import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Preloader from './Preloader'
import FloatingWhatsApp from './FloatingWhatsApp'
import SEO from './SEO'
import { routeByPath, routeJsonLd } from '../router'

export default function Layout() {
  const location = useLocation()
  const path = location.pathname
  const route = routeByPath(path)
  const jsonLd = routeJsonLd(route)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path])

  useEffect(() => {
    const el = document.querySelector('[data-seo="jsonld"]')
    if (el) el.remove()
  }, [jsonLd])

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
      <FloatingWhatsApp />
    </>
  )
}
