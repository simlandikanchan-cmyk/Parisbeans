import CallToAction from '../../shared/components/CallToAction'
import { VisitHero, ContactLocation } from '../../features/visit'

export default function VisitContactPage() {
  return (
    <>
      <VisitHero />
      <ContactLocation />
      <CallToAction
        baseClass="visit-cta"
        sectionClass="section"
        titleClass="section-heading"
        eyebrowAs="span"
        eyebrow="The Paris Beans Experience"
        title={
          <>
            More Than a Coffee. <em>Part of Your Appointment.</em>
          </>
        }
        description="Whether you arrive early, take a break during your service, or simply want to enjoy the atmosphere, ParisBeans adds a warm café moment to your HAIR RAP BY YOYO experience."
        href="#visit-contact"
        label="Reserve Your Spot"
      />
    </>
  )
}