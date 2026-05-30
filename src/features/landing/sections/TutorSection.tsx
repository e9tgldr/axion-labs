import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Pill } from '@/components/ui/Pill'
import { Reveal } from '@/components/ui/Reveal'

export function TutorSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionHeading
            align="left"
            eyebrow={t('tutor.eyebrow')}
            title={t('tutor.title')}
            subtitle={t('tutor.subtitle')}
          />
          <Pill className="w-fit border-violet/40 text-violet">{t('tutor.withImage')}</Pill>
        </div>

        <Reveal>
          <GlassPanel glow="violet" className="flex flex-col gap-4">
            {/* user message with image attachment */}
            <div className="flex justify-end">
              <div className="flex max-w-[85%] flex-col items-end gap-2">
                <div className="flex items-center gap-2 rounded-xl rounded-tr-sm bg-axion px-4 py-3 text-sm font-medium text-bg">
                  {t('tutor.userMsg')}
                </div>
                <span className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span className="h-2 w-2 rounded-sm bg-pink" /> problem.jpg
                </span>
              </div>
            </div>
            {/* tutor reply */}
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-xs text-violet">
                AI
              </span>
              <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-line bg-surface/70 px-4 py-3 text-sm leading-relaxed text-text/90">
                {t('tutor.botMsg')}
              </div>
            </div>
            {/* input row (decorative) */}
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
              <span className="text-muted">＋</span>
              <span className="flex-1 truncate font-sans text-sm text-muted">{t('tutor.placeholder')}</span>
              <span className="rounded-lg bg-axion px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-bg">
                {t('tutor.followup')}
              </span>
            </div>
          </GlassPanel>
        </Reveal>
      </Container>
    </section>
  )
}
