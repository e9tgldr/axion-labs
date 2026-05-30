import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { GradientText } from '@/components/ui/GradientText'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { GridOverlay } from '@/components/ui/GridOverlay'
import { useAuth } from '@/auth/useAuth'

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6 0 9.2-4.2 9.2-9.5 0-.6-.07-1.1-.16-1.6H12z" />
    </svg>
  )
}

export function LoginPage() {
  const { t } = useTranslation('auth')
  const { user, isDemo, signInWithGoogle, signInWithPassword, signUp } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dest = params.get('from') || '/dashboard'

  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={dest} replace />

  const onGoogle = async () => {
    setError(null)
    try {
      await signInWithGoogle()
      // Demo signs in synchronously; real OAuth redirects away.
      navigate(dest)
    } catch {
      setError(t('errGeneric'))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password || (mode === 'up' && !name)) {
      setError(t('errFields'))
      return
    }
    setBusy(true)
    try {
      if (mode === 'in') await signInWithPassword(email, password)
      else await signUp(email, password, name)
      navigate(dest)
    } catch (err) {
      setError(err instanceof Error && /invalid|credential/i.test(err.message) ? t('errInvalid') : t('errGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-radial-plasma">
      <GridOverlay className="opacity-[0.12]" />
      <Container className="relative flex justify-center py-16">
        <GlassPanel glow="violet" className="w-full max-w-md">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <h1 className="font-display text-2xl font-bold">
              <GradientText>{t('loginTitle')}</GradientText>
            </h1>
            <p className="text-sm text-muted">{t('loginSubtitle')}</p>
          </div>

          {isDemo && (
            <Pill className="mb-5 w-full justify-center border-amber/40 text-amber">{t('demoBanner')}</Pill>
          )}

          <Button variant="outline" size="md" className="w-full" onClick={onGoogle}>
            <GoogleGlyph />
            {t('continueWithGoogle')}
          </Button>

          <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="h-px flex-1 bg-line" />
            {t('orEmail')}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            {mode === 'up' && (
              <Field label={t('displayName')} value={name} onChange={setName} type="text" />
            )}
            <Field label={t('email')} value={email} onChange={setEmail} type="email" />
            <Field label={t('password')} value={password} onChange={setPassword} type="password" />
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
            <Button type="submit" size="md" className="mt-1 w-full" disabled={busy}>
              {mode === 'in' ? t('signIn') : t('signUp')}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'in' ? 'up' : 'in'))
              setError(null)
            }}
            className="mt-5 w-full text-center font-mono text-xs text-muted underline-offset-4 hover:text-text hover:underline"
          >
            {mode === 'in' ? t('switchToSignUp') : t('switchToSignIn')}
          </button>
        </GlassPanel>
      </Container>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <input
        type={type}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-text outline-none focus:border-violet"
      />
    </label>
  )
}
