import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

export function StatCard({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string
  value: string
  hint?: string
  tone?: RiskLevel | 'high'
  className?: string
}) {
  return (
    <div className={cn('stat-card', tone && `tone-${tone}`, className)}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}
