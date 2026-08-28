'use client'

import { useState } from 'react'
import { Filter as FilterIcon, Layers3, ChevronDown, CloudRain, Mountain, Compass } from 'lucide-react'
import {
  hazardLayers,
  mapMarkers,
  riskFactors,
  riskRainfallSeries,
  selectedLocation,
} from '@/lib/mock-data'
import { MapPanel } from '../map-panel'
import { RiskScoreIndicator } from '../risk-score-indicator'
import { StatusBadge } from '../status-badge'
import { FilterControls } from '../filter-controls'
import { RiskTrendChart } from '../risk-trend-chart'

const riskLevelOptions = ['All', 'Low', 'Moderate', 'High', 'Very high']
const hazardTypeOptions = [
  'Landslide',
  'Extreme Rainfall',
  'Debris Flow',
  'Flash Flood',
  'Mountain Hazard',
]

export function RiskMapScreen() {
  const [selectedId, setSelectedId] = useState('shillong')
  const [riskLevel, setRiskLevel] = useState('All')
  const [hazardType, setHazardType] = useState('Landslide')

  return (
    <div className="screen-content map-screen">
      <div className="screen-header">
        <div>
          <span className="eyebrow">RISK MAP</span>
          <h1>Regional risk map</h1>
          <p>Explore demonstration risk layers across North-Eastern India.</p>
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
        <MapPanel markers={mapMarkers} layers={hazardLayers} selectedId={selectedId} onSelect={setSelectedId} />

        <section className="panel map-side-panel">
          <div className="section-kicker">SELECTED LOCATION</div>
          <h2>
            {selectedLocation.name}, {selectedLocation.state}
          </h2>
          <div className="side-score">
            <RiskScoreIndicator score={selectedLocation.score} level={selectedLocation.level} size={110} />
            <div>
              <StatusBadge tone={selectedLocation.level}>HIGH RISK</StatusBadge>
              <p>82% assessment score</p>
            </div>
          </div>

          <div className="side-details">
            <div>
              <span>Rainfall</span>
              <b>{selectedLocation.rainfall}</b>
            </div>
            <div>
              <span>Slope</span>
              <b>{selectedLocation.slope}</b>
            </div>
            <div>
              <span>Elevation</span>
              <b>{selectedLocation.elevation}</b>
            </div>
            <div>
              <span>Historical susceptibility</span>
              <StatusBadge tone={selectedLocation.historicalSusceptibility}>Medium</StatusBadge>
            </div>
          </div>

          <div className="side-trend">
            <div>
              <span>Risk trend</span>
              <b>
                {selectedLocation.trend} <span className="trend-up">{selectedLocation.trendDelta}</span>
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
