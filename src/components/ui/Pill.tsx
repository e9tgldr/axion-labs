import { cn } from '@/lib/cn'

export function Pill({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
