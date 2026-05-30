import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Pill } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'
import { resolveLang } from '@/i18n'
import { SIMULATIONS, ACCENT_TEXT } from '@/data/simulations'
import { isBuilt } from './registry'

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
        active ? 'border-transparent bg-axion text-bg' : 'border-line text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  )
}

export function LabCatalog() {
  const { t, i18n } = useTranslation('lab')
  const lang = resolveLang(i18n.language)
  const [topic, setTopic] = useState<string | null>(null)
  const [grade, setGrade] = useState<number | null>(null)

  const topics = useMemo(() => [...new Set(SIMULATIONS.map((s) => s.topic[lang]))], [lang])
  const grades = useMemo(() => [...new Set(SIMULATIONS.map((s) => s.grade))].sort((a, b) => a - b), [])
  const shown = SIMULATIONS.filter(
    (s) => (!topic || s.topic[lang] === topic) && (!grade || s.grade === grade),
  )

  return (
    <Container className="py-12">
      <SectionHeading align="left" eyebrow={t('catalogEyebrow')} title={t('catalogTitle')} subtitle={t('catalogSubtitle')} />

      <div className="my-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-muted">{t('filterTopic')}</span>
        <FilterChip active={!topic} label={t('allTopics')} onClick={() => setTopic(null)} />
        {topics.map((tp) => (
          <FilterChip key={tp} active={topic === tp} label={tp} onClick={() => setTopic(tp)} />
        ))}
      </div>
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-muted">{t('filterGrade')}</span>
        <FilterChip active={!grade} label={t('allGrades')} onClick={() => setGrade(null)} />
        {grades.map((g) => (
          <FilterChip key={g} active={grade === g} label={String(g)} onClick={() => setGrade(g)} />
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => {
          const built = isBuilt(s.id)
          const card = (
            <GlassPanel
              className={cn(
                'flex h-full flex-col gap-3',
                built ? 'transition-all hover:-translate-y-1 hover:border-violet/50' : 'opacity-60',
              )}
            >
              <div className="flex items-center justify-between">
                <Pill>{s.topic[lang]}</Pill>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {t('filterGrade')} {s.grade}
                </span>
              </div>
              <h3 className={cn('font-display text-lg font-bold', ACCENT_TEXT[s.accent])}>{s.name[lang]}</h3>
              <code className="mt-auto font-mono text-xs text-muted">{s.formula}</code>
              {!built && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber">{t('comingSoon')}</span>
              )}
            </GlassPanel>
          )
          return built ? (
            <Link key={s.id} to={`/lab/${s.id}`} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.id}>{card}</div>
          )
        })}
      </div>
    </Container>
  )
}
