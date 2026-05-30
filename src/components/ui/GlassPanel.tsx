import { cn } from '@/lib/cn'

export function GlassPanel({
  className,
  children,
  glow,
}: {
  className?: string
  children: React.ReactNode
  glow?: 'orange' | 'violet'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur-sm',
        glow === 'orange' && 'shadow-glow-orange',
        glow === 'violet' && 'shadow-glow-violet',
        className,
      )}
    >
      {children}
    </div>
  )
}
