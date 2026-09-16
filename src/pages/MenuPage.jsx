import { useState } from 'react'
import { menuCategories } from '../data/siteData'
import MenuHero from '../components/MenuHero'
import MenuCategories from '../components/MenuCategories'
import MenuSpecialty from '../components/MenuSpecialty'
import MenuCafe from '../components/MenuCafe'
import MenuCTA from '../components/MenuCTA'

export default function MenuPage() {
  const [activeId, setActiveId] = useState(menuCategories[0].id)
  const category = menuCategories.find((c) => c.id === activeId) ?? menuCategories[0]

  return (
    <main id="main" className="menu-page">
      <MenuHero />
      <MenuCategories activeId={activeId} onSelect={setActiveId} />
      <MenuSpecialty category={category} />
      <MenuCafe />
      <MenuCTA />
    </main>
  )
}