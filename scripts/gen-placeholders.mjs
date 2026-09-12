// Generates elegant placeholder SVG images for Paris Beans.
// Run: node scripts/gen-placeholders.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')

const menus = [
  ['hummus', 'Hummus', '#D9B98C'],
  ['virgin-mojito', 'Virgin Mojito', '#A7C4A0'],
  ['lemon-mint', 'Lemon Mint Elixir', '#C9D8A6'],
  ['espresso-martini', 'Espresso Martini', '#8C5A3C'],
  ['galaxy', 'Galaxy Cocktail', '#6E5A8C'],
  ['aglio-olio', 'Aglio E Olio', '#D8C49A'],
  ['sundowner', 'Sundowner Mocktail', '#D89A6E'],
  ['blush-sunset', 'Blush Sunset', '#D99A8C'],
]

const gallery = [
  ['g1', '#C9B79C', '3 / 4'],
  ['g2', '#A96E3F', '3 / 4'],
  ['g3', '#D8C49A', '3 / 4'],
  ['g4', '#8C5A3C', '4 / 5'],
  ['g5', '#C18A5B', '4 / 5'],
  ['g6', '#B89B7A', '3 / 4'],
  ['g7', '#A7C4A0', '3 / 4'],
]

function svgPlaceholder({ label, swatch, ratio, kind: _kind }) {
  const [w, h] = ratio.split(' / ')
  const W = 600
  const H = Math.round((W * Number(h)) / Number(w))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${swatch}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#432719" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="${W * 0.5}" cy="${H * 0.46}" r="${Math.min(W, H) * 0.16}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>
  <circle cx="${W * 0.5}" cy="${H * 0.46}" r="${Math.min(W, H) * 0.09}" fill="rgba(255,255,255,0.35)"/>
  <text x="${W / 2}" y="${H * 0.78}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${H * 0.07}" fill="rgba(255,255,255,0.92)">${label}</text>
  <text x="${W / 2}" y="${H * 0.88}" text-anchor="middle" font-family="sans-serif" font-size="${H * 0.05}" letter-spacing="4" fill="rgba(255,255,255,0.7)">PARIS BEANS</text>
</svg>
`
}

for (const [name, label, swatch] of menus) {
  const p = join(root, 'menu', `${name}.svg`)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, svgPlaceholder({ label, swatch, ratio: '4 / 5', kind: 'menu' }), 'utf8')
}

for (const [name, swatch, ratio] of gallery) {
  const p = join(root, 'gallery', `${name}.svg`)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, svgPlaceholder({ label: 'Paris Beans', swatch, ratio, kind: 'gallery' }), 'utf8')
}

writeFileSync(
  join(root, 'hero', 'salon-interior.svg'),
  svgPlaceholder({ label: 'Salon Interior', swatch: '#5A3A28', ratio: '16 / 9', kind: 'hero' }),
  'utf8'
)
writeFileSync(
  join(root, 'story', 'salon-story.svg'),
  svgPlaceholder({ label: 'Paris Beans Café', swatch: '#7A5235', ratio: '4 / 5', kind: 'story' }),
  'utf8'
)

console.log('Placeholders generated.')
