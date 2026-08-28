import type { Hotspot } from '@/lib/types'
import { StatusBadge } from './status-badge'

export function RiskHotspotList({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <div className="hotspot-list">
      {hotspots.map((h) => (
        <div key={h.name}>
          <i className={`risk-pin ${h.level}`} />
          <span>{h.name}</span>
          <StatusBadge tone={h.level}>
            {h.level === 'very-high'
              ? 'Very high'
              : h.level === 'high'
                ? 'High'
                : h.level === 'moderate'
                  ? 'Moderate'
                  : 'Low'}
          </StatusBadge>
        </div>
      ))}
    </div>
  )
}
