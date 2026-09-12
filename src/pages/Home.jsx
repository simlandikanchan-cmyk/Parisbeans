import Hero from '../components/Hero'
import ExperienceStrip from '../components/ExperienceStrip'
import StorySection from '../components/StorySection'
import BenefitsSection from '../components/BenefitsSection'
import CafeMenu from '../components/CafeMenu'
import GalleryMood from '../components/GalleryMood'

export default function Home() {
  return (
    <main>
      <Hero />
      <ExperienceStrip />
      <StorySection />
      <BenefitsSection />
      <CafeMenu />
      <GalleryMood />
    </main>
  )
}
