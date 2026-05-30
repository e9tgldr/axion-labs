import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GridOverlay } from '@/components/ui/GridOverlay'
import { Button } from '@/components/ui/Button'

export function ComingSoon() {
  const { t } = useTranslation('landing')
  const { pathname } = useLocation()
  const routeName = pathname.replace('/', '').toUpperCase() || 'AXION'

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-radial-plasma">
      <GridOverlay className="opacity-20" />
      <Container className="relative flex flex-col items-center gap-8 py-24 text-center">
        <SectionHeading
          eyebrow={`${routeName} // ${t('comingSoon.title')}`}
          title={t('comingSoon.title')}
          subtitle={t('comingSoon.body')}
        />
        <Button to="/">{t('comingSoon.back')}</Button>
      </Container>
    </div>
  )
}
