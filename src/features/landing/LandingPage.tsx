import { Hero } from './sections/Hero'
import { StatsBand } from './sections/StatsBand'
import { Pillars } from './sections/Pillars'
import { SimShowcase } from './sections/SimShowcase'
import { TutorSection } from './sections/TutorSection'
import { ExamsSection } from './sections/ExamsSection'
import { CurriculumSection } from './sections/CurriculumSection'
import { Pricing } from './sections/Pricing'
import { CtaBand } from './sections/CtaBand'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <Pillars />
      <SimShowcase />
      <TutorSection />
      <ExamsSection />
      <CurriculumSection />
      <Pricing />
      <CtaBand />
    </>
  )
}
