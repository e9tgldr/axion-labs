import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  const { t } = useTranslation('landing')
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-radial-plasma">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-20" />
      <Container className="relative flex flex-col items-center gap-8 py-24 text-center">
        <span className="font-display text-7xl font-black text-gradient">404</span>
        <SectionHeading title={t('notFound.title')} subtitle={t('notFound.body')} />
        <Button to="/">{t('notFound.back')}</Button>
      </Container>
    </div>
  )
}
