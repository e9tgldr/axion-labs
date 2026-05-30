import { cn } from '@/lib/cn'
import { Pill } from './Pill'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow ? <Pill>{eyebrow}</Pill> : null}
      <h2 className="max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-base text-muted sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  )
}
