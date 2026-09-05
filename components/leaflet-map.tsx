'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Crosshair,
  Layers3,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { MapMarker, HazardLayer } from '@/lib/types'
import { RiskLegend } from './risk-legend'
import { HazardLayerSelector } from './hazard-layer-selector'

const STATE_GEO: Record<string, { lat: number; lng: number }> = {
  'Meghalaya': { lat: 25.4670, lng: 91.3662 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Mizoram': { lat: 23.1645, lng: 92.9376 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Sikkim': { lat: 27.5330, lng: 88.5122 },
  'Arunachal Pradesh': { lat: 28.2180, lng: 97.0840 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Tripura': { lat: 23.9408, lng: 92.0000 },
  'West Bengal': { lat: 22.9875, lng: 87.8550 },
}

const RISK_COLORS: Record<string, string> = {
  'low': '#27966a',
  'moderate': '#c99518',
  'high': '#df762d',
  'very-high': '#c94145',
}

const RISK_BG: Record<string, string> = {
  'low': 'rgba(39,150,106,0.12)',
  'moderate': 'rgba(201,149,24,0.12)',
  'high': 'rgba(223,118,45,0.12)',
  'very-high': 'rgba(201,65,69,0.12)',
}

export function LeafletMap({
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
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(layers.map((l) => [l.id, l.enabledByDefault])),
  )
  const [query, setQuery] = useState('')

  const toggle = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default

      if (cancelled || !mapRef.current) return

      const map = L.map(mapRef.current!, {
        center: [25.8, 93.0],
        zoom: 6,
        zoomControl: false,
        attributionControl: true,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      const markersLayer = L.layerGroup().addTo(map)

      mapInstanceRef.current = map
      markersLayerRef.current = markersLayer

      setTimeout(() => map.invalidateSize(), 100)
    }

    init()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    let cancelled = false

    async function updateMarkers() {
      const L = (await import('leaflet')).default
      if (cancelled) return

      const layer = markersLayerRef.current
      layer.clearLayers()

      markers.forEach((m) => {
        const geo = STATE_GEO[m.name]
        if (!geo) return

        const color = RISK_COLORS[m.level] || '#999'
        const bg = RISK_BG[m.level] || 'rgba(0,0,0,0.08)'
        const isSelected = selectedId === m.id

        const icon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div style="
              display:flex;align-items:center;justify-content:center;
              width:${isSelected ? 52 : 44}px;height:${isSelected ? 52 : 44}px;
              border-radius:50%;
              background:${bg};
              border:2.5px solid ${color};
              box-shadow:0 2px 8px rgba(0,0,0,${isSelected ? 0.25 : 0.12});
              cursor:pointer;
              transition:transform .15s,box-shadow .15s;
              ${isSelected ? 'transform:scale(1.15);' : ''}
            ">
              <span style="
                font-size:11px;font-weight:700;color:${color};
                line-height:1;
              ">${m.score}</span>
            </div>
          `,
          iconSize: [isSelected ? 52 : 44, isSelected ? 52 : 44],
          iconAnchor: [isSelected ? 26 : 22, isSelected ? 26 : 22],
        })

        const marker = L.marker([geo.lat, geo.lng], { icon })

        marker.on('click', () => onSelect?.(m.id))

        marker.bindTooltip(m.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'leaflet-tooltip-custom',
        })

        layer.addLayer(marker)
      })
    }

    updateMarkers()

    return () => { cancelled = true }
  }, [markers, selectedId, onSelect])

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()
  const handleLocate = () => mapInstanceRef.current?.setView([25.8, 93.0], 6)

  return (
    <div className={`map-panel ${compact ? 'compact-map' : ''}`} style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: compact ? 280 : 640, borderRadius: 'inherit' }} />

      <div className="map-controls">
        <button onClick={handleZoomIn} aria-label="Zoom in" type="button">
          <ZoomIn size={17} />
        </button>
        <button onClick={handleZoomOut} aria-label="Zoom out" type="button">
          <ZoomOut size={17} />
        </button>
        <button onClick={handleLocate} aria-label="Locate" type="button">
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
      <div className="map-credit">OpenStreetMap · Landslide-prone regions of NER India</div>
    </div>
  )
}
