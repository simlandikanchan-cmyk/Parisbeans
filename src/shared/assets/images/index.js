import g1 from './gallery/g1.svg'
import g2 from './gallery/g2.svg'
import g3 from './gallery/g3.svg'
import g4 from './gallery/g4.svg'
import g5 from './gallery/g5.svg'
import g6 from './gallery/g6.svg'
import g7 from './gallery/g7.svg'

import photoRectangle from './gallery_hero/Photo rectangle_hq.jpg'
import photoRectangle1 from './gallery_hero/Photo rectangle (1)_hq.jpg'
import photoRectangle2 from './gallery_hero/Photo rectangle (2)_hq.jpg'
import photoRectangle3 from './gallery_hero/Photo rectangle (3)_hq.jpg'
import photoRectangle4 from './gallery_hero/Photo rectangle (4)_hq.jpg'
import photoRectangle5 from './gallery_hero/Photo rectangle (5)_hq.jpg'
import photoRectangle6 from './gallery_hero/Photo rectangle (6)_hq.jpg'

import salonInterior from './hero/salon-interior.svg'
import frame48096466 from './hero/Frame 48096466.png'

import aglioOlio from './menu/aglio-olio.svg'
import blushSunset from './menu/blush-sunset.svg'
import espressoMartini from './menu/espresso-martini.svg'
import galaxy from './menu/galaxy.svg'
import menuBackground from './menu/menu_background.jpg'
import menuHero from './menu/hero.svg'
import hummus from './menu/hummus.svg'
import lemonMint from './menu/lemon-mint.svg'
import menuDecoBottomRight from './menu/Menu bottom Right.svg'
import menuDecoTopLeft from './menu/Menu Top Left.svg'
import sundowner from './menu/sundowner.svg'
import tab1 from './menu/tab1.png'
import tab2 from './menu/tab2.png'
import tab3 from './menu/tab3.png'
import virginMojito from './menu/virgin-mojito.svg'

import storyFrame48096320 from './story/frame-48096320.svg'
/* Phone-tier section decorations, cut out of mobile_menu.svg: pale art with no
   ground of its own, so they can sit over the section colour at any size. */
import decoBeans from './story/deco-beans.svg'
import decoCupCroissant from './story/deco-cup-croissant.svg'
// The next three are served from public/ rather than imported, so they are not
// hashed or optimised by Vite. See the exclusion list in vite.config.js.
const storyImg1 = '/story/img1.png'
const storyImgPhone = '/story/img_phone.png'
const tabletStory = '/story/Frame 48096464 (1).png'
import photo from './story/photo.svg'
import rectangle69 from './story/Rectangle 69.svg'
import rectangle71 from './story/Rectangle 71.svg'
import rectangle72 from './story/Rectangle 72.svg'
import rectangle73 from './story/Rectangle 73.svg'
import rectangle74 from './story/Rectangle 74.svg'
import rectangle75 from './story/Rectangle 75.svg'

export const galleryImages = {
  g1,
  g2,
  g3,
  g4,
  g5,
  g6,
  g7,
}

export const galleryHeroImages = [
  photoRectangle,
  photoRectangle1,
  photoRectangle2,
  photoRectangle3,
  photoRectangle4,
  photoRectangle5,
  photoRectangle6,
]

export const heroImages = {
  salonInterior,
  frame48096466,
}

export const menuImages = {
  'aglio-olio': aglioOlio,
  'blush-sunset': blushSunset,
  'espresso-martini': espressoMartini,
  galaxy,
  hero: menuHero,
  background: menuBackground,
  hummus,
  'lemon-mint': lemonMint,
  sundowner,
  tab1,
  tab2,
  tab3,
  'virgin-mojito': virginMojito,
}

/* Corner art for the Home "From the Café" section. Both are thin #A66A3F
   squiggles on a transparent ground, sized in vw per screen band and anchored
   to the section's own corners, so the overflow: hidden on .cafe crops them
   the way the Figma frames do. */
export const menuDeco = {
  topLeft: menuDecoTopLeft,
  bottomRight: menuDecoBottomRight,
}

export const storyImages = {
  frame48096320: storyFrame48096320,
  decoBeans,
  decoCupCroissant,
  img: storyImg1,
  phoneStoryPage: storyImgPhone,
  photo,
  tabletStory,
  rectangle69,
  rectangle71,
  rectangle72,
  rectangle73,
  rectangle74,
  rectangle75,
}