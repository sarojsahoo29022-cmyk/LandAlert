import { Activity } from 'lucide-react'
import type { RiskLevel } from '@/lib/types'

export function RiskCard({
  label,
  value,
  meta,
  tone,
}: {
  label: string
  value: string
  meta: string
  tone: RiskLevel
}) {
  return (
    <div className="risk-card">
      <div className={`risk-bar ${tone}`} />
      <div className="risk-card-content">
        <span className="risk-card-label">{label}</span>
        <strong>{value}</strong>
        <span>{meta}</span>
      </div>
      <div className={`risk-icon ${tone}`}>
        <Activity size={16} />
      </div>
    </div>
  )
}
