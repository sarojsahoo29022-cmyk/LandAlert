'use client'

import { riskRainfallSeries } from '@/lib/mock-data'

export function RiskRainfallChart({ height = 180 }: { height?: number }) {
  const w = 640
  const h = height
  const maxRain = 100
  const maxRisk = 100
  const step = w / (riskRainfallSeries.length - 1)
  const rainToY = (v: number) => h - (v / maxRain) * h
  const riskToY = (v: number) => h - (v / maxRisk) * h

  const rainLine = riskRainfallSeries
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${rainToY(p.rainfall)}`)
    .join(' ')
  const riskLine = riskRainfallSeries
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${riskToY(p.risk)}`)
    .join(' ')

  return (
    <div className="risk-rainfall">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Rainfall versus risk chart">
        <path className="rr-rain" d={rainLine} />
        <path className="rr-risk" d={riskLine} />
        {riskRainfallSeries.map((p, i) => (
          <circle key={p.label} cx={i * step} cy={riskToY(p.risk)} r="3.5" className="rr-dot" />
        ))}
      </svg>
      <div className="x-labels">
        {riskRainfallSeries.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
