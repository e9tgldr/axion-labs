import { cn } from '@/lib/cn'

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (n: number) => void
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span>{label}</span>
        <span className="text-text">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-orange"
      />
    </label>
  )
}
