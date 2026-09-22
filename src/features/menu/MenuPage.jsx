import { useState } from 'react'
import { menuCategories } from '../../data/siteData'
import CallToAction from '../../ui/CallToAction'
import MenuHero from './MenuHero'
import MenuCategories from './MenuCategories'
import MenuSpecialty from './MenuSpecialty'
import MenuCafe from './MenuCafe'

export default function MenuPage() {
  const [activeId, setActiveId] = useState(menuCategories[0].id)
  const category = menuCategories.find((c) => c.id === activeId) ?? menuCategories[0]

  return (
    <main id="main" className="menu-page">
      <MenuHero />
      <MenuCategories activeId={activeId} onSelect={setActiveId} />
      <MenuSpecialty category={category} />
      <MenuCafe />
      <CallToAction
        baseClass="menu-cta"
        threshold={0.08}
        buttonSize="small"
        eyebrow="The Paris Beans Experience"
        title={
          <>
            More Than a Coffee. <em>Part of Your Appointment.</em>
          </>
        }
        description="Whether you arrive early, take a break during your service, or simply want to enjoy the atmosphere, ParisBeans adds a warm café moment to your HAIR RAP BY YOYO experience."
        href="/visit-contact"
        label="Reserve Your Spot"
      />
    </main>
  )
}