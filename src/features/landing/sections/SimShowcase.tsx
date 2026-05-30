import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { GridOverlay } from '@/components/ui/GridOverlay'
import { Pill } from '@/components/ui/Pill'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { MiniSimFallback } from '@/components/ui/MiniSimFallback'
import { heroEnabled } from '@/three/webgl'
import { resolveLang } from '@/i18n'
import { SIMULATIONS, ACCENT_TEXT } from '@/data/simulations'

const MiniSimTeaser = lazy(() => import('@/three/MiniSimTeaser'))

export function SimShowcase() {
  const { t, i18n } = useTranslation('landing')
  const lang = resolveLang(i18n.language)
  const featured = SIMULATIONS[0]
  const catalog = SIMULATIONS.slice(1, 7)

  return (
    <section className="relative border-y border-line bg-surface-2/40 py-24">
      <GridOverlay className="opacity-[0.04]" />
      <Container className="relative flex flex-col gap-14">
        <SectionHeading eyebrow={t('showcase.eyebrow')} title={t('showcase.title')} subtitle={t('showcase.subtitle')} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* featured live canvas */}
          <Reveal className="lg:row-span-2">
            <GlassPanel glow="violet" className="flex h-full min-h-[320px] flex-col gap-4 overflow-hidden p-0">
              <div className="relative flex-1">
                <div className="absolute inset-0">
                  {heroEnabled() ? (
                    <Suspense fallback={<MiniSimFallback />}>
                      <MiniSimTeaser />
                    </Suspense>
                  ) : (
                    <MiniSimFallback />
                  )}
                </div>
                <Pill className="absolute left-4 top-4 border-violet/40 text-violet">{t('showcase.featured')}</Pill>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line p-5">
                <div>
                  <div className="font-display text-lg font-bold">{featured.name[lang]}</div>
                  <div className="font-mono text-xs text-muted">{featured.formula}</div>
                </div>
                <Button size="sm" variant="outline" to="/lab">
                  {t('showcase.cta')}
                </Button>
              </div>
            </GlassPanel>
          </Reveal>

          {/* catalog cards */}
          {catalog.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <GlassPanel className="group flex h-full flex-col gap-3 transition-all hover:-translate-y-1 hover:border-violet/50">
                <div className="flex items-center justify-between">
                  <Pill>{s.topic[lang]}</Pill>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {t('curriculum.gradeLabel')} {s.grade}
                  </span>
                </div>
                <h3 className={`font-display text-lg font-bold ${ACCENT_TEXT[s.accent]}`}>{s.name[lang]}</h3>
                <code className="mt-auto font-mono text-xs text-muted">{s.formula}</code>
              </GlassPanel>
            </Reveal>
          ))}
        </div>

        <div className="flex justify-center">
          <Button to="/lab">{t('showcase.cta')}</Button>
        </div>
      </Container>
    </section>
  )
}
