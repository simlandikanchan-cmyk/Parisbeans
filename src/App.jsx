import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Preloader from './components/Preloader'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import SEO from './components/SEO'
import Home from './pages/Home.jsx'
import VisitContact from './pages/VisitContact.jsx'
import Gallery from './pages/Gallery.jsx'
import MenuPage from './pages/MenuPage.jsx'
import OurStory from './pages/OurStory.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsConditions from './pages/TermsConditions.jsx'

function getPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function matchRoute(path) {
  if (path === '/privacy-policy' || path === '/privacy') return 'privacy'
  if (path === '/terms-and-conditions' || path === '/terms') return 'terms'
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

  const jsonLd = (() => {
    switch (route) {
      case 'story':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Our Story — Paris Beans',
          description:
            'Paris Beans was created inside Hair Rap by Yoyo as a café corner where guests can enjoy coffee surrounded by Paris-inspired wall art and atmosphere.',
          author: { '@type': 'Organization', name: 'Paris Beans' },
          publisher: { '@type': 'Organization', name: 'Paris Beans' },
          datePublished: '2026-09-17',
          mainEntityOfPage: 'https://parisbeans.com/our-story',
        }
      case 'menu':
        return {
          '@context': 'https://schema.org',
          '@type': 'Menu',
          name: 'Paris Beans Menu',
          description:
            'From comforting coffee to simple café favourites, discover the offerings available at ParisBeans inside Hair Rap by Yoyo.',
          hasMenuSection: [
            { '@type': 'MenuSection', name: 'Coffee' },
            { '@type': 'MenuSection', name: 'Breakfast & Light Bites' },
            { '@type': 'MenuSection', name: 'Little Indulgences' },
          ],
          mainEntityOfPage: 'https://parisbeans.com/menu',
        }
      case 'gallery':
        return {
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Paris Beans Gallery',
          description:
            'Step inside Paris Beans and discover the details, atmosphere and moments that make Hair Rap by Yoyo feel different.',
          mainEntityOfPage: 'https://parisbeans.com/gallery',
        }
      case 'visit':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          '@id': 'https://parisbeans.com/visit-contact',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://parisbeans.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Visit & Contact',
              item: 'https://parisbeans.com/visit-contact',
            },
          ],
        }
      case 'privacy':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          '@id': 'https://parisbeans.com/privacy-policy',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://parisbeans.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Privacy Policy',
              item: 'https://parisbeans.com/privacy-policy',
            },
          ],
        }
      case 'terms':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          '@id': 'https://parisbeans.com/terms-and-conditions',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://parisbeans.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Terms & Conditions',
              item: 'https://parisbeans.com/terms-and-conditions',
            },
          ],
        }
      default:
        return undefined
    }
  })()

  return (
    <>
      <SEO route={route} jsonLd={jsonLd} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Preloader />
      <Header story={route === 'story'} route={route} />
      {route === 'gallery' ? (
        <Gallery />
      ) : route === 'visit' ? (
        <VisitContact />
      ) : route === 'menu' ? (
        <MenuPage />
      ) : route === 'story' ? (
        <OurStory />
      ) : route === 'privacy' ? (
        <PrivacyPolicy />
      ) : route === 'terms' ? (
        <TermsConditions />
      ) : (
        <Home />
      )}
      <Footer route={route} />
      <FloatingWhatsApp />
    </>
  )
}