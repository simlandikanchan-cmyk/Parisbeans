import { GalleryHero, GalleryGrid } from '../../features/gallery'
import { gallerySections } from '../../shared/models/siteData'

const sections = [
  {
    id: 'atmosphere',
    gridClass: 'gal-grid--atmosphere',
    eyebrow: 'PARISIAN ATMOSPHERE',
    title: (
      <>
        Moments Worth <em>Slowing Down</em> For.
      </>
    ),
    description:
      'A little time to pause, enjoy your coffee, and take in the Paris-inspired atmosphere at HAIR RAP BY YOYO.',
    tiles: [
      { tile: 'gal-tile--a', image: 0 },
      { tile: 'gal-tile--b', image: 1 },
      { tile: 'gal-tile--feature', image: 2 },
      { tile: 'gal-tile--wide', image: 3 },
    ],
  },
  {
    id: 'wall-art',
    gridClass: 'gal-grid--wall',
    eyebrow: 'Paris Wall Art',
    title: (
      <>
        A Corner of <em>Paris,</em> Inside <em>HAIR RAP BY YOYO.</em>
      </>
    ),
    description:
      'Paris-inspired artwork brings the feeling of a Parisian street into the heart of HAIR RAP BY YOYO',
    tiles: [
      { tile: 'gal-tile--a', image: 0 },
      { tile: 'gal-tile--b', image: 1 },
      { tile: 'gal-tile--c', image: 3 },
      { tile: 'gal-tile--d', image: 4 },
      { tile: 'gal-tile--feature', image: 2 },
    ],
  },
  {
    id: 'coffee-food',
    gridClass: 'gal-grid--food',
    eyebrow: 'Coffee & Food',
    title: (
      <>
        Made for <em>the Moment.</em>
      </>
    ),
    description: 'Simple café pleasures designed to complement your salon experience.',
    tiles: [
      { tile: 'gal-tile--a', image: 0 },
      { tile: 'gal-tile--b', image: 2 },
      { tile: 'gal-tile--c', image: 3 },
      { tile: 'gal-tile--d', image: 4 },
      { tile: 'gal-tile--e', image: 5 },
      { tile: 'gal-tile--g', image: 6 },
      { tile: 'gal-tile--feature', image: 1 },
    ],
  },
  {
    id: 'salon-cafe',
    gridClass: 'gal-grid--salon',
    bookend: true,
    eyebrow: 'Salon + Café',
    title: (
      <>
        Where <em>Beauty</em> Meets <em>Café Culture.</em>
      </>
    ),
    description:
      'A salon appointment, a coffee, and an atmosphere designed to make your time feel special.',
    tiles: [
      { tile: 'gal-tile--a', image: 0 },
      { tile: 'gal-tile--b', image: 1 },
      { tile: 'gal-tile--c', image: 3 },
      { tile: 'gal-tile--d', image: 4 },
      { tile: 'gal-tile--feature', image: 2 },
    ],
  },
]

export default function GalleryPage() {
  return (
    <>
      <GalleryHero />
      {sections.map(({ id, ...config }) => (
        <GalleryGrid
          key={id}
          {...config}
          images={gallerySections.find((s) => s.id === id).images}
        />
      ))}
    </>
  )
}