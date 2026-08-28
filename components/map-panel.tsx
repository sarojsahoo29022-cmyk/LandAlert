'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Crosshair,
  Layers3,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { HazardLayer, MapMarker } from '@/lib/types'
import { RiskLegend } from './risk-legend'
import { HazardLayerSelector } from './hazard-layer-selector'

export function MapPanel({
  markers,
  layers,
  compact = false,
  selectedId,
  onSelect,
}: {
  markers: MapMarker[]
  layers: HazardLayer[]
  compact?: boolean
  selectedId?: string
  onSelect?: (id: string) => void
}) {
  const [layersOpen, setLayersOpen] = useState(false)
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(layers.map((l) => [l.id, l.enabledByDefault])),
  )
  const [query, setQuery] = useState('')

  const toggle = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className={`map-panel ${compact ? 'compact-map' : ''}`}>
      <div className="map-grid" />
      <div className="map-landmass">
        <span className="state-line one" />
        <span className="state-line two" />
        <span className="state-line three" />
        <span className="state-line four" />
      </div>
      <div className="map-label meghalaya">MEGHALAYA</div>
      <div className="map-label assam">ASSAM</div>
      <div className="map-label mizoram">MIZORAM</div>
      <div className="map-label manipur">MANIPUR</div>
      <div className="map-label sikkim">SIKKIM</div>
      <div className="map-label" style={{ left: '68%', top: '79%' }}>
        KERALA
      </div>
      <div className="map-label" style={{ left: '35%', top: '12%' }}>
        UTTARAKHAND
      </div>
      <div className="map-label" style={{ left: '28%', top: '20%' }}>
        HIMACHAL
      </div>
      <div className="map-label" style={{ left: '61%', top: '87%' }}>
        TAMIL NADU
      </div>

      {markers.map((m) => (
        <button
          key={m.id}
          className={`map-marker pin-${m.id} ${m.level} ${selectedId === m.id ? 'selected' : ''}`}
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          onClick={() => onSelect?.(m.id)}
          aria-label={`${m.name} risk ${m.score}`}
          type="button"
        >
          <span>{m.score}</span>
        </button>
      ))}

      <div className="map-controls">
        <button aria-label="Zoom in">
          <ZoomIn size={17} />
        </button>
        <button aria-label="Zoom out">
          <ZoomOut size={17} />
        </button>
        <button aria-label="Locate">
          <Crosshair size={17} />
        </button>
      </div>

      <button
        className="map-layer-button"
        onClick={() => setLayersOpen(!layersOpen)}
        type="button"
      >
        <Layers3 size={16} />
        Layers
        <ChevronDown size={14} />
      </button>

      {layersOpen && (
        <HazardLayerSelector layers={layers} enabled={enabled} onToggle={toggle} />
      )}

      <div className="map-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location on map…"
          aria-label="Search location on map"
        />
      </div>

      <RiskLegend />
      <div className="map-credit">Conceptual map · Landslide-prone regions of India</div>
    </div>
  )
}
