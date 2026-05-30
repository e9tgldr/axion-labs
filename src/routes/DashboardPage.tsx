import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/PlanBadge'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/useAuth'
import { useTutor } from '@/tutor/useTutor'
import { resolveLang } from '@/i18n'
import { SIMULATIONS } from '@/data/simulations'
import type { Plan } from '@/auth/types'

const SWITCHABLE: Plan[] = ['free', 'standard', 'premium']

export function DashboardPage() {
  const { t, i18n } = useTranslation('auth')
  const lang = resolveLang(i18n.language)
  const { user, profile, favorites, setPlan, updateProfile, toggleFavorite, signOut } = useAuth()
  const { conversations, selectConversation } = useTutor()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.displayName ?? '')

  if (!profile || !user) return null
  const initial = profile.displayName.charAt(0).toUpperCase()

  return (
    <Container className="py-12">
      {/* profile header */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-axion font-display text-2xl font-bold text-bg">
          {initial}
        </span>
        <div className="flex flex-col gap-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                aria-label={t('displayName')}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-text outline-none focus:border-violet"
              />
              <Button
                size="sm"
                onClick={async () => {
                  await updateProfile({ displayName: name.trim() || profile.displayName })
                  setEditing(false)
                }}
              >
                {t('save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setName(profile.displayName); setEditing(false) }}>
                {t('cancel')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
              <PlanBadge plan={profile.plan} />
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-text"
              >
                {t('editName')}
              </button>
            </div>
          )}
          <span className="font-mono text-xs text-muted">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
        >
          {t('signOut')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* plan card */}
        <GlassPanel className="flex flex-col gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{t('planLabel')}</h2>
          <div className="flex flex-wrap gap-2">
            {SWITCHABLE.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={profile.plan === p}
                onClick={() => setPlan(p)}
                className={cn(
                  'rounded-xl border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors',
                  profile.plan === p
                    ? 'border-transparent bg-axion text-bg'
                    : 'border-line text-muted hover:text-text',
                )}
              >
                {t(`plan.${p}`)}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{t('demoNoCharge')}</p>
        </GlassPanel>

        {/* favorites */}
        <GlassPanel className="flex flex-col gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{t('favorites')}</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted">{t('noFavorites')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {favorites.map((f) => {
                const sim = SIMULATIONS.find((s) => s.id === f.simId)
                return (
                  <li
                    key={f.simId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/50 px-4 py-2.5"
                  >
                    <Link to={`/lab/${f.simId}`} className="text-sm text-text hover:text-violet">
                      {sim ? sim.name[lang] : f.simId}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(f.simId)}
                      className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-text"
                    >
                      {t('remove')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </GlassPanel>
      </div>

      {/* recent conversations */}
      <GlassPanel className="mt-6 flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{t('tutor:history')}</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted">{t('tutor:noHistory')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...conversations].reverse().slice(0, 5).map((conv) => (
              <li
                key={conv.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/50 px-4 py-2.5"
              >
                <Link
                  to="/tutor"
                  onClick={() => selectConversation(conv.id)}
                  className="text-sm text-text hover:text-violet"
                >
                  {conv.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </Container>
  )
}
