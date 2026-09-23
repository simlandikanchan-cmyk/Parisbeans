import { contact } from '../../../shared/models/siteData'
import { heroImages } from '../../../shared/assets/images'

export const visitPageData = {
  heroImage: heroImages.salonInterior,
  contact: {
    ...contact,
    mapSrc: `https://www.openstreetmap.org/export/embed.html?bbox=${contact.mapBbox}&layer=mapnik`,
  },
}