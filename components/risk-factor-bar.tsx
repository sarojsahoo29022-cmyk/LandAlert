import type { RiskFactor } from '@/lib/types'

export function RiskFactorBar({ name, impact, width, tone }: RiskFactor) {
  return (
    <div className="factor">
      <div className="factor-label">
        <span>{name}</span>
        <b className={tone}>{impact}</b>
      </div>
      <div className="impact-track">
        <span className={tone} style={{ width }} />
      </div>
    </div>
  )
}
