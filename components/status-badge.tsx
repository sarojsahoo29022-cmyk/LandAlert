import { cn } from '@/lib/utils'
import type { AlertTone } from '@/lib/types'

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: AlertTone
  children: React.ReactNode
  className?: string
}) {
  return <span className={cn('status-badge', tone, className)}>{children}</span>
}
