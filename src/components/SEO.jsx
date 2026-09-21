/* eslint-disable react/no-danger-with-children */
import { useEffect } from 'react'
import { routeSeo, routePaths } from '../router'

const DEFAULTS = {
  image: 'https://parisbeans.com/images/hero.svg',
}

export default function SEO({ route = 'home', title, description, image, canonical, jsonLd }) {
  const data = routeSeo(route)
  const t = title || data.title
  const d = description || data.description
  const img = image || DEFAULTS.image
  const url = canonical || `https://parisbeans.com${route === 'home' ? '' : '/' + routePaths[route]}`

  useEffect(() => {
    const setTag = (attr, key, value) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', value)
    }

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    document.title = t
    setTag('name', 'description', d)
    setTag('name', 'keywords', 'Paris Beans, HAIR RAP BY YOYO, Parisian café, salon café, coffee, café experience, Paris-inspired')
    setTag('property', 'og:title', t)
    setTag('property', 'og:description', d)
    setTag('property', 'og:image', img)
    setTag('property', 'og:url', url)
    setTag('property', 'og:type', 'website')
    setTag('property', 'og:site_name', 'Paris Beans')
    setTag('name', 'twitter:card', 'summary_large_image')
    setTag('name', 'twitter:title', t)
    setTag('name', 'twitter:description', d)
    setTag('name', 'twitter:image', img)
    setLink('canonical', url)

    // Structured data — remove any prior SEO script, then inject
    document.querySelectorAll('script[data-seo="jsonld"]').forEach((s) => s.remove())
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-seo', 'jsonld')
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [t, d, img, url, jsonLd])

  return null
}