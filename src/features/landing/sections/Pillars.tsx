import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Reveal } from '@/components/ui/Reveal'

function SimIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="24" cy="24" r="5" />
      <ellipse cx="24" cy="24" rx="20" ry="8" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(120 24 24)" />
    </svg>
  )
}
function TestIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="9" y="6" width="30" height="36" rx="3" />
      <path d="M15 16h12M15 24h18M15 32h10" strokeLinecap="round" />
      <path d="m31 28 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function AiIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="10" y="14" width="28" height="20" rx="5" />
      <path d="M24 14V8M18 24h.02M30 24h.02" strokeLinecap="round" />
      <path d="M6 22v4M42 22v4" strokeLinecap="round" />
    </svg>
  )
}

export function Pillars() {
  const { t } = useTranslation('landing')
  const cards = [
    { icon: <SimIcon />, t: t('pillars.sim.t'), d: t('pillars.sim.d'), color: 'text-orange', glow: 'orange' as const },
    { icon: <TestIcon />, t: t('pillars.test.t'), d: t('pillars.test.d'), color: 'text-pink', glow: undefined },
    { icon: <AiIcon />, t: t('pillars.ai.t'), d: t('pillars.ai.d'), color: 'text-violet', glow: 'violet' as const },
  ]

  return (
    <section className="py-24">
      <Container className="flex flex-col items-center gap-14">
        <SectionHeading eyebrow={t('pillars.eyebrow')} title={t('pillars.title')} />
        <div className="grid w-full gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 120}>
              <GlassPanel glow={c.glow} className="flex h-full flex-col gap-4 transition-transform hover:-translate-y-1">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface ${c.color}`}>
                  {c.icon}
                </span>
                <h3 className="font-display text-xl font-bold">{c.t}</h3>
                <p className="text-sm leading-relaxed text-muted">{c.d}</p>
              </GlassPanel>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
