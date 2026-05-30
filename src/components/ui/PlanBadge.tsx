import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { Plan } from '@/auth/types'

const STYLE: Record<Plan, string> = {
  free: 'border-line text-muted',
  standard: 'border-violet/50 text-violet',
  premium: 'border-transparent bg-axion text-bg',
  admin: 'border-transparent bg-axion text-bg',
}

export function PlanBadge({ plan, className }: { plan: Plan; className?: string }) {
  const { t } = useTranslation('auth')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest',
        STYLE[plan],
        className,
      )}
    >
      {t(`plan.${plan}`)}
    </span>
  )
}
