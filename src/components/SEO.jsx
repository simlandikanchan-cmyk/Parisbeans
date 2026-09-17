/* eslint-disable react/no-danger-with-children */
import { useEffect } from 'react'

const DEFAULTS = {
  image: 'https://parisbeans.com/images/hero.svg',
}

const ROUTE_PATHS = {
  home: '',
  story: 'our-story',
  menu: 'menu',
  gallery: 'gallery',
  visit: 'visit-contact',
  privacy: 'privacy-policy',
  terms: 'terms-and-conditions',
}

const ROUTE_SEO = {
  home: {
    title: 'Paris Beans · Hair Rap by Yoyo',
    description:
      'Paris Beans — a Paris-inspired café experience inside Hair Rap by Yoyo. Pause, sip, enjoy.',
  },
  story: {
    title: 'Our Story — Paris Beans',
    description:
      'Paris Beans was created inside Hair Rap by Yoyo as a café corner where guests can enjoy coffee surrounded by Paris-inspired wall art and atmosphere.',
  },
  menu: {
    title: 'Menu — Paris Beans',
    description:
      'From comforting coffee to simple café favourites, discover the offerings available at ParisBeans inside Hair Rap by Yoyo.',
  },
  gallery: {
    title: 'Gallery — Paris Beans',
    description:
      'Step inside Paris Beans and discover the details, atmosphere and moments that make Hair Rap by Yoyo feel different.',
  },
  visit: {
    title: 'Visit & Contact — Paris Beans',
    description:
      'Find Paris Beans inside HAIR RAP BY YOYO. Visit our Paris-inspired café corner, book an appointment, or get in touch.',
  },
  privacy: {
    title: 'Privacy Policy — Paris Beans',
    description: 'Paris Beans privacy policy — how we collect, use, and protect your information.',
  },
  terms: {
    title: 'Terms & Conditions — Paris Beans',
    description: 'Paris Beans terms and conditions of service for café visits and salon appointments.',
  },
}

export default function SEO({ route = 'home', title, description, image, canonical, jsonLd }) {
  const data = ROUTE_SEO[route] || ROUTE_SEO.home
  const t = title || data.title
  const d = description || data.description
  const img = image || DEFAULTS.image
  const url = canonical || `https://parisbeans.com${route === 'home' ? '' : '/' + ROUTE_PATHS[route]}`

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
    setTag('name', 'keywords', 'Paris Beans, Hair Rap by Yoyo, Parisian café, salon café, coffee, café experience, Paris-inspired')
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