import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Reveal } from '@/components/ui/Reveal'

function ScoreRing({ score = 92, label }: { score?: number; label: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div className="flex items-center gap-4" role="img" aria-label={`${label}: ${score}%`}>
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true" focusable="false">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1E2A3F" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-xl font-bold">{score}</span>
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
    </div>
  )
}

export function ExamsSection() {
  const { t } = useTranslation('landing')
  const opts = [
    { k: 'A', v: t('exams.optA'), correct: true },
    { k: 'B', v: t('exams.optB'), correct: false },
    { k: 'C', v: t('exams.optC'), correct: false },
    { k: 'D', v: t('exams.optD'), correct: false },
  ]

  return (
    <section className="border-y border-line bg-surface-2/40 py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <GlassPanel glow="orange" className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">Q-07 / 20</span>
              <span className="font-mono text-xs text-orange">AI — 18 + 2</span>
            </div>
            <p className="text-base font-medium leading-relaxed">{t('exams.q')}</p>
            <ul className="flex flex-col gap-2">
              {opts.map((o) => (
                <li
                  key={o.k}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    o.correct ? 'border-violet/60 bg-violet/10 text-text' : 'border-line bg-surface/60 text-text/80'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs ${
                      o.correct ? 'bg-axion text-bg' : 'border border-line text-muted'
                    }`}
                  >
                    {o.k}
                  </span>
                  {o.v}
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-4">
              <ScoreRing label={t('exams.scoreLabel')} />
            </div>
          </GlassPanel>
        </Reveal>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow={t('exams.eyebrow')}
            title={t('exams.title')}
            subtitle={t('exams.subtitle')}
          />
        </div>
      </Container>
    </section>
  )
}
