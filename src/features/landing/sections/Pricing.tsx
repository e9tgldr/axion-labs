import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { GradientText } from '@/components/ui/GradientText'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'
import { PLANS } from '@/data/pricing'
import { useAuth } from '@/auth/useAuth'

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-violet" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" focusable="false">
      <path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Pricing() {
  const { t } = useTranslation('landing')
  const { user, setPlan } = useAuth()
  const navigate = useNavigate()

  return (
    <section className="border-t border-line py-24">
      <Container className="flex flex-col items-center gap-14">
        <SectionHeading eyebrow={t('pricing.eyebrow')} title={t('pricing.title')} />

        <div className="grid w-full gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100} className={cn(plan.highlight && 'md:-mt-4 md:mb-4')}>
              <GlassPanel
                glow={plan.highlight ? 'violet' : undefined}
                className={cn(
                  'relative flex h-full flex-col gap-6',
                  plan.highlight && 'border-violet/50',
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-axion px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-bg">
                    {t('pricing.mostPopular')}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">{t(plan.nameKey)}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-black">
                      <GradientText>{t(plan.priceKey)}</GradientText>
                    </span>
                    {plan.id !== 'free' && <span className="font-mono text-xs text-muted">{t('pricing.perYear')}</span>}
                  </div>
                </div>
                <ul className="flex flex-1 flex-col gap-3">
                  {plan.featureKeys.map((fk) => (
                    <li key={fk} className="flex items-center gap-2.5 text-sm text-text/90">
                      <Check />
                      {t(fk)}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Button
                    variant={plan.highlight ? 'gradient' : 'outline'}
                    className="w-full"
                    onClick={async () => {
                      await setPlan(plan.id)
                      navigate('/dashboard')
                    }}
                  >
                    {t('pricing.choose')}
                  </Button>
                ) : (
                  <Button variant={plan.highlight ? 'gradient' : 'outline'} to="/login" className="w-full">
                    {t('pricing.choose')}
                  </Button>
                )}
              </GlassPanel>
            </Reveal>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 text-center font-mono text-xs uppercase tracking-widest text-muted">
          <span>{t('pricing.trial')}</span>
          <span>{t('pricing.student')}</span>
        </div>
      </Container>
    </section>
  )
}
