import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { GradientText } from '@/components/ui/GradientText'
import { Readout } from '@/components/ui/Readout'
import { heroEnabled } from '@/three/webgl'

const HeroScene = lazy(() => import('@/three/HeroScene'))

function StaticHero() {
  return (
    <div
      data-testid="static-hero"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-radial-plasma"
    >
      <div className="grid-overlay absolute inset-0 opacity-[0.12]" />
      <svg
        className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-40 animate-spin-slow"
        viewBox="0 0 100 100"
      >
        <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#fb923c" strokeWidth="0.4" />
        <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#f472b6" strokeWidth="0.35" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#a855f7" strokeWidth="0.3" transform="rotate(120 50 50)" />
      </svg>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6 0 9.2-4.2 9.2-9.5 0-.6-.07-1.1-.16-1.6H12z" />
    </svg>
  )
}

export function Hero() {
  const { t } = useTranslation('landing')
  const enabled = heroEnabled()

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      {/* backdrop */}
      <div className="absolute inset-0 -z-0">
        {enabled ? (
          <Suspense fallback={<StaticHero />}>
            <HeroScene />
          </Suspense>
        ) : (
          <StaticHero />
        )}
      </div>
      {/* readability veil + bottom fade into page */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/10 to-bg" />

      <Container className="relative z-10 py-20">
        <div className="flex max-w-3xl flex-col items-start gap-6">
          <div className="animate-fade-up">
            <Pill>{t('hero.eyebrow')}</Pill>
          </div>
          <h1 className="animate-fade-up font-display text-4xl font-black leading-[1.08] sm:text-6xl [animation-delay:80ms]">
            <GradientText>{t('hero.title')}</GradientText>
          </h1>
          <p className="animate-fade-up max-w-xl text-base text-muted sm:text-lg [animation-delay:160ms]">
            {t('hero.subtitle')}
          </p>
          <div className="animate-fade-up flex flex-wrap items-center gap-4 [animation-delay:240ms]">
            <Button size="lg" to="/login">
              {t('hero.ctaPrimary')}
            </Button>
            <Button size="lg" variant="outline" to="/login">
              <GoogleGlyph />
              {t('hero.ctaGoogle')}
            </Button>
          </div>
          <p className="animate-fade-up font-mono text-xs uppercase tracking-widest text-muted [animation-delay:320ms]">
            {t('hero.trust')}
          </p>
        </div>
      </Container>

      {/* floating HUD readouts */}
      <Readout
        label={t('hero.r1l')}
        value={t('hero.r1v')}
        unit={t('hero.r1u')}
        className="absolute right-8 top-28 hidden animate-float lg:block"
      />
      <Readout
        label={t('hero.r2l')}
        value={t('hero.r2v')}
        unit={t('hero.r2u')}
        className="absolute right-24 top-1/2 hidden animate-float lg:block [animation-delay:1.5s]"
      />
      <Readout
        label={t('hero.r3l')}
        value={t('hero.r3v')}
        unit={t('hero.r3u')}
        className="absolute bottom-24 right-16 hidden animate-float lg:block [animation-delay:3s]"
      />
    </section>
  )
}
