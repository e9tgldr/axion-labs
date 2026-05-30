import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AccountMenu } from './AccountMenu'
import { useAuth } from '@/auth/useAuth'

const LINKS = [
  { to: '/lab', key: 'nav.lab' },
  { to: '/tutor', key: 'nav.tutor' },
  { to: '/exams', key: 'nav.exams' },
  { to: '/pricing', key: 'nav.pricing' },
] as const

export function Navbar() {
  const { t } = useTranslation('landing')
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrolled(window.scrollY > 8)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-line bg-bg/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label={t('a11y.home')} className="shrink-0">
          <Logo withWordmark />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'text-sm text-muted transition-colors hover:text-text',
                  isActive && 'text-text',
                )
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">
                {t('nav.signIn')}
              </Button>
              <Button variant="gradient" size="sm" to="/login">
                {t('nav.enter')}
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={t('a11y.menu')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-text md:hidden"
        >
          <span className="text-lg">{open ? '✕' : '☰'}</span>
        </button>
      </nav>

      {open ? (
        <div className="border-t border-line bg-bg/95 px-5 py-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-text"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3">
              <LanguageSwitcher />
              {user ? (
                <Button variant="gradient" size="sm" to="/dashboard" onClick={() => setOpen(false)}>
                  {t('auth:myDashboard')}
                </Button>
              ) : (
                <Button variant="gradient" size="sm" to="/login" onClick={() => setOpen(false)}>
                  {t('nav.enter')}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
