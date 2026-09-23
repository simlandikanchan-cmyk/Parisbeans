import { OurStoryHero, OurStoryOrigin, OurStoryImageRow, OurStoryCta } from '../../features/story'
import './StoryPage.css'

export default function StoryPage() {
  return (
    <>
      <OurStoryHero />
      <OurStoryOrigin />
      <OurStoryImageRow />
      <OurStoryCta />
    </>
  )
}