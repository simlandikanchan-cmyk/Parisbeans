import { heroImages, storyImages } from '../../../shared/assets/images'
import {
  gallery,
  galleryDims,
  galleryImages,
  menuItems,
  cafeCardTitles,
  cafeCardPrices,
} from '../../../shared/models/siteData'
import { toMenuItems, toCafeCards } from '../menuItem'
import { toGalleryImageList } from '../galleryImage'

export const homePageData = {
  heroImage: heroImages.salonInterior,
  storySlides: [
    { id: 'story-slide-1', src: storyImages.rectangle71 },
    { id: 'story-slide-2', src: storyImages.rectangle69 },
    { id: 'story-slide-3', src: storyImages.rectangle72 },
  ],
  storyBackground: storyImages.rectangle74,
  menu: toMenuItems(menuItems),
  cafeCards: toCafeCards(cafeCardTitles, cafeCardPrices, menuItems),
  galleryCards: toGalleryImageList(gallery, galleryImages, galleryDims),
}