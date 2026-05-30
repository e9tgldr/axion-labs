import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlanBadge } from '@/components/ui/PlanBadge'
import { useAuth } from '@/auth/useAuth'

export function AccountMenu() {
  const { t } = useTranslation('auth')
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!profile) return null
  const initial = profile.displayName.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t('account')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface/60 py-1 pl-1 pr-2.5 transition-colors hover:border-violet"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-axion font-display text-sm font-bold text-bg">
          {initial}
        </span>
        <PlanBadge plan={profile.plan} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-line bg-bg/95 backdrop-blur-md">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-text hover:bg-surface"
          >
            {t('myDashboard')}
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false)
              await signOut()
              navigate('/')
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-muted hover:bg-surface hover:text-text"
          >
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
