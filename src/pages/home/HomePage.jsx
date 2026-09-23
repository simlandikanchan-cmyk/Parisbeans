import CallToAction from '../../shared/components/CallToAction'
import { Hero, StorySection, BenefitsSection, CafeMenu, GalleryMood } from '../../features/home'
import './CallToAction.css'

const CTA_COPY = {
  eyebrow: 'The Paris Beans Experience',
  title: (
    <>
      More Than a Coffee. <em>Part of Your Appointment.</em>
    </>
  ),
  description:
    'Whether you arrive early, take a break during your service, or simply want to enjoy the atmosphere, ParisBeans adds a warm café moment to your HAIR RAP BY YOYO experience.',
  href: '/visit-contact',
  label: 'Reserve Your Spot',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <CallToAction baseClass="experience" staggered {...CTA_COPY} />
      <StorySection />
      <BenefitsSection />
      <CafeMenu />
      <GalleryMood />
    </>
  )
}
