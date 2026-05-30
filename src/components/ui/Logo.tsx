import { useId } from 'react'
import { cn } from '@/lib/cn'

/** Axion Labs mark: an orbital atom (nucleus + 3 electron rings) in the plasma gradient. */
export function Logo({
  size = 32,
  withWordmark = false,
  className,
}: {
  size?: number
  withWordmark?: boolean
  className?: string
}) {
  // Stable, collision-free gradient id (StrictMode-safe, no render side effects).
  const gid = `axion-logo-grad-${useId()}`
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        // When the wordmark is shown the icon is decorative (the text names the brand);
        // icon-only usage exposes the brand name via role/aria-label.
        role={withWordmark ? undefined : 'img'}
        aria-label={withWordmark ? undefined : 'Axion Labs'}
        aria-hidden={withWordmark ? true : undefined}
        focusable="false"
        className="shrink-0"
      >
        <defs>
          <radialGradient id={gid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#a855f7" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="16" fill={`url(#${gid})`} />
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="14"
          fill="none"
          stroke="#fb923c"
          strokeWidth="5"
          opacity="0.9"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="14"
          fill="none"
          stroke="#f472b6"
          strokeWidth="4"
          opacity="0.6"
          transform="rotate(60 50 50)"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="14"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          opacity="0.6"
          transform="rotate(120 50 50)"
        />
      </svg>
      {withWordmark ? (
        <span className="font-display text-lg font-bold tracking-wide">
          Axion<span className="text-gradient"> Labs</span>
        </span>
      ) : null}
    </span>
  )
}
