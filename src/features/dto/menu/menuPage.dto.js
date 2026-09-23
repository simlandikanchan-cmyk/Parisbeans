import { menuImages } from '../../../shared/assets/images'
import { menuCategories, menuItems, cafeCardTitles, cafeCardPrices } from '../../../shared/models/siteData'
import { toMenuItems, toCafeCards } from '../menuItem'

export const menuPageData = {
  heroImage: menuImages.hero,
  categories: menuCategories,
  cafe: {
    items: toMenuItems(menuItems),
    cards: toCafeCards(cafeCardTitles, cafeCardPrices, menuItems),
  },
}