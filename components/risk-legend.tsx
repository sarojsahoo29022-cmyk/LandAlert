import type { RiskLevel } from '@/lib/types'

export function RiskLegend() {
  const items: { label: string; tone: RiskLevel }[] = [
    { label: 'Low', tone: 'low' },
    { label: 'Moderate', tone: 'moderate' },
    { label: 'High', tone: 'high' },
    { label: 'Very high', tone: 'very-high' },
  ]
  return (
    <div className="map-legend">
      <span className="legend-title">RISK LEVEL</span>
      {items.map((i) => (
        <span key={i.label}>
          <i className={`risk-pin ${i.tone}`} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
