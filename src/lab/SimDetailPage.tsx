import { lazy, Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { resolveLang } from '@/i18n'
import { SIMULATIONS } from '@/data/simulations'
import { SIM_MODULES, isBuilt } from './registry'
import { SimPlayer } from './SimPlayer'
import { NotFound } from '@/routes/NotFound'
import { useAuth } from '@/auth/useAuth'
import { canAccessSim } from '@/auth/gating'
import { FavoriteButton } from '@/components/ui/FavoriteButton'

export function SimDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation('lab')
  const { user, profile } = useAuth()
  const lang = resolveLang(i18n.language)
  const meta = SIMULATIONS.find((s) => s.id === id)

  const LazyPlayer = useMemo(
    () =>
      lazy(async () => {
        const def = (await SIM_MODULES[id]()).default
        return { default: () => <SimPlayer def={def} /> }
      }),
    [id],
  )

  if (!meta || !isBuilt(id)) return <NotFound />

  const locked = !canAccessSim(profile?.plan ?? null, id)

  return (
    <Container className="py-12">
      <Button variant="ghost" size="sm" to="/lab" className="mb-6">
        ← {t('backToLab')}
      </Button>
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{meta.name[lang]}</h1>
          <Pill>{meta.topic[lang]}</Pill>
          {!locked && <FavoriteButton simId={id} />}
        </div>
        <p className="max-w-2xl text-muted">{t(`sims.${id}.desc`)}</p>
        <code className="font-mono text-sm text-orange">{meta.formula}</code>
      </div>

      {locked ? (
        <GlassPanel glow="violet" className="flex flex-col items-center gap-5 py-16 text-center">
          <span className="text-3xl">🔒</span>
          <h2 className="font-display text-2xl font-bold">{t('auth:upgradeTitle')}</h2>
          <p className="max-w-md text-muted">{t('auth:upgradeBody')}</p>
          <Button to={user ? '/dashboard' : '/login'}>
            {user ? t('auth:choosePlan') : t('auth:signInToUnlock')}
          </Button>
        </GlassPanel>
      ) : (
        <Suspense
          fallback={<div className="min-h-[420px] animate-pulse rounded-2xl border border-line bg-surface/40" />}
        >
          <LazyPlayer />
        </Suspense>
      )}
    </Container>
  )
}
