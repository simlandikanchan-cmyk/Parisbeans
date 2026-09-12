import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home.jsx'
import VisitContact from './pages/VisitContact.jsx'
import Gallery from './pages/Gallery.jsx'
import MenuPage from './pages/MenuPage.jsx'
import OurStory from './pages/OurStory.jsx'

function getPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function matchRoute(path) {
  if (path === '/our-story' || path === '/story') return 'story'
  if (path === '/menu') return 'menu'
  if (path === '/gallery') return 'gallery'
  if (path === '/visit-contact' || path === '/visit') return 'visit'
  return 'home'
}

export default function App() {
  const [path, setPath] = useState(getPath)
  const route = matchRoute(path)

  useEffect(() => {
    const onPop = () => setPath(getPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Intercept internal path links so navigation never triggers a full reload.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a')
      if (!a) return
      const href = (a.getAttribute('href') || '').trim()
      if (!href.startsWith('/') || href.startsWith('//')) return

      const url = new URL(a.href, window.location.origin)
      if (url.origin !== window.location.origin) return

      e.preventDefault()
      window.history.pushState({}, '', url.pathname + url.search + url.hash)
      setPath(getPath())
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <Header />
      {route === 'gallery' ? (
        <Gallery />
      ) : route === 'visit' ? (
        <VisitContact />
      ) : route === 'menu' ? (
        <MenuPage />
      ) : route === 'story' ? (
        <OurStory />
      ) : (
        <Home />
      )}
      <Footer />
    </>
  )
}