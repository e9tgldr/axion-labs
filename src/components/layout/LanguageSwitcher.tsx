import { useTranslation } from 'react-i18next'
import { LANGS, type Lang } from '@/i18n'
import { cn } from '@/lib/cn'

const SHORT: Record<Lang, string> = { mn: 'МН', en: 'EN', zh: '中' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = (LANGS as readonly string[]).includes(i18n.language)
    ? (i18n.language as Lang)
    : 'mn'

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'inline-flex items-center rounded-lg border border-line bg-surface/60 p-0.5 font-mono text-xs',
        className,
      )}
    >
      {LANGS.map((lng) => {
        const active = lng === current
        return (
          <button
            key={lng}
            type="button"
            aria-pressed={active}
            onClick={() => i18n.changeLanguage(lng)}
            className={cn(
              'rounded-md px-2.5 py-1 transition-colors',
              active
                ? 'bg-axion text-bg font-semibold'
                : 'text-muted hover:text-text',
            )}
          >
            {SHORT[lng]}
          </button>
        )
      })}
    </div>
  )
}
