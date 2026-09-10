'use client'

import { AlertTriangle, ChevronRight, CloudRain, Compass, Mountain } from 'lucide-react'
import type { SelectedLocation } from '@/lib/types'
import { RiskScoreIndicator } from './risk-score-indicator'
import { StatusBadge } from './status-badge'

export function LocationDetails({
  location,
  onViewDetails,
}: {
  location: SelectedLocation
  onViewDetails?: () => void
}) {
  return (
    <section className="location-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">SELECTED LOCATION</span>
          <h2>
            {location.name}, {location.state}
          </h2>
        </div>
        {onViewDetails && (
          <button className="text-button" onClick={onViewDetails} type="button">
            View details <ChevronRight size={15} />
          </button>
        )}
      </div>

      <div className="location-main">
        <RiskScoreIndicator score={location.score} level={location.level} />
        <div className="location-status">
          <StatusBadge tone={location.level}>
            {location.level === 'very-high'
              ? 'VERY HIGH RISK'
              : location.level === 'high'
                ? 'HIGH RISK'
                : location.level === 'moderate'
                  ? 'MODERATE RISK'
                  : 'LOW RISK'}
          </StatusBadge>
          <p>Last updated {location.updated}</p>
          <div className="location-meta">
            <span>
              <CloudRain size={15} />
              <b>{location.rainfall}</b>
              <small>Rainfall</small>
            </span>
            <span>
              <Mountain size={15} />
              <b>{location.slope}</b>
              <small>Slope</small>
            </span>
            <span>
              <Compass size={15} />
              <b>{location.elevation}</b>
              <small>Elevation</small>
            </span>
            {location.temperature && (
              <span>
                <AlertTriangle size={15} />
                <b>{location.temperature}</b>
                <small>Temp</small>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="context-box">
        <div>
          <strong>Primary hazard</strong>
          <span>
            <AlertTriangle size={14} /> {location.primaryHazard}
          </span>
        </div>
        <div>
          <strong>Potential cascading concern</strong>
          <span>{location.cascadingConcern}</span>
        </div>
      </div>
    </section>
  )
}
