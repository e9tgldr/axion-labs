import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { cn } from '@/lib/cn'
import { CURRICULUM, GRADES, type Grade } from '@/data/curriculum'
import { LANGS, type Lang } from '@/i18n'

export function CurriculumSection() {
  const { t, i18n } = useTranslation('landing')
  const [grade, setGrade] = useState<Grade>(9)
  const lang: Lang = (LANGS as readonly string[]).includes(i18n.language)
    ? (i18n.language as Lang)
    : 'mn'
  const topics = CURRICULUM[grade][lang]

  return (
    <section className="py-24">
      <Container className="flex flex-col items-center gap-12">
        <SectionHeading eyebrow={t('curriculum.eyebrow')} title={t('curriculum.title')} subtitle={t('curriculum.subtitle')} />

        <div className="flex flex-wrap justify-center gap-3">
          {GRADES.map((g) => {
            const active = g === grade
            return (
              <button
                key={g}
                type="button"
                aria-pressed={active}
                onClick={() => setGrade(g)}
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-xl border font-display text-lg font-bold transition-all',
                  active
                    ? 'border-transparent bg-axion text-bg shadow-glow-violet'
                    : 'border-line bg-surface/60 text-muted hover:text-text',
                )}
              >
                {g}
              </button>
            )
          })}
        </div>

        <GlassPanel className="w-full max-w-3xl">
          <div className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-axion" />
            {t('curriculum.gradeLabel')} {grade}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {topics.map((topic, i) => (
              <li key={topic} className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 px-4 py-3">
                <span className="font-mono text-xs text-orange">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-text/90">{topic}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </Container>
    </section>
  )
}
