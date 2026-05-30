import { cn } from '@/lib/cn'

/** Decorative HUD grid backdrop. Purely presentational, hidden from assistive tech. */
export function GridOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('grid-overlay pointer-events-none absolute inset-0', className)}
    />
  )
}
