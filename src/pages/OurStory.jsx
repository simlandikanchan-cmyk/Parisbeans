import OurStoryHero from '../components/OurStoryHero'
import OurStoryOrigin from '../components/OurStoryOrigin'
import OurStoryImageRow from '../components/OurStoryImageRow'
import OurStoryCta from '../components/OurStoryCta'
import './OurStory.css'

export default function OurStory() {
  return (
    <main id="our-story" className="ostory-page">
      <OurStoryHero />
      <OurStoryOrigin />
      <OurStoryImageRow />
      {/* <OurStoryExperience /> */}
      <OurStoryCta />
    </main>
  )
}