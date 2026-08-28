'use client'

import { cn } from '@/lib/utils'
import type { HazardLayer } from '@/lib/types'

export function HazardLayerSelector({
  layers,
  enabled,
  onToggle,
}: {
  layers: HazardLayer[]
  enabled: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <div className="layer-menu">
      <strong>MAP LAYERS</strong>
      {layers.map((layer) => (
        <label key={layer.id} className={cn(layer.futureIntegration && 'future')}>
          <input
            type="checkbox"
            checked={!!enabled[layer.id]}
            disabled={layer.futureIntegration}
            onChange={() => onToggle(layer.id)}
          />
          <span>{layer.name}</span>
          {layer.futureIntegration && <em>Future integration</em>}
        </label>
      ))}
    </div>
  )
}
