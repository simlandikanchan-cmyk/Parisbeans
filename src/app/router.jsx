export const routeByPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/privacy-policy' || path === '/privacy') return 'privacy'
  if (path === '/terms-and-conditions' || path === '/terms') return 'terms'
  if (path === '/our-story' || path === '/story') return 'story'
  if (path === '/menu') return 'menu'
  if (path === '/gallery') return 'gallery'
  if (path === '/visit-contact' || path === '/visit') return 'visit'
  return 'home'
}

export const routePaths = {
  home: '',
  story: 'our-story',
  menu: 'menu',
  gallery: 'gallery',
  visit: 'visit-contact',
  privacy: 'privacy-policy',
  terms: 'terms-and-conditions',
}

export const routePathsList = {
  home: '/',
  story: '/our-story',
  menu: '/menu',
  gallery: '/gallery',
  visit: '/visit-contact',
  privacy: '/privacy-policy',
  terms: '/terms-and-conditions',
}

const ROUTE_SEO = {
  home: {
    title: 'Paris Beans \u00b7 HAIR RAP BY YOYO',
    description:
      'Paris Beans \u2014 a Paris-inspired caf\u00e9 experience inside HAIR RAP BY YOYO. Pause, sip, enjoy.',
  },
  story: {
    title: 'Our Story \u2014 Paris Beans',
    description:
      'Paris Beans was created inside HAIR RAP BY YOYO as a caf\u00e9 corner where guests can enjoy coffee surrounded by Paris-inspired wall art and atmosphere.',
  },
  menu: {
    title: 'Menu \u2014 Paris Beans',
    description:
      'From comforting coffee to simple caf\u00e9 favourites, discover the offerings available at ParisBeans inside HAIR RAP BY YOYO.',
  },
  gallery: {
    title: 'Gallery \u2014 Paris Beans',
    description:
      'Step inside Paris Beans and discover the details, atmosphere and moments that make HAIR RAP BY YOYO feel different.',
  },
  visit: {
    title: 'Visit & Contact \u2014 Paris Beans',
    description:
      'Find Paris Beans inside HAIR RAP BY YOYO. Visit our Paris-inspired caf\u00e9 corner, book an appointment, or get in touch.',
  },
  privacy: {
    title: 'Privacy Policy \u2014 Paris Beans',
    description: 'Paris Beans privacy policy \u2014 how we collect, use, and protect your information.',
  },
  terms: {
    title: 'Terms & Conditions \u2014 Paris Beans',
    description: 'Paris Beans terms and conditions of service for caf\u00e9 visits and salon appointments.',
  },
}

export function routeSeo(route) {
  const data = ROUTE_SEO[route] || ROUTE_SEO.home
  return data
}

export function routeJsonLd(route) {
  switch (route) {
    case 'story':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Our Story \u2014 Paris Beans',
        description:
          'Paris Beans was created inside HAIR RAP BY YOYO as a caf\u00e9 corner where guests can enjoy coffee surrounded by Paris-inspired wall art and atmosphere.',
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
          'From comforting coffee to simple caf\u00e9 favourites, discover the offerings available at ParisBeans inside HAIR RAP BY YOYO.',
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
          'Step inside Paris Beans and discover the details, atmosphere and moments that make HAIR RAP BY YOYO feel different.',
        mainEntityOfPage: 'https://parisbeans.com/gallery',
      }
    case 'visit':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': 'https://parisbeans.com/visit-contact',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://parisbeans.com' },
          { '@type': 'ListItem', position: 2, name: 'Visit & Contact', item: 'https://parisbeans.com/visit-contact' },
        ],
      }
    case 'privacy':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': 'https://parisbeans.com/privacy-policy',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://parisbeans.com' },
          { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://parisbeans.com/privacy-policy' },
        ],
      }
    case 'terms':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': 'https://parisbeans.com/terms-and-conditions',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://parisbeans.com' },
          { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: 'https://parisbeans.com/terms-and-conditions' },
        ],
      }
    default:
      return undefined
  }
}
