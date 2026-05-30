import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { GradientText } from '@/components/ui/GradientText'
import { GridOverlay } from '@/components/ui/GridOverlay'
import { Button } from '@/components/ui/Button'

export function CtaBand() {
  const { t } = useTranslation('landing')
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-axion-soft px-6 py-16 text-center sm:px-16">
          <GridOverlay className="opacity-[0.06]" />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-2xl font-display text-3xl font-black leading-tight sm:text-5xl">
              <GradientText>{t('cta.title')}</GradientText>
            </h2>
            <p className="max-w-xl text-muted">{t('cta.subtitle')}</p>
            <Button size="lg" to="/login">
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
