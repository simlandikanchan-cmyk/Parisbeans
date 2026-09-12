import GalleryHero from '../components/GalleryHero'
import GalleryAtmosphere from '../components/GalleryAtmosphere'
import GalleryWallArt from '../components/GalleryWallArt'
import GalleryFood from '../components/GalleryFood'
import GallerySalon from '../components/GallerySalon'

export default function Gallery() {
  return (
    <main>
      <GalleryHero />
      <GalleryAtmosphere />
      <GalleryWallArt />
      <GalleryFood />
      <GallerySalon />
    </main>
  )
}