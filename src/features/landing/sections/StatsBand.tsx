import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'

export function StatsBand() {
  const { t } = useTranslation('landing')
  const items = [t('stats.sims'), t('stats.grades'), t('stats.langs'), t('stats.ai')]

  return (
    <section className="border-y border-line bg-surface-2/60">
      <Container className="grid grid-cols-2 divide-x divide-line md:grid-cols-4">
        {items.map((label, i) => (
          <div
            key={i}
            className="flex items-center justify-center gap-2 py-6 text-center font-mono text-sm uppercase tracking-widest text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-axion" />
            {label}
          </div>
        ))}
      </Container>
    </section>
  )
}
