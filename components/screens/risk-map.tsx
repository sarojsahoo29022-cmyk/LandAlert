'use client'

import { useEffect, useState } from 'react'
import { Filter as FilterIcon, Layers3, ChevronDown, CloudRain, Mountain, Compass } from 'lucide-react'
import {
  hazardLayers,
  riskRainfallSeries,
} from '@/lib/mock-data'
import { MapPanel } from '../map-panel'
import { RiskScoreIndicator } from '../risk-score-indicator'
import { StatusBadge } from '../status-badge'
import { FilterControls } from '../filter-controls'
import { RiskTrendChart } from '../risk-trend-chart'
import {
  fetchSnapshot,
  predictRisk,
  toRiskTone,
  probabilityToScore,
  type SnapshotState,
} from '@/lib/ml-api'
import type { MapMarker, HazardLayer, RiskLevel } from '@/lib/types'

const riskLevelOptions = ['All', 'Low', 'Moderate', 'High', 'Very high']
const hazardTypeOptions = [
  'Landslide',
  'Extreme Rainfall',
  'Debris Flow',
  'Flash Flood',
  'Mountain Hazard',
]

const STATE_COORDS: Record<string, { x: number; y: number; state: string }> = {
  'Meghalaya': { x: 62, y: 48, state: 'Meghalaya' },
  'Assam': { x: 58, y: 38, state: 'Assam' },
  'Mizoram': { x: 72, y: 68, state: 'Mizoram' },
  'Manipur': { x: 74, y: 52, state: 'Manipur' },
  'Sikkim': { x: 52, y: 32, state: 'Sikkim' },
  'Arunachal Pradesh': { x: 68, y: 22, state: 'Arunachal Pradesh' },
  'Nagaland': { x: 78, y: 38, state: 'Nagaland' },
  'Tripura': { x: 66, y: 62, state: 'Tripura' },
  'West Bengal': { x: 48, y: 42, state: 'West Bengal' },
}

export function RiskMapScreen() {
  const [selectedId, setSelectedId] = useState('Meghalaya')
  const [riskLevel, setRiskLevel] = useState('All')
  const [hazardType, setHazardType] = useState('Landslide')
  const [snapshotData, setSnapshotData] = useState<SnapshotState[]>([])
  const [liveMarkers, setLiveMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSnapshot() {
      const data = await fetchSnapshot()
      if (data && data.length > 0) {
        setSnapshotData(data)
        const markers: MapMarker[] = data.map((s) => {
          const coords = STATE_COORDS[s.state] || { x: 50, y: 50, state: s.state }
          const tone = toRiskTone(s.risk_level)
          return {
            id: s.state,
            name: s.state,
            x: coords.x,
            y: coords.y,
            score: probabilityToScore(s.probability),
            level: tone,
            hazard: 'landslide',
          }
        })
        setLiveMarkers(markers)
      }
      setLoading(false)
    }
    loadSnapshot()
  }, [])

  const selectedState = snapshotData.find((s) => s.state === selectedId)
  const selectedMarker = liveMarkers.find((m) => m.id === selectedId)

  const filteredMarkers = liveMarkers.filter((m) => {
    if (riskLevel === 'All') return true
    return m.level === riskLevel.toLowerCase().replace(' ', '-')
  })

  return (
    <div className="screen-content map-screen">
      <div className="screen-header">
        <div>
          <span className="eyebrow">RISK MAP</span>
          <h1>Regional risk map</h1>
          <p>Explore live ML risk assessments across North-Eastern India.</p>
        </div>
        <div className="map-filters">
          <button className="secondary-button" type="button">
            <FilterIcon size={16} />
            All risk levels <ChevronDown size={14} />
          </button>
          <button className="secondary-button" type="button">
            <Layers3 size={16} />
            Hazard type <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <FilterControls
        groups={[
          { label: 'RISK LEVEL', options: riskLevelOptions, selected: riskLevel, onSelect: setRiskLevel },
          { label: 'HAZARD TYPE', options: hazardTypeOptions, selected: hazardType, onSelect: setHazardType },
        ]}
      />

      <div className="full-map-layout">
        <MapPanel
          markers={filteredMarkers}
          layers={hazardLayers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <section className="panel map-side-panel">
          <div className="section-kicker">SELECTED LOCATION</div>
          <h2>
            {selectedId}{selectedState ? `, ${selectedState.state}` : ''}
          </h2>
          <div className="side-score">
            <RiskScoreIndicator
              score={selectedMarker?.score ?? 0}
              level={selectedMarker?.level ?? 'low'}
              size={110}
            />
            <div>
              <StatusBadge tone={selectedMarker?.level ?? 'low'}>
                {selectedMarker?.level === 'very-high' ? 'VERY HIGH RISK' :
                 selectedMarker?.level === 'high' ? 'HIGH RISK' :
                 selectedMarker?.level === 'moderate' ? 'MODERATE RISK' : 'LOW RISK'}
              </StatusBadge>
              <p>{selectedMarker?.score ?? 0}% assessment score</p>
            </div>
          </div>

          <div className="side-details">
            <div>
              <span>Rainfall</span>
              <b>{selectedState?.rainfall_mm ? `${Math.round(selectedState.rainfall_mm)} mm` : 'N/A'}</b>
            </div>
            <div>
              <span>Temperature</span>
              <b>{selectedState?.temp_2m ? `${selectedState.temp_2m.toFixed(1)}°C` : 'N/A'}</b>
            </div>
            <div>
              <span>Probability</span>
              <b>{selectedState ? `${(selectedState.probability * 100).toFixed(1)}%` : 'N/A'}</b>
            </div>
            <div>
              <span>Historical susceptibility</span>
              <StatusBadge tone={selectedMarker?.level ?? 'low'}>Based on ML model</StatusBadge>
            </div>
          </div>

          <div className="side-trend">
            <div>
              <span>Risk trend</span>
              <b>
                {selectedState?.risk_level === 'High' || selectedState?.risk_level === 'Very High'
                  ? 'Elevated' : 'Stable'}{' '}
                <span className="trend-up">
                  {selectedState?.risk_level === 'Very High' ? 'Critical' :
                   selectedState?.risk_level === 'High' ? 'Rising' : 'Normal'}
                </span>
              </b>
            </div>
            <div className="mini-chart">
              {riskRainfallSeries.map((p, i) => (
                <span key={i} style={{ height: `${p.risk}%` }} />
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="section-kicker">RISK LEVEL FILTER</div>
            <div className="filter-pills small">
              {riskLevelOptions.map((o) => (
                <button
                  key={o}
                  className={riskLevel === o ? 'selected' : ''}
                  onClick={() => setRiskLevel(o)}
                  type="button"
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="section-kicker">HAZARD TYPE FILTER</div>
            <div className="hazard-filter-list">
              <label>
                <input type="checkbox" defaultChecked /> Landslide
              </label>
              <label>
                <input type="checkbox" /> Extreme rainfall
              </label>
              <label className="future">
                <input type="checkbox" disabled /> Debris flow <em>Future integration</em>
              </label>
              <label className="future">
                <input type="checkbox" disabled /> Flash flood <em>Future integration</em>
              </label>
              <label className="future">
                <input type="checkbox" disabled /> Mountain hazard <em>Future integration</em>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
