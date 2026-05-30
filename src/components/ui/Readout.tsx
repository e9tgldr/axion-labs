import { cn } from '@/lib/cn'

/** Monospace HUD-style readout: a small uppercase label over a value + optional unit. */
export function Readout({
  label,
  value,
  unit,
  className,
}: {
  label: string
  value: string
  unit?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface/60 px-4 py-3 font-mono backdrop-blur-sm',
        className,
      )}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="text-lg text-text">
        {value}
        {unit ? <span className="ml-1 text-orange">{unit}</span> : null}
      </div>
    </div>
  )
}
