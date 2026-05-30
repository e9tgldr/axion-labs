import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useAuth } from '@/auth/useAuth'

/** Star toggle for a simulation. Hidden for signed-out users. */
export function FavoriteButton({ simId, className }: { simId: string; className?: string }) {
  const { t } = useTranslation('auth')
  const { user, isFavorite, toggleFavorite } = useAuth()
  if (!user) return null
  const active = isFavorite(simId)
  return (
    <button
      type="button"
      aria-label={t(active ? 'removeFavorite' : 'addFavorite')}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void toggleFavorite(simId)
      }}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface/70 transition-colors hover:border-violet',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn('h-4 w-4', active ? 'fill-orange text-orange' : 'fill-none text-muted')}
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          strokeLinejoin="round"
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.7l1-5.8L3.5 9.7l5.9-.9z"
        />
      </svg>
    </button>
  )
}
