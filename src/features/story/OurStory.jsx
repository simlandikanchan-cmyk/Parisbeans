import OurStoryHero from './OurStoryHero'
import OurStoryOrigin from './OurStoryOrigin'
import OurStoryImageRow from './OurStoryImageRow'
import OurStoryCta from './OurStoryCta'
import './OurStory.css'

export default function OurStory() {
  return (
    <main id="main" className="ostory-page">
      <OurStoryHero />
      <OurStoryOrigin />
      <OurStoryImageRow />
      <OurStoryCta />
    </main>
  )
}