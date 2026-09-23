import { heroImages, storyImages } from '../../../shared/assets/images'

export const storyPageData = {
  heroPanels: [
    {
      id: 'panel-salon',
      src: heroImages.salonInterior,
      pos: '50% 50%',
      alt: 'Paris Beans interior with wooden wall logo and café counter',
    },
    {
      id: 'panel-rap',
      src: storyImages.rectangle73,
      pos: '50% 30%',
      alt: 'HAIR RAP BY YOYO environment',
    },
    {
      id: 'panel-salon-detail',
      src: storyImages.rectangle75,
      pos: '50% 25%',
      alt: 'Salon interior detail',
    },
    {
      id: 'panel-cafe',
      src: storyImages.rectangle74,
      pos: '50% 60%',
      alt: 'Café corner detail',
    },
  ],
  originPhoto: storyImages.photo,
  storyImage: storyImages.img,
}