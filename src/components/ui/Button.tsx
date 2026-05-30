import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'gradient' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-mono uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

const variants: Record<Variant, string> = {
  gradient: 'bg-axion text-bg font-semibold hover:shadow-glow-orange hover:brightness-110',
  outline: 'border border-line text-text hover:border-violet hover:text-violet',
  ghost: 'text-muted hover:text-text',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
}

type ButtonProps = {
  variant?: Variant
  size?: Size
  to?: string
  href?: string
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

/** Polymorphic action: renders a RouterLink (`to`), an anchor (`href`), or a button. */
export function Button({
  variant = 'gradient',
  size = 'md',
  to,
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className)
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
