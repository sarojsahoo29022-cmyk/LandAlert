'use client'

import { riskTrend } from '@/lib/mock-data'

export function RiskTrendChart({ height = 160 }: { height?: number }) {
  const values = riskTrend.map((p) => p.value)
  const max = 100
  const min = 0
  const w = 640
  const h = height
  const toY = (v: number) => h - ((v - min) / (max - min)) * h
  const step = w / (values.length - 1)
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * step},${toY(v)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const forecastStart = 3 // index where demo forecast begins
  const forecastLine = values
    .slice(forecastStart - 1)
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(forecastStart - 1 + i) * step},${toY(v)}`)
    .join(' ')

  return (
    <div className="chart">
      <div className="y-labels">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Risk trend chart">
        <path className="chart-area" d={area} />
        <path className="chart-line" d={line} />
        <path className="forecast-line" d={forecastLine} />
        <circle cx={3 * step} cy={toY(values[3])} r="4" className="chart-point" />
      </svg>
      <div className="x-labels">
        {riskTrend.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
