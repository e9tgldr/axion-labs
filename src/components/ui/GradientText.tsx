import { cn } from '@/lib/cn'

export function GradientText({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <span className={cn('text-gradient', className)}>{children}</span>
}
