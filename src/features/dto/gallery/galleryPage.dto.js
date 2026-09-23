import { galleryHeroImages } from '../../../shared/assets/images'
import { gallerySections, galleryImages, galleryAlt, galleryDims } from '../../../shared/models/siteData'
import { toGalleryImageList } from '../galleryImage'

const toSectionImages = (keys) =>
  toGalleryImageList(
    keys.map((key) => ({ key, alt: galleryAlt(key) })),
    galleryImages,
    galleryDims
  )

export const galleryPageData = {
  heroImages: galleryHeroImages,
  sections: gallerySections.map((section) => ({
    ...section,
    images: toSectionImages(section.images),
  })),
}